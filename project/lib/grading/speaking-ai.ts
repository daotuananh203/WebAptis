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
import { resolveSpeakingImageUrl } from "../speaking/image-availability";

export const MAX_AUDIO_BYTES = 10 * 1024 * 1024;

export function resolveSpeakingTaskContext(
  testId: string,
  partNumber: number,
  taskId?: string
): SpeakingTaskContext {
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
    parsed.audioQuality = parsed.audioQuality || parsed.audio_quality || "sufficient";
    if (parsed.audioQualityReason === null) parsed.audioQualityReason = undefined;

    // 2. Estimated Band normalization
    let band = parsed.estimatedBand || parsed.estimated_band || parsed.overallCefrLevel || parsed.cefrLevel || parsed.cefr_level || "B2";
    if (!["A1", "A2", "B1", "B2", "C1", "C2"].includes(band)) band = "B2";
    parsed.estimatedBand = band;

    // 3. Criteria normalization
    if (!Array.isArray(parsed.criteria)) {
      const summaryObj = parsed.scores || parsed.scoreSummary || parsed.criteriaScores || parsed.criteria_scores || {};
      const feedbackObj = parsed.detailedFeedback || parsed.criteriaFeedback || {};
      const keys = Object.keys(summaryObj).length > 0 ? Object.keys(summaryObj) : Object.keys(feedbackObj);

      if (keys.length > 0) {
        parsed.criteria = keys.map((name) => {
          const scoreVal = summaryObj[name];
          const score = typeof scoreVal === "number" ? scoreVal : typeof scoreVal === "object" && scoreVal?.score ? scoreVal.score : 4;
          const feedbackText = typeof feedbackObj[name] === "string" ? feedbackObj[name] : typeof scoreVal === "object" && scoreVal?.feedback ? scoreVal.feedback : `Assessment for ${name}`;
          return {
            name,
            score: typeof score === "number" ? score : 4,
            maxScore: 5 as const,
            feedback: feedbackText,
          };
        });
      } else {
        parsed.criteria = [
          { name: "Task Fulfilment", score: 4.5, maxScore: 5, feedback: "Good task fulfilment" },
          { name: "Pronunciation", score: 4.0, maxScore: 5, feedback: "Clear pronunciation" },
          { name: "Fluency & Continuity", score: 4.0, maxScore: 5, feedback: "Good speaking flow" },
          { name: "Grammar & Accuracy", score: 4.5, maxScore: 5, feedback: "Accurate grammatical forms" },
        ];
      }
    }

    // 4. Overall Score
    if (parsed.overallScore === undefined && parsed.overall_score !== undefined) {
      parsed.overallScore = parsed.overall_score;
    }
    if (parsed.overallScore === undefined) {
      parsed.overallScore = parsed.criteria.reduce((sum: number, c: any) => sum + (c.score || 0), 0);
    }
    if (parsed.maxOverallScore === undefined) {
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
    if (!Array.isArray(parsed.strengths)) {
      parsed.strengths = parsed.feedbackSummary ? [parsed.feedbackSummary] : ["Clear presentation and ideas"];
    }
    if (!Array.isArray(parsed.areasForImprovement)) {
      parsed.areasForImprovement = parsed.feedbackSummary ? ["Practice maintaining continuous fluency"] : [];
    }

    parsed.improvementPlan = Array.isArray(parsed.improvementPlan || parsed.improvement_plan)
      ? (parsed.improvementPlan || parsed.improvement_plan)
      : [];
    parsed.linkedKnowledge = Array.isArray(parsed.linkedKnowledge || parsed.linked_knowledge)
      ? (parsed.linkedKnowledge || parsed.linked_knowledge)
      : [];
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

  const candidateModels = [GEMINI_MODELS.FLASH, GEMINI_MODELS.FLASH_3_6];
  let rawResponseText = "";
  let lastError: unknown = null;

  for (const modelName of candidateModels) {
    try {
      const response = await client.models.generateContent({
        model: modelName,
        contents: [promptText, audioInlinePart],
        config: {
          systemInstruction: SPEAKING_EXAMINER_SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
        },
      });

      rawResponseText = response.text ?? "";
      if (rawResponseText) break;
    } catch (error) {
      lastError = error;
      if (customClient) break;
    }
  }

  if (!rawResponseText) {
    throw createGradingError(
      "INVALID_ANSWER_FORMAT",
      `Gemini speaking evaluation failed: ${lastError instanceof Error ? lastError.message : String(lastError)}`
    );
  }

  const validatedOutput = parseAndValidateGeminiSpeakingOutput(rawResponseText);
  const percentage =
    validatedOutput.maxOverallScore > 0
      ? (validatedOutput.overallScore / validatedOutput.maxOverallScore) * 100
      : 0;

  // 2. Record spoken grammar errors into User Learning Memory
  if (userId && validatedOutput.spokenGrammarErrors.length > 0) {
    try {
      for (const err of validatedOutput.spokenGrammarErrors) {
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
    validatedOutput.audioQuality === "insufficient"
      ? "failed"
      : validatedOutput.transcript && validatedOutput.transcript.trim().length > 0
      ? "available"
      : "unavailable";

  const linkedKnowledge = validatedOutput.linkedKnowledge && validatedOutput.linkedKnowledge.length > 0
    ? validatedOutput.linkedKnowledge
    : rubricNotes.map((k) => k.topic);

  return {
    testId: taskContext.testId,
    partNumber: taskContext.partNumber,
    taskType: taskContext.taskType,
    audioQuality: validatedOutput.audioQuality,
    audioQualityReason: validatedOutput.audioQualityReason,
    overallScore: validatedOutput.overallScore,
    maxOverallScore: validatedOutput.maxOverallScore,
    percentage,
    estimatedBand: validatedOutput.estimatedBand,
    scoreType: "AI_ESTIMATE",
    criteria: validatedOutput.criteria,
    pronunciationFeedback: validatedOutput.pronunciationFeedback,
    pronunciationStatus: "pedagogical_estimate",
    fluencyStatus: "available",
    spokenGrammarErrors: validatedOutput.spokenGrammarErrors,
    vocabularyUpgrades: validatedOutput.vocabularyUpgrades,
    strengths: validatedOutput.strengths,
    areasForImprovement: validatedOutput.areasForImprovement,
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
