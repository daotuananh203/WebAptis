/**
 * AI Speaking Grading Service
 * Uses Google Gemini 3.7 Flash with native multimodal audio input, STT, and error memory tracking.
 */

import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { GoogleGenAI, Type } from "@google/genai";
import { getGeminiClient } from "../gemini/client";
import { getGeminiConfig } from "../gemini/config";
import { GEMINI_MODELS } from "../gemini/models";
import { createGradingError } from "./errors";
import {
  SPEAKING_EXAMINER_SYSTEM_INSTRUCTION,
  buildSpeakingGradingPrompt,
} from "./prompts/speaking";
import {
  GeminiSpeakingOutput,
  GeminiSpeakingOutputSchema,
  AllowedSpeakingMimeTypes,
  SpeakingGradingResult,
  SpeakingTaskContext,
} from "./speaking-schema";
import { AptisPublicTestDataset } from "../exam/types";
import { retrieveRelevantKnowledge } from "../knowledge/retriever";
import { recordUserError } from "../memory/store";
import { AiGradingTimeoutError, withAiGradingTimeout } from "./ai-timeout";
import { resolveSpeakingImageUrl } from "../speaking/image-availability";
import { getSpeakingPracticeItem, SpeakingPracticeQuestion, SpeakingPracticeTopic } from "../speaking/practice-bank";

export const MAX_AUDIO_BYTES = 10 * 1024 * 1024;
const MAX_SPEAKING_IMAGE_BYTES = 5 * 1024 * 1024;

/**
 * Ask Gemini to produce the same shape that the server validates.  JSON mode
 * alone guarantees syntax, not field names or nested rubric structure; this
 * schema prevents a valid recording from being rejected merely because the
 * model chose `score`/`band` aliases. The parser remains as a compatibility
 * boundary for providers/models that return an older but recoverable shape.
 */
const GEMINI_SPEAKING_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    audioQuality: { type: Type.STRING, enum: ["sufficient", "insufficient"] },
    audioQualityReason: { type: Type.STRING, nullable: true },
    overallScore: { type: Type.NUMBER, minimum: 0, maximum: 25 },
    maxOverallScore: { type: Type.NUMBER, minimum: 1, maximum: 25 },
    estimatedBand: { type: Type.STRING, enum: ["A1", "A2", "B1", "B2", "C1", "C2"] },
    criteria: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          score: { type: Type.NUMBER, minimum: 0, maximum: 5 },
          maxScore: { type: Type.NUMBER, minimum: 5, maximum: 5 },
          feedback: { type: Type.STRING },
        },
        required: ["name", "score", "maxScore", "feedback"],
      },
    },
    pronunciationFeedback: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          soundOrWord: { type: Type.STRING },
          issue: { type: Type.STRING },
          advice: { type: Type.STRING },
        },
        required: ["soundOrWord", "issue", "advice"],
      },
    },
    spokenGrammarErrors: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          spokenPhrase: { type: Type.STRING },
          correctedPhrase: { type: Type.STRING },
          errorCategory: { type: Type.STRING },
          explanation: { type: Type.STRING },
          linkedKnowledge: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["spokenPhrase", "correctedPhrase", "errorCategory", "explanation", "linkedKnowledge"],
      },
    },
    vocabularyUpgrades: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          originalSpoken: { type: Type.STRING },
          upgradedAlternative: { type: Type.STRING },
          context: { type: Type.STRING },
        },
        required: ["originalSpoken", "upgradedAlternative", "context"],
      },
    },
    strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
    areasForImprovement: { type: Type.ARRAY, items: { type: Type.STRING } },
    transcript: { type: Type.STRING },
    improvementPlan: { type: Type.ARRAY, items: { type: Type.STRING } },
    linkedKnowledge: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: [
    "audioQuality", "audioQualityReason", "overallScore", "maxOverallScore",
    "estimatedBand", "criteria", "pronunciationFeedback", "spokenGrammarErrors",
    "vocabularyUpgrades", "strengths", "areasForImprovement", "transcript",
    "improvementPlan", "linkedKnowledge",
  ],
} as const;

type GeminiInlineImagePart = {
  inlineData: {
    mimeType: string;
    data: string;
  };
};

/**
 * Load the exact public task images as Gemini inline parts.  Image URLs are
 * resolved through the same allow-list used by the browser, then constrained
 * to the public directory so a task cannot make the examiner read arbitrary
 * server files.  This keeps the examiner's visual context aligned with the
 * images rendered for the learner.
 */
export function loadSpeakingImageInlineParts(
  imageUrls?: string[]
): GeminiInlineImagePart[] {
  if (!imageUrls || imageUrls.length === 0) return [];

  const publicRoot = path.resolve(process.cwd(), "public");
  return imageUrls.map((imageUrl) => {
    const resolvedUrl = resolveSpeakingImageUrl(imageUrl);
    if (!resolvedUrl) {
      throw createGradingError(
        "INVALID_TASK_CONTEXT",
        "Speaking task image context is unavailable"
      );
    }

    const imagePath = path.resolve(publicRoot, resolvedUrl.slice(1));
    const relativePath = path.relative(publicRoot, imagePath);
    if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
      throw createGradingError(
        "INVALID_TASK_CONTEXT",
        "Speaking task image path is outside the public asset directory"
      );
    }
    if (!fs.existsSync(imagePath)) {
      throw createGradingError(
        "INVALID_TASK_CONTEXT",
        "Speaking task image asset is missing"
      );
    }

    const stat = fs.statSync(imagePath);
    if (!stat.isFile() || stat.size <= 0 || stat.size > MAX_SPEAKING_IMAGE_BYTES) {
      throw createGradingError(
        "INVALID_TASK_CONTEXT",
        "Speaking task image asset has an invalid size"
      );
    }

    const bytes = fs.readFileSync(imagePath);
    return {
      inlineData: {
        mimeType: detectImageMimeType(bytes, imagePath),
        data: bytes.toString("base64"),
      },
    };
  });
}

/** Resolve only an exact task id or an unambiguous legacy suffix. */
type SpeakingQuestionLike = {
  id: string;
  prompt: string;
  preparationTimeSeconds: number;
  responseTimeSeconds: number;
};

function findSpeakingQuestion<T extends SpeakingQuestionLike>(
  questions: T[],
  taskId?: string,
): T | undefined {
  if (!taskId) return questions[0];
  const exact = questions.find((question) => question.id === taskId);
  if (exact) return exact;

  // Older UI payloads used ids such as `s2_q1` while datasets used
  // `t01_s2_q1`. Accept that documented alias only when it identifies one
  // question; never fall through to another question or another part.
  const suffixMatches = questions.filter((question) =>
    typeof question.id === "string" && question.id.endsWith(`_${taskId}`),
  );
  return suffixMatches.length === 1 ? suffixMatches[0] : undefined;
}

function detectImageMimeType(bytes: Buffer, imagePath: string): string {
  if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    return "image/png";
  }
  if (bytes.subarray(0, 3).equals(Buffer.from([255, 216, 255]))) {
    return "image/jpeg";
  }
  if (bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP") {
    return "image/webp";
  }
  const extension = path.extname(imagePath).toLowerCase();
  if (extension === ".jpg" || extension === ".jpeg") return "image/jpeg";
  if (extension === ".webp") return "image/webp";
  return "image/png";
}

export function resolveSpeakingTaskContext(
  testId: string,
  partNumber: number,
  taskId?: string,
  practiceItemId?: string
): SpeakingTaskContext {
  // Canonical Speaking Practice is deliberately resolved independently from
  // mock-test datasets. The explicit item id prevents a recording from being
  // graded against another test's prompt or image.
  if (practiceItemId) {
    const item = getSpeakingPracticeItem(partNumber, practiceItemId);
    if (!item) {
      throw createGradingError("UNKNOWN_QUESTION", `Speaking Practice item not found: ${practiceItemId}`);
    }
    if ("questionId" in item) {
      const question = item as SpeakingPracticeQuestion;
      if (taskId && taskId !== question.questionId) {
        throw createGradingError("UNKNOWN_QUESTION", `Speaking Practice question does not belong to item: ${taskId}`);
      }
      return {
        testId,
        practiceItemId,
        partNumber: 1,
        taskType: "personal-information",
        taskId: question.questionId,
        instructions: "Answer the personal information question clearly and naturally.",
        prompt: question.question,
        preparationTimeSeconds: 0,
        responseTimeSeconds: 30,
      };
    }
    const topic = item as SpeakingPracticeTopic;
    let questionIndex = 0;
    if (taskId) {
      const prefix = `${topic.topicId}-q`;
      const suffix = taskId.startsWith(prefix) ? taskId.slice(prefix.length) : "";
      if (!/^[1-9]\d*$/.test(suffix)) {
        throw createGradingError("UNKNOWN_QUESTION", `Speaking Practice task does not belong to item: ${taskId}`);
      }
      questionIndex = Number(suffix) - 1;
      if (!Number.isSafeInteger(questionIndex) || questionIndex < 0 || questionIndex >= topic.prompts.length) {
        throw createGradingError("UNKNOWN_QUESTION", `Speaking Practice task is outside the topic prompt range: ${taskId}`);
      }
    }
    const prompt = topic.prompts[questionIndex] || topic.prompts[0];
    if (!prompt) throw createGradingError("UNKNOWN_QUESTION", `Speaking Practice topic has no prompt: ${practiceItemId}`);
    const imageUrls = partNumber === 3
      ? [topic.imageA, topic.imageB].map((image) => resolveSpeakingImageUrl(image)).filter((image): image is string => Boolean(image))
      : [topic.image].map((image) => resolveSpeakingImageUrl(image)).filter((image): image is string => Boolean(image));
    return {
      testId,
      practiceItemId,
      partNumber: partNumber as 2 | 3 | 4,
      taskType: partNumber === 2 ? "describe-recount-opinion" : partNumber === 3 ? "compare-speculate-opinion" : "abstract-topic-extended",
      taskId: `${topic.topicId}-q${questionIndex + 1}`,
      instructions: partNumber === 2
        ? "Describe the picture and answer the two follow-up questions. You have 45 seconds for each response."
        : partNumber === 3
        ? "Compare the two pictures and answer the two follow-up questions. You have 45 seconds for each response."
        : "Speak for two minutes on the topic. You have one minute to prepare.",
      topic: topic.title,
      imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
      visualContextRequired: partNumber === 2 || partNumber === 3,
      prompt: partNumber === 4 ? topic.prompts : prompt,
      preparationTimeSeconds: partNumber === 4 ? 60 : 0,
      responseTimeSeconds: partNumber === 4 ? 120 : 45,
    };
  }

  const publicDataPath = path.join(
    process.cwd(),
    `data/tests/${testId}-public.json`
  );

  if (!fs.existsSync(publicDataPath)) {
    const speakingBankPath = path.join(
      process.cwd(),
      "data/prediction/speaking/speaking-bank.json"
    );
    if (fs.existsSync(speakingBankPath)) {
      try {
        const bank = JSON.parse(fs.readFileSync(speakingBankPath, "utf-8"));
        const topic = bank.topics?.find((t: any) => t.candidateId === testId);
        if (topic) {
          if (Number(topic.partNumber) !== partNumber) {
            throw createGradingError("UNKNOWN_QUESTION", `Speaking task part mismatch for testId: ${testId}`);
          }
          const taskMatch = taskId?.match(/(?:^|_)q([1-9]\d*)$/);
          if (taskId && !taskMatch) {
            throw createGradingError("UNKNOWN_QUESTION", `Speaking task does not belong to testId: ${taskId}`);
          }
          const qIdx = taskMatch ? Number(taskMatch[1]) - 1 : 0;
          if (!Number.isSafeInteger(qIdx) || qIdx < 0 || qIdx >= (topic.questions?.length || 0)) {
            throw createGradingError("UNKNOWN_QUESTION", `Speaking task is outside the prompt range: ${taskId}`);
          }
          const qItem = topic.questions?.[qIdx] || topic.questions?.[0];
          const qText = typeof qItem === "string" ? qItem : qItem?.questionText || qItem?.prompt || "";

          return {
            testId,
            partNumber: topic.partNumber as 1 | 2 | 3 | 4,
            taskType:
              topic.partNumber === 2
                ? "describe-recount-opinion"
                : topic.partNumber === 3
                ? "compare-speculate-opinion"
                : "abstract-topic-extended",
            taskId: `${topic.candidateId}_q${(qIdx >= 0 ? qIdx : 0) + 1}`,
            instructions:
              topic.partNumber === 2
                ? "Describe the photograph and answer the two follow-up questions. You have 45 seconds for each response."
                : topic.partNumber === 3
                ? "Compare the two photographs and answer the two follow-up questions. You have 45 seconds for each response."
                : "In this part, you will speak for two minutes on a topic. You will have one minute to prepare your response.",
            topic: topic.topic,
            imageUrls: Array.isArray(topic.images)
              ? topic.images
                .map((image: unknown) => resolveSpeakingImageUrl(image))
                .filter((url: string | null): url is string => Boolean(url))
              : undefined,
            visualContextRequired: topic.partNumber === 2 || topic.partNumber === 3,
            prompt: topic.partNumber === 4 ? topic.questions.map((q: any) => typeof q === "string" ? q : q.questionText || q.prompt) : qText,
            preparationTimeSeconds: topic.partNumber === 4 ? 60 : 0,
            responseTimeSeconds: topic.partNumber === 4 ? 120 : 45,
          };
        }
      } catch {
        // Fall through to error
      }
    }

    throw createGradingError(
      "UNKNOWN_QUESTION",
      `Test dataset not found for testId: ${testId}`
    );
  }

  const raw = fs.readFileSync(publicDataPath, "utf-8");
  const dataset: AptisPublicTestDataset = JSON.parse(raw);
  const speakingParts = dataset.speaking.parts;
  const requestedPart: any = speakingParts.find((part) => part.partNumber === partNumber);
  if (!requestedPart) {
    throw createGradingError("UNKNOWN_QUESTION", `Speaking Part ${partNumber} is unavailable for testId: ${testId}`);
  }

  if (partNumber === 1) {
    const p1 = requestedPart;
    const questionItem = findSpeakingQuestion(p1.questions as SpeakingQuestionLike[], taskId);

    if (!questionItem) {
      throw createGradingError(
        "UNKNOWN_QUESTION",
        `Speaking Part 1 question not found for taskId: ${taskId}`
      );
    }

    return {
      testId,
      partNumber: 1,
      taskType: "personal-information",
      taskId: questionItem.id,
      instructions: p1.instructions,
      prompt: questionItem.prompt,
      preparationTimeSeconds: questionItem.preparationTimeSeconds,
      responseTimeSeconds: questionItem.responseTimeSeconds,
    };
  }

  if (partNumber === 2) {
    const p2 = requestedPart;
    const questionItem = findSpeakingQuestion(p2.questions as SpeakingQuestionLike[], taskId);

    if (!questionItem) {
      throw createGradingError(
        "UNKNOWN_QUESTION",
        `Speaking Part 2 question not found for taskId: ${taskId}`
      );
    }

    return {
      testId,
      partNumber: 2,
      taskType: "describe-recount-opinion",
      taskId: questionItem.id,
      instructions: p2.instructions,
      imageUrls: resolveSpeakingImageUrl(p2.imageUrl)
        ? [resolveSpeakingImageUrl(p2.imageUrl)!]
        : undefined,
      visualContextRequired: true,
      prompt: questionItem.prompt,
      preparationTimeSeconds: questionItem.preparationTimeSeconds,
      responseTimeSeconds: questionItem.responseTimeSeconds,
    };
  }

  if (partNumber === 3) {
    const p3 = requestedPart;
    const questionItem = findSpeakingQuestion(p3.questions as SpeakingQuestionLike[], taskId);

    if (!questionItem) {
      throw createGradingError(
        "UNKNOWN_QUESTION",
        `Speaking Part 3 question not found for taskId: ${taskId}`
      );
    }

    const imageUrls = [p3.images.image1Url, p3.images.image2Url]
      .map((image: unknown) => resolveSpeakingImageUrl(image))
      .filter((url: string | null): url is string => Boolean(url));

    return {
      testId,
      partNumber: 3,
      taskType: "compare-speculate-opinion",
      taskId: questionItem.id,
      instructions: p3.instructions,
      imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
      visualContextRequired: true,
      prompt: questionItem.prompt,
      preparationTimeSeconds: questionItem.preparationTimeSeconds,
      responseTimeSeconds: questionItem.responseTimeSeconds,
    };
  }

  if (partNumber === 4) {
    const p4 = requestedPart;
    return {
      testId,
      partNumber: 4,
      taskType: "abstract-topic-extended",
      instructions: p4.instructions,
      topic: p4.topic,
      imageUrls: resolveSpeakingImageUrl(p4.imageUrl)
        ? [resolveSpeakingImageUrl(p4.imageUrl)!]
        : undefined,
      prompt: p4.questions,
      preparationTimeSeconds: p4.preparationTimeSeconds,
      responseTimeSeconds: p4.responseTimeSeconds,
    };
  }

  throw createGradingError(
    "UNKNOWN_QUESTION",
    `Invalid speaking partNumber: ${partNumber}`
  );
}

export interface SpeakingAudioPayloadInfo {
  audioBase64: string;
  audioBytes: number;
  mimeType?: string;
  durationSeconds?: number;
}

/**
 * Validate and decode the browser recording boundary before invoking Gemini.
 * Buffer.from(base64) is intentionally not used as the validator because
 * Node silently ignores invalid characters and would otherwise pass corrupt
 * data to the provider.
 */
export function validateAudioPayload(
  audioBase64: string,
  mimeType?: string,
  durationSeconds?: number,
): SpeakingAudioPayloadInfo {
  const normalized = typeof audioBase64 === "string" ? audioBase64.trim() : "";
  if (!normalized) {
    throw createGradingError("INVALID_AUDIO", "Audio payload is empty");
  }
  if (normalized.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(normalized)) {
    throw createGradingError("INVALID_AUDIO", "Audio payload is not valid base64");
  }
  if (mimeType && !(AllowedSpeakingMimeTypes as readonly string[]).includes(mimeType)) {
    throw createGradingError("INVALID_AUDIO", "Audio MIME type is not supported");
  }
  if (durationSeconds !== undefined &&
      (!Number.isFinite(durationSeconds) || durationSeconds <= 0 || durationSeconds > 15 * 60)) {
    throw createGradingError("INVALID_AUDIO", "Audio duration is invalid");
  }

  const bytes = Buffer.from(normalized, "base64");
  const byteSize = bytes.byteLength;
  // A few bytes can be a syntactically valid base64 string but cannot contain
  // a usable recording. Reject it before asking the examiner to invent a
  // transcript or rubric score for an empty/accidental click.
  if (byteSize < 512 || (durationSeconds !== undefined && durationSeconds < 0.5)) {
    throw createGradingError(
      "INVALID_AUDIO",
      "Audio recording is too short to evaluate. Please record a complete spoken response."
    );
  }

  if (byteSize > MAX_AUDIO_BYTES) {
    throw createGradingError(
      "INVALID_AUDIO",
      "Audio payload exceeds the maximum allowed size of 10MB"
    );
  }

  return { audioBase64: normalized, audioBytes: byteSize, mimeType, durationSeconds };
}

type GeminiResponseDiagnostics = { requestId?: string; model?: string; finishReason?: string };

function valueType(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

/** Shape-only diagnostics: never log audio, transcript, prompt, or secrets. */
function responseShape(value: unknown, depth = 0): unknown {
  if (depth > 2) return valueType(value);
  if (Array.isArray(value)) {
    return {
      type: "array",
      length: value.length,
      itemTypes: Array.from(new Set(value.slice(0, 5).map(valueType))),
    };
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record).slice(0, 80);
    return {
      type: "object",
      keys,
      children: depth < 2
        ? Object.fromEntries(keys.slice(0, 20).map((key) => [key, responseShape(record[key], depth + 1)]))
        : undefined,
    };
  }
  return { type: valueType(value), ...(typeof value === "string" ? { length: value.length } : {}) };
}

function logGeminiParseFailure(
  stage: string,
  raw: unknown,
  diagnostics: GeminiResponseDiagnostics | undefined,
  issues?: unknown,
): void {
  // Production API calls always provide a request id.  Suppress diagnostics
  // for direct unit-test/helper calls so expected invalid fixtures do not
  // pollute local test output.
  if (process.env.NODE_ENV === "test" || !diagnostics?.requestId) return;
  console.warn("[Speaking AI] Gemini response rejected", {
    requestId: diagnostics?.requestId || "unknown",
    model: diagnostics?.model || "unknown",
    finishReason: diagnostics?.finishReason || "unknown",
    stage,
    responseShape: responseShape(raw),
    issues,
  });
}

function firstDefined(record: Record<string, any>, aliases: string[]): unknown {
  for (const alias of aliases) {
    if (record[alias] !== undefined && record[alias] !== null) return record[alias];
  }
  return undefined;
}

function toFiniteNumber(value: unknown): number | undefined {
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (typeof value !== "string") return undefined;
  const text = value.trim();
  if (/^-?(?:\d+|\d*\.\d+)$/.test(text)) {
    const number = Number(text);
    return Number.isFinite(number) ? number : undefined;
  }
  const fraction = text.match(/^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/);
  if (fraction && Number(fraction[2]) > 0) {
    const number = Number(fraction[1]);
    return Number.isFinite(number) ? number : undefined;
  }
  return undefined;
}

function toText(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function toTextList(value: unknown): string[] {
  if (typeof value === "string") return value.trim() ? [value.trim()] : [];
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (!item || typeof item !== "object") return "";
      return toText(firstDefined(item as Record<string, any>, ["text", "point", "item", "description", "message", "reason", "feedback"])) || "";
    })
    .filter(Boolean);
}

function normalizedKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function canonicalCriterionName(value: string): string {
  const key = normalizedKey(value);
  if (key.includes("taskachievement") || key.includes("taskfulfil") || key.includes("taskfulfill")) return "Task Fulfilment";
  if (key.includes("pronunciation")) return "Pronunciation";
  if (key.includes("fluency") || key.includes("cohesion") || key.includes("continuity")) return "Fluency & Cohesion";
  if (key.includes("grammar") || key.includes("accuracy")) return "Spoken Grammar";
  if (key.includes("vocabulary") || key.includes("lexical")) return "Lexical Resource";
  if (key.includes("discourse") || key.includes("organization") || key.includes("organisation")) return "Discourse Organization";
  return value;
}

function feedbackForCriterion(source: unknown, name: string, allowSharedFeedback = false): string | undefined {
  if (typeof source === "string") return allowSharedFeedback ? toText(source) : undefined;
  if (!source || typeof source !== "object" || Array.isArray(source)) return undefined;
  const record = source as Record<string, any>;
  const target = normalizedKey(name);
  const entry = Object.entries(record).find(([key]) => {
    const normalized = normalizedKey(key);
    return normalized === target || normalized.includes(target) || target.includes(normalized);
  })?.[1];
  if (typeof entry === "string") return toText(entry);
  if (entry && typeof entry === "object") {
    return toText(firstDefined(entry as Record<string, any>, ["feedback", "comment", "comments", "explanation", "assessment", "notes"]));
  }
  return undefined;
}

function criterionScoreValue(value: unknown): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  return firstDefined(value as Record<string, any>, ["score", "value", "points", "rating"]);
}

function normalizeCriterionEntry(
  entry: unknown,
  fallbackName: string | undefined,
  feedbackSource: unknown,
  index: number,
): Record<string, unknown> {
  const record = entry && typeof entry === "object" && !Array.isArray(entry)
    ? entry as Record<string, any>
    : undefined;
  const providerName = record
    ? toText(firstDefined(record, ["name", "criterion", "category", "dimension", "rubric"]))
    : undefined;
  const name = providerName || (fallbackName ? canonicalCriterionName(fallbackName) : "");
  const score = toFiniteNumber(record
    ? firstDefined(record, ["score", "value", "points", "rating"])
    : entry);
  const maxScore = toFiniteNumber(record ? firstDefined(record, ["maxScore", "max_score", "maximum", "outOf"]) : undefined) ?? 5;
  const feedback = record
    ? toText(firstDefined(record, ["feedback", "comment", "comments", "explanation", "assessment", "notes"]))
      || feedbackForCriterion(feedbackSource, name, true)
    : feedbackForCriterion(feedbackSource, name, true);
  return { name: name || `Criterion ${index + 1}`, score, maxScore, feedback };
}

function normalizeCriteria(raw: unknown, feedbackSource: unknown): Record<string, unknown>[] {
  if (Array.isArray(raw)) {
    return raw.map((entry, index) => normalizeCriterionEntry(entry, undefined, feedbackSource, index));
  }
  if (!raw || typeof raw !== "object") return [];
  return Object.entries(raw as Record<string, unknown>)
    .filter(([key]) => !["overall", "overallscore", "total", "totalscore", "maxscore"].includes(normalizedKey(key)))
    .map(([name, value], index) => normalizeCriterionEntry(value, name, feedbackSource, index));
}

function mergeCriteria(criteria: Record<string, unknown>[], additions: Record<string, unknown>[]): Record<string, unknown>[] {
  const merged = [...criteria];
  for (const candidate of additions) {
    const candidateKey = normalizedKey(String(candidate.name || ""));
    if (!candidateKey || merged.some((item) => normalizedKey(String(item.name || "")) === candidateKey)) continue;
    merged.push(candidate);
  }
  return merged;
}

const TOP_LEVEL_RUBRIC_FIELDS: Array<{ name: string; aliases: string[] }> = [
  { name: "Task Fulfilment", aliases: ["taskAchievement", "taskAchievementScore", "taskFulfilment", "taskFulfillment", "taskFulfilmentScore", "taskFulfillmentScore", "task_achievement"] },
  { name: "Pronunciation", aliases: ["pronunciation", "pronunciationScore", "pronunciationIntelligibility", "pronunciation_intelligibility"] },
  { name: "Fluency & Cohesion", aliases: ["fluency", "fluencyScore", "fluencyAndCohesion", "sustainedFluency", "fluencyContinuity", "fluency_continuity"] },
  { name: "Spoken Grammar", aliases: ["grammar", "grammarScore", "spokenGrammar", "grammarAccuracy", "grammar_accuracy"] },
  { name: "Lexical Resource", aliases: ["vocabulary", "vocabularyScore", "lexicalResource", "lexicalResourceScore", "lexical_resource"] },
  { name: "Discourse Organization", aliases: ["discourseOrganization", "discourseOrganizationScore", "discourse_organization"] },
];

export function parseAndValidateGeminiSpeakingOutput(
  rawJson: unknown,
  diagnostics?: GeminiResponseDiagnostics,
): GeminiSpeakingOutput {
  let parsed: any = rawJson;
  if (typeof rawJson === "string") {
    const trimmed = rawJson.trim();
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)?.[1];
      const candidate = fenced?.trim() || (() => {
        const start = trimmed.indexOf("{");
        const end = trimmed.lastIndexOf("}");
        return start >= 0 && end > start ? trimmed.slice(start, end + 1) : "";
      })();
      try {
        parsed = candidate ? JSON.parse(candidate) : undefined;
      } catch {
        logGeminiParseFailure("json_parse", rawJson, diagnostics, [{ path: "$", code: "invalid_json" }]);
        throw createGradingError("INVALID_AI_RESPONSE", "Failed to parse Gemini speaking output as JSON");
      }
    }
  }

  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    const wrapper = firstDefined(parsed, ["data", "evaluation", "result", "assessment"]);
    const hasCanonicalSignal = firstDefined(parsed, ["overallScore", "overall_score", "score", "scores", "criteria", "rubric", "transcript"]) !== undefined;
    if (!hasCanonicalSignal && wrapper && typeof wrapper === "object" && !Array.isArray(wrapper)) parsed = wrapper;
  }

  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    // 1. Transcript and audio quality. Missing quality is inferred only from
    // a provider-supplied transcript; it never creates a positive assessment.
    const reportedTranscript = toText(firstDefined(parsed, ["transcript", "transcription", "speechToText", "speech_to_text", "stt", "transcriptText", "text"])) || "";
    parsed.transcript = reportedTranscript;
    const declaredAudioQuality = firstDefined(parsed, ["audioQuality", "audio_quality", "quality"]);
    const normalizedQuality = typeof declaredAudioQuality === "string"
      ? ({ good: "sufficient", clear: "sufficient", sufficient: "sufficient", poor: "insufficient", unusable: "insufficient", insufficient: "insufficient", no_speech: "insufficient" } as Record<string, string>)[declaredAudioQuality.toLowerCase()]
      : undefined;
    // An empty transcript always wins over a provider's optimistic quality
    // flag.  Never allow `audioQuality: "sufficient"` to survive without
    // provider-supplied speech-to-text evidence.
    parsed.audioQuality = !reportedTranscript
      ? "insufficient"
      : normalizedQuality || declaredAudioQuality || "sufficient";
    parsed.audioQualityReason = toText(firstDefined(parsed, ["audioQualityReason", "audio_quality_reason", "audioReason", "reason"]));

    // 2. Band and score aliases. Numeric strings are accepted only when they
    // are unambiguous numbers; percentages or prose are not converted.
    const rawBand = firstDefined(parsed, ["estimatedBand", "estimated_band", "band", "overallCefrLevel", "cefrLevel", "cefr_level"]);
    const bandMatch = typeof rawBand === "string" ? rawBand.toUpperCase().match(/\b(A1|A2|B1|B2|C1|C2)\b/) : null;
    if (bandMatch?.[1]) parsed.estimatedBand = bandMatch[1];
    else if (parsed.audioQuality === "insufficient" || !reportedTranscript) parsed.estimatedBand = "A1";
    else if (rawBand !== undefined) parsed.estimatedBand = rawBand;

    const scoreSummary = firstDefined(parsed, ["scoreSummary", "score_summary", "scores", "scoreBreakdown"]);
    const rawOverallScore = firstDefined(parsed, ["overallScore", "overall_score", "score", "totalScore", "total_score", "finalScore"])
      ?? (scoreSummary && typeof scoreSummary === "object" ? firstDefined(scoreSummary as Record<string, any>, ["overallScore", "overall_score", "overall", "score", "totalScore", "total"]) : undefined);
    const normalizedOverallScore = toFiniteNumber(criterionScoreValue(rawOverallScore));
    if (normalizedOverallScore !== undefined) parsed.overallScore = normalizedOverallScore;
    const rawMaxOverallScore = firstDefined(parsed, ["maxOverallScore", "max_overall_score", "overallMaxScore", "totalMaxScore", "maxTotalScore"]);
    const normalizedMaxOverallScore = toFiniteNumber(criterionScoreValue(rawMaxOverallScore));
    if (normalizedMaxOverallScore !== undefined) parsed.maxOverallScore = normalizedMaxOverallScore;

    // 3. Rubric normalization. Gemini responses commonly expose either a
    // criteria array/object or named rubric fields; both map only provider-
    // supplied scores and feedback into the canonical representation.
    const feedbackSource = firstDefined(parsed, ["criteriaFeedback", "criteria_feedback", "detailedFeedback", "rubricFeedback", "rubric_feedback", "feedbackByCriterion", "feedback"]);
    const rawCriteria = firstDefined(parsed, ["criteria", "rubric", "rubrics", "dimensions", "criteriaScores", "criteria_scores", "rubricScores", "rubric_scores"]);
    let criteria = normalizeCriteria(rawCriteria, feedbackSource);
    const topLevelCriteria = TOP_LEVEL_RUBRIC_FIELDS.flatMap(({ name, aliases }) => {
      const rawValue = firstDefined(parsed, aliases);
      if (rawValue === undefined) return [];
      return [normalizeCriterionEntry(rawValue, name, feedbackSource, criteria.length)];
    });
    criteria = mergeCriteria(criteria, topLevelCriteria);
    if (criteria.length > 0) parsed.criteria = criteria;
    if (parsed.overallScore === undefined && criteria.length > 0) {
      const numericScores = criteria.map((criterion) => criterion.score);
      if (numericScores.every((score) => typeof score === "number" && Number.isFinite(score))) {
        parsed.overallScore = numericScores.reduce<number>((sum, score) => sum + Number(score), 0);
      }
    }
    if (parsed.maxOverallScore === undefined && criteria.length > 0) {
      const maxScores = criteria.map((criterion) => criterion.maxScore);
      if (maxScores.every((score) => typeof score === "number" && Number.isFinite(score))) {
        parsed.maxOverallScore = maxScores.reduce<number>((sum, score) => sum + Number(score), 0);
      }
    }

    // 4. Detail arrays and feedback aliases.
    const rawPron = firstDefined(parsed, ["pronunciationFeedback", "pronunciation_feedback", "pronunciationIssues", "pronunciationErrors"]);
    parsed.pronunciationFeedback = Array.isArray(rawPron)
      ? rawPron.map((p: any) => typeof p === "string"
          ? { soundOrWord: "", issue: p, advice: "" }
          : { soundOrWord: toText(firstDefined(p || {}, ["soundOrWord", "wordOrPhrase", "sound", "word"])) || "", issue: toText(firstDefined(p || {}, ["issue", "problem"])) || "", advice: toText(firstDefined(p || {}, ["advice", "actionableAdvice", "recommendation"])) || "" })
      : [];
    const rawGrammar = firstDefined(parsed, ["spokenGrammarErrors", "spoken_grammar_errors", "grammarErrors", "grammaticalErrors"]);
    parsed.spokenGrammarErrors = Array.isArray(rawGrammar)
      ? rawGrammar.map((g: any) => typeof g === "string"
          ? { spokenPhrase: "", correctedPhrase: "", errorCategory: "Spoken Grammar", explanation: g, linkedKnowledge: [] }
          : { spokenPhrase: toText(firstDefined(g || {}, ["spokenPhrase", "originalPhrase", "original", "mistake"])) || "", correctedPhrase: toText(firstDefined(g || {}, ["correctedPhrase", "suggestedUpgrade", "corrected", "correction"])) || "", errorCategory: toText(firstDefined(g || {}, ["errorCategory", "category"])) || "Spoken Grammar", explanation: toText(firstDefined(g || {}, ["explanation", "reason"])) || "", linkedKnowledge: toTextList(firstDefined(g || {}, ["linkedKnowledge", "linked_knowledge"])) })
      : [];
    const rawVocab = firstDefined(parsed, ["vocabularyUpgrades", "vocabulary_upgrades", "lexicalUpgrades", "lexical_upgrades"]);
    parsed.vocabularyUpgrades = Array.isArray(rawVocab)
      ? rawVocab.map((v: any) => typeof v === "string"
          ? { originalSpoken: "", upgradedAlternative: "", context: v }
          : { originalSpoken: toText(firstDefined(v || {}, ["originalSpoken", "originalPhrase", "originalWord", "original"])) || "", upgradedAlternative: toText(firstDefined(v || {}, ["upgradedAlternative", "suggestedUpgrade", "upgrade"])) || "", context: toText(firstDefined(v || {}, ["context", "contextExplanation", "explanation"])) || "" })
      : [];

    parsed.strengths = toTextList(firstDefined(parsed, ["strengths", "positivePoints", "positiveAspects", "whatWentWell", "positives"]));
    parsed.areasForImprovement = toTextList(firstDefined(parsed, ["areasForImprovement", "areas_for_improvement", "improvements", "weaknesses", "developmentAreas", "areasToImprove"]));
    // A few valid Gemini responses use one general `feedback` string instead
    // of an areasForImprovement array. Preserve that provider-authored text as
    // a single improvement item; it is not a fabricated recommendation.
    if (parsed.areasForImprovement.length === 0 && typeof feedbackSource === "string" && feedbackSource.trim()) {
      parsed.areasForImprovement = [feedbackSource.trim()];
    }
    const rawPlan = firstDefined(parsed, ["improvementPlan", "improvement_plan", "actionPlan", "recommendations", "nextSteps"]);
    parsed.improvementPlan = Array.isArray(rawPlan)
      ? rawPlan.map((item: unknown) => typeof item === "string"
        ? item.trim()
        : item && typeof item === "object"
          ? toText(firstDefined(item as Record<string, any>, ["step", "action", "recommendation", "text", "description"])) || ""
          : "").filter(Boolean)
      : [];
    parsed.linkedKnowledge = toTextList(firstDefined(parsed, ["linkedKnowledge", "linked_knowledge"]));

    // Gemini may return a sparse no-speech assessment. Completing only that
    // explicitly insufficient state to a zero result is safe; sufficient
    // responses still require every canonical rubric field.
    const criteriaComplete = Array.isArray(parsed.criteria) && parsed.criteria.length > 0 && parsed.criteria.every((criterion: any) =>
      typeof criterion?.name === "string" && criterion.name.trim().length > 0 &&
      typeof criterion?.score === "number" && Number.isFinite(criterion.score) &&
      criterion?.maxScore === 5 &&
      typeof criterion?.feedback === "string" && criterion.feedback.trim().length > 0
    );
    const bandIsValid = ["A1", "A2", "B1", "B2", "C1", "C2"].includes(parsed.estimatedBand);
    if (parsed.audioQuality === "insufficient" &&
      (!Number.isFinite(parsed.overallScore) || !Number.isFinite(parsed.maxOverallScore) || !criteriaComplete || !bandIsValid)) {
      const reason = parsed.audioQualityReason || "Không nhận diện được lời nói trong bản ghi âm.";
      parsed.overallScore = 0;
      parsed.maxOverallScore = 25;
      parsed.estimatedBand = "A1";
      parsed.criteria = [{ name: "Task Fulfilment", score: 0, maxScore: 5, feedback: "Không thể đánh giá vì bản ghi không có lời nói rõ ràng." }];
      parsed.strengths = [];
      parsed.areasForImprovement = [reason];
      parsed.transcript = typeof parsed.transcript === "string" ? parsed.transcript : "";
    }
  }

  const result = GeminiSpeakingOutputSchema.safeParse(parsed);
  if (!result.success) {
    logGeminiParseFailure(
      "schema_validation",
      parsed,
      diagnostics,
      result.error.issues.map((issue) => ({ path: issue.path.map(String).join(".") || "$", code: issue.code, message: issue.message })),
    );
    throw createGradingError("INVALID_AI_RESPONSE", "Gemini returned an incomplete or invalid speaking assessment");
  }

  return result.data;
}

export async function gradeSpeakingSubmission(
  taskContext: SpeakingTaskContext,
  audioPayload: {
    audioBase64: string;
    mimeType: string;
    durationSeconds?: number;
    clientTranscript?: string;
  },
  customClient?: GoogleGenAI,
  userId?: string,
  options?: { timeoutMs?: number; requestId?: string },
): Promise<SpeakingGradingResult> {
  const startedAt = Date.now();
  const validatedAudio = validateAudioPayload(
    audioPayload.audioBase64,
    audioPayload.mimeType,
    audioPayload.durationSeconds,
  );

  // 1. Retrieve targeted speaking rubrics and strategy notes from Knowledge Brain
  const rubricNotes = retrieveRelevantKnowledge(
    `Speaking Part ${taskContext.partNumber} ${taskContext.taskType} rubric criteria`,
    2
  );

  let client: GoogleGenAI;
  try {
    client = customClient ?? getGeminiClient();
  } catch {
    throw createGradingError(
      "AI_PROVIDER_ERROR",
      "The speaking examiner is not configured. Please try again later."
    );
  }
  const promptText = buildSpeakingGradingPrompt(
    taskContext,
    audioPayload.clientTranscript,
    rubricNotes
  );

  const audioInlinePart = {
    inlineData: {
      mimeType: audioPayload.mimeType,
      data: validatedAudio.audioBase64,
    },
  };
  const imageInlineParts = loadSpeakingImageInlineParts(taskContext.imageUrls);
  const expectedImageCount = taskContext.partNumber === 2 ? 1 : taskContext.partNumber === 3 ? 2 : 0;
  if (taskContext.visualContextRequired && imageInlineParts.length !== expectedImageCount) {
    throw createGradingError(
      "INVALID_TASK_CONTEXT",
      `Speaking Part ${taskContext.partNumber} requires ${expectedImageCount} task image(s)`
    );
  }

  // Honour the model configured for Speaking in Vercel. The previous code
  // ignored GEMINI_MODEL_SPEAKING and always tried an unconfigured model,
  // which could spend the entire 45-second budget before failing.
  const configuredModel = getGeminiConfig().taskModels.speakingGrading;
  const candidateModels = Array.from(new Set([
    configuredModel,
    GEMINI_MODELS.FLASH_3_7,
    GEMINI_MODELS.FLASH,
  ].filter(Boolean)));
  let rawResponseText = "";
  let lastError: unknown = null;
  let selectedModel = candidateModels[0] || GEMINI_MODELS.FLASH;
  let providerLatencyMs = 0;
  let finishReason: string | undefined;
  let providerResponseShape: unknown;
  const requestPayloadBytes = Buffer.byteLength(promptText, "utf8")
    + Buffer.byteLength(SPEAKING_EXAMINER_SYSTEM_INSTRUCTION, "utf8")
    + validatedAudio.audioBase64.length
    + imageInlineParts.reduce((sum, part) => sum + part.inlineData.data.length, 0);

  for (const modelName of candidateModels) {
    const attemptStartedAt = Date.now();
    try {
      const response = await withAiGradingTimeout((abortSignal) => client.models.generateContent({
          model: modelName,
          // Keep all context in one user message. This prevents the SDK from
          // interpreting image/audio parts as separate turns and makes the
          // task-to-recording binding explicit for every Speaking part.
          contents: [{
            role: "user",
            parts: [
              { text: promptText },
              ...imageInlineParts,
              audioInlinePart,
            ],
          }],
          config: {
            systemInstruction: SPEAKING_EXAMINER_SYSTEM_INSTRUCTION,
            responseMimeType: "application/json",
            responseSchema: GEMINI_SPEAKING_RESPONSE_SCHEMA,
            temperature: 0.2,
            candidateCount: 1,
            maxOutputTokens: 1800,
            abortSignal,
          },
        }), options?.timeoutMs);

      providerLatencyMs = Date.now() - attemptStartedAt;
      providerResponseShape = response;
      rawResponseText = response.text ?? "";
      finishReason = (response as unknown as { candidates?: Array<{ finishReason?: string }> }).candidates?.[0]?.finishReason;
      if (rawResponseText.trim()) {
        selectedModel = modelName;
        break;
      }
      lastError = new Error("Gemini returned an empty speaking assessment");
    } catch (error) {
      providerLatencyMs = Date.now() - attemptStartedAt;
      lastError = error;
      // A timeout consumes the request budget; do not start another multimodal
      // request and turn one slow call into a guaranteed serverless timeout.
      if (error instanceof AiGradingTimeoutError) break;
      if (customClient) break;
    }
  }

  if (!rawResponseText) {
    logGeminiParseFailure("provider_empty_response", providerResponseShape, {
      requestId: options?.requestId,
      model: selectedModel,
      finishReason,
    });
    if (lastError instanceof AiGradingTimeoutError) {
      throw createGradingError(
        "GRADING_TIMEOUT",
        "The speaking examiner did not respond within the allowed time. Please try again."
      );
    }
    if (lastError) {
      throw createGradingError(
        "AI_PROVIDER_ERROR",
        "The speaking examiner is temporarily unavailable. Please try again."
      );
    }
    throw createGradingError("INVALID_AI_RESPONSE", "The speaking examiner returned no assessment");
  }

  const validatedOutput = parseAndValidateGeminiSpeakingOutput(rawResponseText, {
    requestId: options?.requestId,
    model: selectedModel,
    finishReason,
  });
  if (validatedOutput.audioQuality === "sufficient" &&
      validatedOutput.strengths.length === 0 &&
      validatedOutput.areasForImprovement.length === 0 &&
      validatedOutput.improvementPlan.length === 0) {
    throw createGradingError("INVALID_AI_RESPONSE", "The speaking examiner returned no feedback");
  }
  // A provider can return optimistic fallback criteria while simultaneously
  // flagging that the recording contains no recognizable speech. Treat that
  // state as an explicit zero-quality submission, never as a passing score.
  const hasTranscript = validatedOutput.transcript.trim().length > 0;
  const isInsufficientAudio = validatedOutput.audioQuality === "insufficient" || !hasTranscript;
  const audioQuality = isInsufficientAudio ? "insufficient" : validatedOutput.audioQuality;
  const audioQualityReason = isInsufficientAudio
    ? validatedOutput.audioQualityReason || "Không nhận diện được lời nói trong bản ghi âm."
    : validatedOutput.audioQualityReason;
  const overallScore = isInsufficientAudio ? 0 : validatedOutput.overallScore;
  const estimatedBand = isInsufficientAudio ? "A1" : validatedOutput.estimatedBand;
  const criteria = isInsufficientAudio
    ? validatedOutput.criteria.map((criterion) => ({
        ...criterion,
        score: 0,
        feedback: "Không thể đánh giá vì bản ghi không có lời nói rõ ràng.",
      }))
    : validatedOutput.criteria;
  const spokenGrammarErrors = isInsufficientAudio ? [] : validatedOutput.spokenGrammarErrors;
  const pronunciationFeedback = isInsufficientAudio ? [] : validatedOutput.pronunciationFeedback;
  const vocabularyUpgrades = isInsufficientAudio ? [] : validatedOutput.vocabularyUpgrades;
  const strengths = isInsufficientAudio ? [] : validatedOutput.strengths;
  const areasForImprovement = isInsufficientAudio
    ? [audioQualityReason || "Không nhận diện được lời nói trong bản ghi âm."]
    : validatedOutput.areasForImprovement;
  const percentage =
    validatedOutput.maxOverallScore > 0
      ? (overallScore / validatedOutput.maxOverallScore) * 100
      : 0;

  // 2. Record spoken grammar errors into User Learning Memory
  if (userId && spokenGrammarErrors.length > 0) {
    try {
      for (const err of spokenGrammarErrors) {
        const topicCategory = err.errorCategory || "Spoken Grammar";
        recordUserError(
          userId,
          "Speaking",
          `speaking-${topicCategory.toLowerCase().replace(/\s+/g, "-")}`,
          topicCategory,
          err.spokenPhrase
        );
      }
    } catch {
      // Memory recording should never block evaluation return
    }
  }

  const transcriptStatus: "available" | "unavailable" | "failed" =
    isInsufficientAudio
      ? "failed"
      : validatedOutput.transcript && validatedOutput.transcript.trim().length > 0
      ? "available"
      : "unavailable";

  const linkedKnowledge = validatedOutput.linkedKnowledge && validatedOutput.linkedKnowledge.length > 0
    ? validatedOutput.linkedKnowledge
    : rubricNotes.map((k) => k.topic);

  const submissionId = `spk_${createHash("sha256")
    .update([
      userId || "anonymous",
      taskContext.testId,
      taskContext.practiceItemId || "",
      String(taskContext.partNumber),
      taskContext.taskId || "",
      validatedAudio.audioBase64,
    ].join("|"))
    .digest("hex")
    .slice(0, 40)}`;

  return {
    testId: taskContext.testId,
    practiceItemId: taskContext.practiceItemId,
    taskId: taskContext.taskId,
    submissionId,
    partNumber: taskContext.partNumber,
    taskType: taskContext.taskType,
    audioQuality,
    audioQualityReason,
    overallScore,
    maxOverallScore: validatedOutput.maxOverallScore,
    percentage,
    estimatedBand,
    scoreType: "AI_ESTIMATE",
    criteria,
    pronunciationFeedback,
    pronunciationStatus: isInsufficientAudio ? "not_available" : "pedagogical_estimate",
    fluencyStatus: isInsufficientAudio ? "not_available" : "available",
    spokenGrammarErrors,
    vocabularyUpgrades,
    strengths,
    areasForImprovement,
    improvementPlan: validatedOutput.improvementPlan.length > 0
      ? validatedOutput.improvementPlan
      : validatedOutput.areasForImprovement.slice(0, 3),
    linkedKnowledge,
    transcript: validatedOutput.transcript,
    transcriptStatus,
    transcriptNotice: "AI-generated transcript — not guaranteed verbatim",
    disclaimer: "PRACTICE ESTIMATE — NOT AN OFFICIAL BRITISH COUNCIL SCORE",
    performance: {
      audioBytes: validatedAudio.audioBytes,
      requestPayloadBytes,
      providerLatencyMs,
      totalLatencyMs: Date.now() - startedAt,
      model: selectedModel,
      finishReason,
    },
  };
}
