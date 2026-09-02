/**
 * AI Writing Grading Service
 * Uses Google Gemini 3.7 Flash with structured JSON output, knowledge retrieval, and error memory tracking.
 */

import fs from "node:fs";
import path from "node:path";
import { GoogleGenAI, Type } from "@google/genai";
import { getGeminiClient } from "../gemini/client";
import { GEMINI_MODELS } from "../gemini/models";
import { createGradingError } from "./errors";
import {
  WRITING_EXAMINER_SYSTEM_INSTRUCTION,
  buildWritingGradingPrompt,
} from "./prompts/writing";
import { countWords } from "./word-counter";
import {
  GeminiWritingOutput,
  GeminiWritingOutputSchema,
  WritingGradingResult,
  WritingTaskContext,
} from "./writing-schema";
import { AptisPublicTestDataset } from "../exam/types";
import { retrieveRelevantKnowledge } from "../knowledge/retriever";
import { recordUserError } from "../memory/store";
import { AiGradingTimeoutError, withAiGradingTimeout } from "./ai-timeout";

const GEMINI_WRITING_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    overallScore: { type: Type.NUMBER, minimum: 0 },
    maxOverallScore: { type: Type.NUMBER, minimum: 1 },
    estimatedBand: { type: Type.STRING, enum: ["A0", "A1", "A2", "B1", "B2", "C"] },
    criteria: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          score: { type: Type.NUMBER, minimum: 0, maximum: 5 },
          maxScore: { type: Type.NUMBER, minimum: 1, maximum: 5 },
          feedback: { type: Type.STRING },
        },
        required: ["name", "score", "maxScore", "feedback"],
      },
    },
    grammarErrors: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          originalSentence: { type: Type.STRING },
          correctedSentence: { type: Type.STRING },
          errorCategory: { type: Type.STRING },
          explanation: { type: Type.STRING },
          linkedKnowledge: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["originalSentence", "correctedSentence", "errorCategory", "explanation", "linkedKnowledge"],
      },
    },
    vocabularyUpgrades: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          originalPhrase: { type: Type.STRING },
          upgradedPhrase: { type: Type.STRING },
          rationale: { type: Type.STRING },
        },
        required: ["originalPhrase", "upgradedPhrase", "rationale"],
      },
    },
    strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
    areasForImprovement: { type: Type.ARRAY, items: { type: Type.STRING } },
    modelAnswer: { type: Type.STRING },
    correctedVersion: { type: Type.STRING },
    improvementPlan: { type: Type.ARRAY, items: { type: Type.STRING } },
    linkedKnowledge: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: [
    "overallScore", "maxOverallScore", "estimatedBand", "criteria",
    "grammarErrors", "vocabularyUpgrades", "strengths", "areasForImprovement",
    "modelAnswer", "improvementPlan", "linkedKnowledge",
  ],
} as const;

export function resolveWritingTaskContext(
  testId: string,
  partNumber: number,
  taskId?: string
): WritingTaskContext {
  const publicDataPath = path.join(
    process.cwd(),
    `data/tests/${testId}-public.json`
  );

  if (!fs.existsSync(publicDataPath)) {
    throw createGradingError(
      "UNKNOWN_QUESTION",
      `Test dataset not found for testId: ${testId}`
    );
  }

  const raw = fs.readFileSync(publicDataPath, "utf-8");
  const dataset: AptisPublicTestDataset = JSON.parse(raw);
  const writingParts = dataset.writing.parts;

  if (partNumber === 1) {
    const p1 = writingParts[0];
    const promptItem = taskId
      ? p1.prompts.find((p) => p.id === taskId || p.id.endsWith(taskId) || taskId.endsWith(p.id))
      : p1.prompts[0];

    if (!promptItem) {
      throw createGradingError(
        "UNKNOWN_QUESTION",
        `Writing Part 1 prompt not found for taskId: ${taskId}`
      );
    }

    return {
      testId,
      partNumber: 1,
      taskType: "form-filling-personal",
      taskId: promptItem.id,
      instructions: p1.instructions,
      clubContext: p1.clubContext,
      prompt: promptItem.question,
      wordGuidance: {
        officialGuidance: promptItem.wordGuidance.officialGuidance,
        minWords: promptItem.wordGuidance.projectValidationRule.min,
        maxWords: promptItem.wordGuidance.projectValidationRule.max,
      },
    };
  }

  if (partNumber === 2) {
    const p2 = writingParts[1];
    return {
      testId,
      partNumber: 2,
      taskType: "short-personal-text",
      instructions: p2.instructions,
      clubContext: p2.clubContext,
      prompt: p2.prompt,
      wordGuidance: {
        officialGuidance: p2.wordGuidance.officialGuidance,
        minWords: p2.wordGuidance.projectValidationRule.min,
        maxWords: p2.wordGuidance.projectValidationRule.max,
      },
    };
  }

  if (partNumber === 3) {
    const p3 = writingParts[2];
    const msg = taskId
      ? p3.chatMessages.find((m) => m.id === taskId || m.id.endsWith(taskId) || taskId.endsWith(m.id))
      : p3.chatMessages[0];

    if (!msg) {
      throw createGradingError(
        "UNKNOWN_QUESTION",
        `Writing Part 3 message not found for taskId: ${taskId}`
      );
    }

    return {
      testId,
      partNumber: 3,
      taskType: "social-network-chat",
      taskId: msg.id,
      instructions: p3.instructions,
      clubContext: p3.clubContext,
      prompt: `${msg.senderName}: "${msg.messageText}"`,
      wordGuidance: {
        officialGuidance: msg.wordGuidance.officialGuidance,
        minWords: msg.wordGuidance.projectValidationRule.min,
        maxWords: msg.wordGuidance.projectValidationRule.max,
      },
    };
  }

  if (partNumber === 4) {
    const p4 = writingParts[3];
    const emailTask = taskId
      ? p4.tasks.find(
          (t) =>
            t.id === taskId ||
            t.id.endsWith(taskId) ||
            taskId.endsWith(t.id) ||
            (taskId.includes("informal") && t.taskType === "informal-email") ||
            (taskId.includes("formal") && t.taskType === "formal-email") ||
            (taskId === "w4_task_a" && t.taskType === "informal-email") ||
            (taskId === "w4_task_b" && t.taskType === "formal-email")
        )
      : p4.tasks[0];

    if (!emailTask) {
      throw createGradingError(
        "UNKNOWN_QUESTION",
        `Writing Part 4 email task not found for taskId: ${taskId}`
      );
    }

    return {
      testId,
      partNumber: 4,
      taskType: emailTask.taskType,
      taskId: emailTask.id,
      instructions: p4.instructions,
      clubContext: p4.clubContext,
      managerNotice: p4.managerNotice,
      recipient: emailTask.recipient,
      register: emailTask.taskType === "informal-email" ? "informal" : "formal",
      prompt: emailTask.prompt,
      wordGuidance: {
        officialGuidance: emailTask.wordGuidance.officialGuidance,
        minWords: emailTask.wordGuidance.projectValidationRule.min,
        maxWords: emailTask.wordGuidance.projectValidationRule.max,
      },
    };
  }

  throw createGradingError(
    "UNKNOWN_QUESTION",
    `Invalid writing partNumber: ${partNumber}`
  );
}

export function evaluateWordCountStatus(
  wordCount: number,
  guidance: WritingTaskContext["wordGuidance"]
): "within_range" | "under_minimum" | "over_maximum" {
  if (guidance.minWords !== undefined && wordCount < guidance.minWords) {
    return "under_minimum";
  }
  if (guidance.maxWords !== undefined && wordCount > guidance.maxWords) {
    return "over_maximum";
  }
  return "within_range";
}

/**
 * Keep the examiner from awarding a high task score to a response that does
 * not meet the published length contract.  Gemini remains responsible for
 * language quality; this deterministic boundary only caps the final score by
 * the proportion of the requested response that was actually supplied.
 */
export function applyWordCountScoreGuard(
  score: number,
  maxScore: number,
  wordCount: number,
  status: ReturnType<typeof evaluateWordCountStatus>,
  guidance: WritingTaskContext["wordGuidance"],
): number {
  if (maxScore <= 0 || status === "within_range") return Math.max(0, Math.min(score, maxScore));

  const boundary = status === "under_minimum" ? guidance.minWords : guidance.maxWords;
  if (!boundary || boundary <= 0) return Math.max(0, Math.min(score, maxScore));

  const ratio = status === "under_minimum" ? wordCount / boundary : boundary / Math.max(wordCount, 1);
  const cap = Math.floor(maxScore * Math.max(0, Math.min(1, ratio)));
  return Math.max(0, Math.min(score, cap));
}

function bandForGuardedPercentage(percentage: number): WritingGradingResult["estimatedBand"] {
  if (percentage >= 85) return "C";
  if (percentage >= 70) return "B2";
  if (percentage >= 50) return "B1";
  if (percentage >= 30) return "A2";
  if (percentage >= 15) return "A1";
  return "A0";
}

export function parseAndValidateGeminiWritingOutput(
  rawJson: unknown
): GeminiWritingOutput {
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
            "Failed to parse Gemini output as JSON"
          );
        }
      } else {
        throw createGradingError(
          "INVALID_ANSWER_FORMAT",
          "Failed to parse Gemini output as JSON"
        );
      }
    }
  }

  // Handle nested object wrapping (e.g. { data: { ... } }, { evaluation: { ... } })
  if (parsed && typeof parsed === "object" && parsed.overallScore === undefined && parsed.overall_score === undefined) {
    if (parsed.data && typeof parsed.data === "object") parsed = parsed.data;
    else if (parsed.evaluation && typeof parsed.evaluation === "object") parsed = parsed.evaluation;
    else if (parsed.result && typeof parsed.result === "object") parsed = parsed.result;
    else if (parsed.assessment && typeof parsed.assessment === "object") parsed = parsed.assessment;
  }

  if (parsed && typeof parsed === "object") {
    // 1. Estimated Band normalization
    const rawBand = parsed.estimatedBand || parsed.estimated_band || parsed.cefrLevel || parsed.cefr_level;
    const bandMatch = typeof rawBand === "string"
      ? rawBand.toUpperCase().match(/\b(A0|A1|A2|B1|B2|C1|C2|C)\b/)
      : null;
    const band = bandMatch?.[1] === "C1" || bandMatch?.[1] === "C2" ? "C" : bandMatch?.[1];
    // Do not invent a band when the provider omits it.  The schema must reject
    // an incomplete examiner response instead of silently presenting B2.
    if (band !== undefined) parsed.estimatedBand = band;
    else if (rawBand !== undefined) parsed.estimatedBand = rawBand;

    // 2. Criteria normalization
    if (!Array.isArray(parsed.criteria)) {
      const sourceObj = parsed.criteriaScores || parsed.criteria_scores || parsed.criteriaFeedback || parsed.scores || {};
      if (typeof sourceObj === "object" && Object.keys(sourceObj).length > 0) {
        parsed.criteria = Object.entries(sourceObj).map(([name, val]: [string, any]) => ({
          name,
          // Preserve only provider-supplied numeric scores.  A missing score
          // must fail schema validation instead of becoming an optimistic 4.
          score: typeof val === "number" ? val : val?.score,
          maxScore: typeof val === "object" ? val?.maxScore : undefined,
          // Some Gemini models return score-only criteria even in JSON mode.
          // Keep the absence explicit; an empty string is not fabricated
          // feedback and allows the supplied error log/improvement plan to be
          // returned instead of rejecting an otherwise valid score.
          feedback: typeof val === "object" ? (val?.feedback ?? "") : "",
        }));
      }
    }

    // 3. Overall Score
    if (parsed.overallScore === undefined && parsed.overall_score !== undefined) {
      parsed.overallScore = parsed.overall_score;
    }
    if (parsed.overallScore === undefined && Array.isArray(parsed.criteria) && parsed.criteria.length > 0) {
      parsed.overallScore = parsed.criteria.reduce((sum: number, c: any) => sum + (c.score || 0), 0);
    }
    if (parsed.maxOverallScore === undefined && Array.isArray(parsed.criteria) && parsed.criteria.length > 0) {
      parsed.maxOverallScore = parsed.criteria.reduce((sum: number, c: any) => sum + (c.maxScore || 5), 0);
    }

    // 4. Grammar Errors normalization
    const rawGrammar = parsed.grammarErrors || parsed.grammar_errors || parsed.grammaticalErrors || parsed.grammatical_errors || parsed.errorLog || [];
    parsed.grammarErrors = Array.isArray(rawGrammar)
      ? rawGrammar.map((g: any) => ({
          originalSentence: g.originalSentence || g.original || g.mistake || g.faultyString || "",
          correctedSentence: g.correctedSentence || g.corrected || g.correction || g.correctedString || "",
          errorCategory: g.errorCategory || g.category || "Grammar",
          explanation: g.explanation || g.reason || "",
          linkedKnowledge: Array.isArray(g.linkedKnowledge) ? g.linkedKnowledge : [],
        }))
      : [];

    // 5. Vocabulary Upgrades normalization
    const rawVocab = parsed.vocabularyUpgrades || parsed.vocabulary_upgrades || parsed.lexicalUpgrades || parsed.lexical_upgrades || [];
    parsed.vocabularyUpgrades = Array.isArray(rawVocab)
      ? rawVocab.map((v: any) => ({
          originalPhrase: v.originalPhrase || v.originalWord || v.original || v.basicTerm || "",
          upgradedPhrase: v.upgradedPhrase || v.suggestedUpgrade || v.upgrade || v.b2Alternative || "",
          rationale: v.rationale || v.contextExplanation || v.explanation || v.context || "",
        }))
      : [];

    // 6. Strengths & Areas for Improvement normalization
    // Missing feedback is an incomplete examiner response, not permission to
    // fabricate a positive strength or generic assessment.
    if (!Array.isArray(parsed.strengths)) parsed.strengths = [];
    if (!Array.isArray(parsed.areasForImprovement)) parsed.areasForImprovement = [];

    // 7. Model Answer & Improvement Plan
    parsed.modelAnswer = parsed.modelAnswer || parsed.model_answer || "";
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
  }

  const result = GeminiWritingOutputSchema.safeParse(parsed);
  if (!result.success) {
    throw createGradingError(
      "INVALID_ANSWER_FORMAT",
      `Gemini output schema validation failed: ${result.error.message}`,
      result.error.issues
    );
  }

  return result.data;
}

export async function gradeWritingSubmission(
  taskContext: WritingTaskContext,
  submissionText: string,
  customClient?: GoogleGenAI,
  userId?: string
): Promise<WritingGradingResult> {
  const serverWordCount = countWords(submissionText);
  const wordCountStatus = evaluateWordCountStatus(
    serverWordCount,
    taskContext.wordGuidance
  );

  // 1. Retrieve targeted academic rubrics and strategies from Knowledge Brain
  const rubricNotes = retrieveRelevantKnowledge(
    `Writing Part ${taskContext.partNumber} ${taskContext.taskType} rubric criteria`,
    2
  );

  const client = customClient ?? getGeminiClient();
  const prompt = buildWritingGradingPrompt(
    taskContext,
    submissionText,
    serverWordCount,
    rubricNotes
  );

  const candidateModels = [GEMINI_MODELS.FLASH, GEMINI_MODELS.FLASH_3_6];
  let lastError: unknown = null;
  let validatedOutput: GeminiWritingOutput | null = null;

  for (const modelName of candidateModels) {
    try {
      const response = await withAiGradingTimeout(client.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          systemInstruction: WRITING_EXAMINER_SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: GEMINI_WRITING_RESPONSE_SCHEMA,
        },
      }));

      const rawResponseText = response.text ?? "";
      if (!rawResponseText) {
        lastError = new Error("Gemini returned an empty response");
        continue;
      }
      try {
        validatedOutput = parseAndValidateGeminiWritingOutput(rawResponseText);
        break;
      } catch (parseError) {
        lastError = parseError;
        // A malformed provider response is recoverable with the next model
        // in production, but custom test clients remain deterministic.
        if (customClient) throw parseError;
      }
    } catch (error) {
      lastError = error;
      if (customClient || error instanceof AiGradingTimeoutError) break;
    }
  }

  if (!validatedOutput) {
    if (lastError instanceof Error && lastError.message.includes("Gemini output schema validation failed")) {
      throw lastError;
    }
    throw createGradingError(
      "INVALID_ANSWER_FORMAT",
      `Gemini generation failed: ${lastError instanceof Error ? lastError.message : String(lastError)}`
    );
  }
  const guardedScore = applyWordCountScoreGuard(
    validatedOutput.overallScore,
    validatedOutput.maxOverallScore,
    serverWordCount,
    wordCountStatus,
    taskContext.wordGuidance,
  );
  const percentage =
    validatedOutput.maxOverallScore > 0
      ? (guardedScore / validatedOutput.maxOverallScore) * 100
      : 0;
  const guardedBand = wordCountStatus === "within_range"
    ? validatedOutput.estimatedBand
    : bandForGuardedPercentage(percentage);
  const lengthFeedback = wordCountStatus === "under_minimum"
    ? `Bài viết có ${serverWordCount} từ, dưới mức tối thiểu ${taskContext.wordGuidance.minWords} từ; điểm tổng đã được giới hạn theo độ dài.`
    : wordCountStatus === "over_maximum"
    ? `Bài viết có ${serverWordCount} từ, vượt mức tối đa ${taskContext.wordGuidance.maxWords} từ; điểm tổng đã được giới hạn theo độ dài.`
    : null;
  const areasForImprovement = lengthFeedback && !validatedOutput.areasForImprovement.some((item) => item.includes("độ dài") || item.includes("word"))
    ? [...validatedOutput.areasForImprovement, lengthFeedback]
    : validatedOutput.areasForImprovement;

  // 2. Automatically record detected errors into persistent User Learning Memory
  if (userId && validatedOutput.grammarErrors.length > 0) {
    try {
      for (const err of validatedOutput.grammarErrors) {
        const topicCategory = err.errorCategory || "Writing Grammar";
        recordUserError(
          userId,
          "Writing",
          `writing-${topicCategory.toLowerCase().replace(/\s+/g, "-")}`,
          topicCategory,
          err.originalSentence
        );
      }
    } catch {
      // Memory recording should never block evaluation return
    }
  }

  const linkedKnowledge = validatedOutput.linkedKnowledge && validatedOutput.linkedKnowledge.length > 0
    ? validatedOutput.linkedKnowledge
    : rubricNotes.map((k) => k.topic);

  return {
    testId: taskContext.testId,
    partNumber: taskContext.partNumber,
    taskType: taskContext.taskType,
    wordCount: serverWordCount,
    wordCountStatus,
    overallScore: guardedScore,
    maxOverallScore: validatedOutput.maxOverallScore,
    percentage,
    estimatedBand: guardedBand,
    scoreType: "AI_ESTIMATE",
    criteria: validatedOutput.criteria,
    grammarErrors: validatedOutput.grammarErrors,
    vocabularyUpgrades: validatedOutput.vocabularyUpgrades,
    strengths: validatedOutput.strengths,
    areasForImprovement,
    modelAnswer: validatedOutput.modelAnswer,
    correctedVersion: validatedOutput.correctedVersion,
    improvementPlan: validatedOutput.improvementPlan.length > 0
      ? validatedOutput.improvementPlan
      : [
          "Ôn tập lại các điểm ngữ pháp được cảnh báo bên trên",
          "Viết lại đoạn văn áp dụng các cụm từ B2 nâng cấp",
          "Luyện thêm 1 bài viết cùng Part trong kho đề Aptis B2",
        ],
    linkedKnowledge,
    disclaimer: "PRACTICE ESTIMATE — NOT AN OFFICIAL BRITISH COUNCIL SCORE",
  };
}
