/**
 * AI Speaking Grading Service
 * Uses Google Gemini 3.7 Flash with native multimodal audio input, STT, and error memory tracking.
 */

import fs from "node:fs";
import path from "node:path";
import { GoogleGenAI } from "@google/genai";
import { getGeminiClient } from "../gemini/client";
import { GEMINI_MODELS } from "../gemini/models";
import { createGradingError } from "./errors";
import {
  SPEAKING_EXAMINER_SYSTEM_INSTRUCTION,
  buildSpeakingGradingPrompt,
} from "./prompts/speaking";
import {
  GeminiSpeakingOutput,
  GeminiSpeakingOutputSchema,
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
        "INVALID_SUBMISSION",
        "Speaking task image context is unavailable"
      );
    }

    const imagePath = path.resolve(publicRoot, resolvedUrl.slice(1));
    const relativePath = path.relative(publicRoot, imagePath);
    if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
      throw createGradingError(
        "INVALID_SUBMISSION",
        "Speaking task image path is outside the public asset directory"
      );
    }
    if (!fs.existsSync(imagePath)) {
      throw createGradingError(
        "INVALID_SUBMISSION",
        "Speaking task image asset is missing"
      );
    }

    const stat = fs.statSync(imagePath);
    if (!stat.isFile() || stat.size <= 0 || stat.size > MAX_SPEAKING_IMAGE_BYTES) {
      throw createGradingError(
        "INVALID_SUBMISSION",
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
          const qIdx = taskId && taskId.includes("_q")
            ? parseInt(taskId.split("_q")[1], 10) - 1
            : 0;
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

  if (partNumber === 1) {
    const p1 = speakingParts[0];
    const questionItem = taskId
      ? p1.questions.find((q) => q.id === taskId || q.id.endsWith(taskId) || taskId.endsWith(q.id))
      : p1.questions[0];

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
    const p2 = speakingParts[1];
    const questionItem = taskId
      ? p2.questions.find((q) => q.id === taskId || q.id.endsWith(taskId) || taskId.endsWith(q.id))
      : p2.questions[0];

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
      prompt: questionItem.prompt,
      preparationTimeSeconds: questionItem.preparationTimeSeconds,
      responseTimeSeconds: questionItem.responseTimeSeconds,
    };
  }

  if (partNumber === 3) {
    const p3 = speakingParts[2];
    const questionItem = taskId
      ? p3.questions.find((q) => q.id === taskId || q.id.endsWith(taskId) || taskId.endsWith(q.id))
      : p3.questions[0];

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
      prompt: questionItem.prompt,
      preparationTimeSeconds: questionItem.preparationTimeSeconds,
      responseTimeSeconds: questionItem.responseTimeSeconds,
    };
  }

  if (partNumber === 4) {
    const p4 = speakingParts[3];
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

export function validateAudioPayload(audioBase64: string): void {
  if (!audioBase64 || audioBase64.trim().length === 0) {
    throw createGradingError(
      "INVALID_SUBMISSION",
      "Audio payload is empty"
    );
  }

  const padding = (audioBase64.match(/=+$/) || [""])[0].length;
  const byteSize = (audioBase64.length * 3) / 4 - padding;

  // A few bytes can be a syntactically valid base64 string but cannot contain
  // a usable recording. Reject it before asking the examiner to invent a
  // transcript or rubric score for an empty/accidental click.
  if (byteSize < 512) {
    throw createGradingError(
      "INVALID_SUBMISSION",
      "Audio recording is too short to evaluate. Please record a complete spoken response."
    );
  }

  if (byteSize > MAX_AUDIO_BYTES) {
    throw createGradingError(
      "INVALID_SUBMISSION",
      `Audio payload exceeds maximum allowed size of 10MB (Received: ${(byteSize / (1024 * 1024)).toFixed(2)}MB)`
    );
  }
}

export function parseAndValidateGeminiSpeakingOutput(
  rawJson: unknown
): GeminiSpeakingOutput {
  let parsed: any = rawJson;
  if (typeof rawJson === "string") {
    const trimmed = rawJson.trim();
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      const match = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (match) {
        try {
          parsed = JSON.parse(match[1].trim());
        } catch {
          throw createGradingError(
            "INVALID_ANSWER_FORMAT",
            "Failed to parse Gemini speaking output as JSON"
          );
        }
      } else {
        throw createGradingError(
          "INVALID_ANSWER_FORMAT",
          "Failed to parse Gemini speaking output as JSON"
        );
      }
    }
  }

  if (parsed && typeof parsed === "object" && parsed.overallScore === undefined && parsed.overall_score === undefined && parsed.scoreSummary === undefined && parsed.scores === undefined) {
    if (parsed.data && typeof parsed.data === "object") parsed = parsed.data;
    else if (parsed.evaluation && typeof parsed.evaluation === "object") parsed = parsed.evaluation;
    else if (parsed.result && typeof parsed.result === "object") parsed = parsed.result;
    else if (parsed.assessment && typeof parsed.assessment === "object") parsed = parsed.assessment;
  }

  if (parsed && typeof parsed === "object") {
    // 1. Audio quality
    const reportedTranscript = typeof parsed.transcript === "string" ? parsed.transcript.trim() : "";
    const declaredAudioQuality = parsed.audioQuality || parsed.audio_quality;
    const audioQuality = !reportedTranscript
      ? "insufficient"
      : declaredAudioQuality || "sufficient";
    // A missing quality flag may be inferred only from a provider-supplied
    // non-empty transcript; otherwise fail closed as insufficient.  Never
    // default an incomplete response to sufficient audio.
    parsed.audioQuality = audioQuality;
    if (parsed.audioQualityReason === null) parsed.audioQualityReason = undefined;

    // 2. Estimated Band normalization
    const rawBand = parsed.estimatedBand || parsed.estimated_band || parsed.overallCefrLevel || parsed.cefrLevel || parsed.cefr_level;
    const bandMatch = typeof rawBand === "string"
      ? rawBand.toUpperCase().match(/\b(A1|A2|B1|B2|C1|C2)\b/)
      : null;
    const band = bandMatch?.[1];
    // The schema rejects an omitted/invalid band; do not silently present B2.
    if (band !== undefined) parsed.estimatedBand = band;
    else if (audioQuality === "insufficient" || !reportedTranscript) parsed.estimatedBand = "A1";
    else if (rawBand !== undefined) parsed.estimatedBand = rawBand;

    // 3. Criteria normalization
    if (!Array.isArray(parsed.criteria)) {
      const summaryObj = parsed.scores || parsed.scoreSummary || parsed.criteriaScores || parsed.criteria_scores || {};
      const feedbackObj = parsed.detailedFeedback || parsed.criteriaFeedback || {};
      const keys = Object.keys(summaryObj).length > 0 ? Object.keys(summaryObj) : Object.keys(feedbackObj);

      if (keys.length > 0) {
        parsed.criteria = keys.map((name) => {
          const scoreVal = summaryObj[name];
          const score = typeof scoreVal === "number" ? scoreVal : typeof scoreVal === "object" && scoreVal !== null ? scoreVal.score : undefined;
          const feedbackText = typeof feedbackObj[name] === "string" ? feedbackObj[name] : typeof scoreVal === "object" && scoreVal !== null ? scoreVal.feedback : undefined;
          return {
            name,
            // Preserve only provider-supplied numeric scores.  A missing score
            // must fail schema validation instead of becoming an optimistic 4.
            score,
            maxScore: 5 as const,
            feedback: feedbackText,
          };
        });
      }
    }

    // 4. Overall Score
    if (parsed.overallScore === undefined && parsed.overall_score !== undefined) {
      parsed.overallScore = parsed.overall_score;
    }
    if (parsed.overallScore === undefined && Array.isArray(parsed.criteria) && parsed.criteria.length > 0) {
      parsed.overallScore = parsed.criteria.reduce((sum: number, c: any) => sum + (c.score || 0), 0);
    }
    if (parsed.maxOverallScore === undefined && Array.isArray(parsed.criteria) && parsed.criteria.length > 0) {
      parsed.maxOverallScore = parsed.criteria.reduce((sum: number, c: any) => sum + 5, 0);
    }

    // 5. Pronunciation feedback normalization
    const rawPron = parsed.pronunciationFeedback || parsed.pronunciation_feedback || parsed.pronunciationIssues || [];
    parsed.pronunciationFeedback = Array.isArray(rawPron)
      ? rawPron.map((p: any) => ({
          soundOrWord: p.soundOrWord || p.wordOrPhrase || p.sound || p.word || "",
          issue: p.issue || p.problem || "",
          advice: p.advice || p.actionableAdvice || p.recommendation || "",
        }))
      : [];

    // 6. Spoken Grammar Errors normalization
    const rawGrammar = parsed.spokenGrammarErrors || parsed.spoken_grammar_errors || parsed.grammarErrors || parsed.grammaticalErrors || [];
    parsed.spokenGrammarErrors = Array.isArray(rawGrammar)
      ? rawGrammar.map((g: any) => ({
          spokenPhrase: g.spokenPhrase || g.originalPhrase || g.original || g.mistake || "",
          correctedPhrase: g.correctedPhrase || g.suggestedUpgrade || g.corrected || g.correction || "",
          errorCategory: g.errorCategory || g.category || "Spoken Grammar",
          explanation: g.explanation || g.reason || "",
          linkedKnowledge: Array.isArray(g.linkedKnowledge) ? g.linkedKnowledge : [],
        }))
      : [];

    // 7. Vocabulary Upgrades normalization
    const rawVocab = parsed.vocabularyUpgrades || parsed.vocabulary_upgrades || parsed.lexicalUpgrades || [];
    parsed.vocabularyUpgrades = Array.isArray(rawVocab)
      ? rawVocab.map((v: any) => ({
          originalSpoken: v.originalSpoken || v.originalPhrase || v.originalWord || v.original || "",
          upgradedAlternative: v.upgradedAlternative || v.suggestedUpgrade || v.upgrade || "",
          context: v.context || v.contextExplanation || v.explanation || "",
        }))
      : [];

    // 8. Transcript & Strengths
    parsed.transcript = parsed.transcript || "";
    // Missing feedback is an incomplete examiner response, not permission to
    // fabricate a positive strength or generic assessment.
    if (!Array.isArray(parsed.strengths)) parsed.strengths = [];
    if (!Array.isArray(parsed.areasForImprovement)) parsed.areasForImprovement = [];

    const rawPlan = parsed.improvementPlan || parsed.improvement_plan;
    parsed.improvementPlan = Array.isArray(rawPlan)
      ? rawPlan
          .map((item: unknown) => {
            if (typeof item === "string") return item;
            if (item && typeof item === "object") {
              const candidate = (item as Record<string, unknown>).step
                ?? (item as Record<string, unknown>).action
                ?? (item as Record<string, unknown>).recommendation
                ?? (item as Record<string, unknown>).text
                ?? (item as Record<string, unknown>).description;
              if (typeof candidate === "string") return candidate;
              try { return JSON.stringify(item); } catch { return ""; }
            }
            return item == null ? "" : String(item);
          })
          .filter((item: string) => item.trim().length > 0)
      : [];
    parsed.linkedKnowledge = Array.isArray(parsed.linkedKnowledge || parsed.linked_knowledge)
      ? (parsed.linkedKnowledge || parsed.linked_knowledge)
      : [];

    // Gemini sometimes returns a deliberately sparse no-speech assessment
    // (quality/reason only, without score fields).  This is safe to complete
    // deterministically as zero; it is not a language score or invented
    // transcript.  Other incomplete responses still fail schema validation.
    const criteriaComplete = Array.isArray(parsed.criteria) && parsed.criteria.length > 0 && parsed.criteria.every((criterion: any) =>
      typeof criterion?.name === "string" &&
      typeof criterion?.score === "number" &&
      criterion?.maxScore === 5 &&
      typeof criterion?.feedback === "string"
    );
    const bandIsValid = ["A1", "A2", "B1", "B2", "C1", "C2"].includes(parsed.estimatedBand);
    if (parsed.audioQuality === "insufficient" &&
      (!Number.isFinite(parsed.overallScore) || !Number.isFinite(parsed.maxOverallScore) || !criteriaComplete || !bandIsValid)) {
      const reason = parsed.audioQualityReason || "Không nhận diện được lời nói trong bản ghi âm.";
      parsed.overallScore = 0;
      parsed.maxOverallScore = 25;
      parsed.estimatedBand = "A1";
      parsed.criteria = [
        { name: "Task Fulfilment", score: 0, maxScore: 5, feedback: "Không thể đánh giá vì bản ghi không có lời nói rõ ràng." },
      ];
      parsed.strengths = [];
      parsed.areasForImprovement = [reason];
      parsed.transcript = typeof parsed.transcript === "string" ? parsed.transcript : "";
    }
  }

  const result = GeminiSpeakingOutputSchema.safeParse(parsed);
  if (!result.success) {
    throw createGradingError(
      "INVALID_ANSWER_FORMAT",
      `Gemini speaking output schema validation failed: ${result.error.message}`,
      result.error.issues
    );
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
  userId?: string
): Promise<SpeakingGradingResult> {
  validateAudioPayload(audioPayload.audioBase64);

  // 1. Retrieve targeted speaking rubrics and strategy notes from Knowledge Brain
  const rubricNotes = retrieveRelevantKnowledge(
    `Speaking Part ${taskContext.partNumber} ${taskContext.taskType} rubric criteria`,
    2
  );

  const client = customClient ?? getGeminiClient();
  const promptText = buildSpeakingGradingPrompt(
    taskContext,
    audioPayload.clientTranscript,
    rubricNotes
  );

  const audioInlinePart = {
    inlineData: {
      mimeType: audioPayload.mimeType,
      data: audioPayload.audioBase64,
    },
  };
  const imageInlineParts = loadSpeakingImageInlineParts(taskContext.imageUrls);

  const candidateModels = [GEMINI_MODELS.FLASH, GEMINI_MODELS.FLASH_3_6];
  let rawResponseText = "";
  let lastError: unknown = null;

  for (const modelName of candidateModels) {
    try {
      const response = await withAiGradingTimeout(client.models.generateContent({
        model: modelName,
        contents: [promptText, ...imageInlineParts, audioInlinePart],
        config: {
          systemInstruction: SPEAKING_EXAMINER_SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
        },
      }));

      rawResponseText = response.text ?? "";
      if (rawResponseText) break;
    } catch (error) {
      lastError = error;
      if (customClient || error instanceof AiGradingTimeoutError) break;
    }
  }

  if (!rawResponseText) {
    throw createGradingError(
      "INVALID_ANSWER_FORMAT",
      `Gemini speaking evaluation failed: ${lastError instanceof Error ? lastError.message : String(lastError)}`
    );
  }

  const validatedOutput = parseAndValidateGeminiSpeakingOutput(rawResponseText);
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

  return {
    testId: taskContext.testId,
    practiceItemId: taskContext.practiceItemId,
    taskId: taskContext.taskId,
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
      : [
          "Luyện tập phát âm rõ ràng các âm cuối (ending sounds -s, -ed)",
          "Thực hành bấm giờ 45 giây miêu tả ảnh theo cấu trúc 4 bước",
          "Áp dụng từ vựng nâng cấp B2 để diễn đạt ý kiến mượt mà hơn",
        ],
    linkedKnowledge,
    transcript: validatedOutput.transcript,
    transcriptStatus,
    transcriptNotice: "AI-generated transcript — not guaranteed verbatim",
    disclaimer: "PRACTICE ESTIMATE — NOT AN OFFICIAL BRITISH COUNCIL SCORE",
  };
}
