/**
 * AI Coach Conversational Advisor Service
 * Orchestrates Gemini 3.7 Flash conversational advice based on trusted AICoachContext, User Memory, and retrieved Edulife Knowledge.
 */

import { GoogleGenAI } from "@google/genai";
import { getGeminiClient } from "../gemini/client";
import { DEFAULT_TASK_MODELS, GEMINI_MODELS } from "../gemini/models";
import { getGeminiConfig } from "../gemini/config";
import { GradingError, createGradingError } from "../grading/errors";
import { retrieveRelevantKnowledge } from "../knowledge/retriever";
import { KnowledgeItem } from "../knowledge/types";
import { loadUserMemory } from "../memory/store";
import {
  AI_COACH_SYSTEM_INSTRUCTION,
  buildAICoachPrompt,
} from "./prompts";
import {
  AICoachChatInput,
  AICoachChatResponse,
  GeminiCoachOutput,
  GeminiCoachOutputSchema,
  RetrievedKnowledgeReference,
} from "./types";
import { AiGradingTimeoutError, withAiGradingTimeout } from "../grading/ai-timeout";

export const AI_COACH_TIMEOUT_MS = 20_000;
export const AI_COACH_MAX_ATTEMPTS = 2;
export const AI_COACH_RETRY_DELAY_MS = 150;

export interface CoachAdviceOptions {
  requestId?: string;
  maxAttempts?: number;
  retryDelayMs?: number;
}

function clampAttempts(value: number | undefined): number {
  if (!Number.isFinite(value)) return AI_COACH_MAX_ATTEMPTS;
  return Math.max(1, Math.min(AI_COACH_MAX_ATTEMPTS, Math.floor(value as number)));
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function safeErrorType(error: unknown): string {
  return error instanceof AiGradingTimeoutError
    ? "timeout"
    : error instanceof GradingError
      ? error.code
      : error instanceof Error
        ? error.name || "Error"
        : "UnknownError";
}

function providerStatus(error: unknown): number | undefined {
  if (!error || typeof error !== "object") return undefined;
  const candidate = error as { status?: unknown; statusCode?: unknown; code?: unknown };
  const status = candidate.status ?? candidate.statusCode;
  return typeof status === "number" && Number.isInteger(status) ? status : undefined;
}

function isRetryableProviderFailure(error: unknown): boolean {
  if (error instanceof AiGradingTimeoutError) return true;
  if (error instanceof GradingError) return error.code === "AI_PROVIDER_ERROR";
  if (error instanceof TypeError) return false;

  const status = providerStatus(error);
  if (status !== undefined) return status === 408 || status === 409 || status === 425 || status === 429 || status >= 500;

  const message = error instanceof Error ? error.message.toLowerCase() : "";
  if (/(api\s*key|authentication|unauthori[sz]ed|forbidden|permission denied|invalid argument|bad request)/i.test(message)) {
    return false;
  }
  return true;
}

function logCoachAttempt(input: {
  requestId?: string;
  attempt: number;
  maxAttempts: number;
  model: string;
  latencyMs: number;
  outcome: "success" | "error";
  errorCategory?: string;
  retryable?: boolean;
}) {
  const payload = {
    requestId: input.requestId ?? "not-provided",
    attempt: input.attempt,
    maxAttempts: input.maxAttempts,
    model: input.model,
    latencyMs: input.latencyMs,
    outcome: input.outcome,
    errorCategory: input.errorCategory,
    retryable: input.retryable,
    retryScheduled: input.outcome === "error" && input.attempt < input.maxAttempts && input.retryable !== false,
  };

  if (input.outcome === "error") {
    console.warn("[AI Coach] provider attempt failed", payload);
  } else {
    console.info("[AI Coach] provider attempt completed", payload);
  }
}

function providerFailure(message: string, details?: unknown): GradingError {
  return createGradingError("AI_PROVIDER_ERROR", message, details);
}

function coachCandidateModels(): string[] {
  const configuredModel = getGeminiConfig().taskModels.aiCoach || DEFAULT_TASK_MODELS.aiCoach;
  return Array.from(new Set([configuredModel, GEMINI_MODELS.FLASH, GEMINI_MODELS.FLASH_3_6]));
}

/**
 * Safely parse and validate Gemini's JSON output for the AI Coach.
 */
export function parseAndValidateCoachOutput(rawJson: unknown): GeminiCoachOutput {
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
            "Failed to parse Gemini AI Coach output as JSON"
          );
        }
      } else {
        throw createGradingError(
          "INVALID_ANSWER_FORMAT",
          "Failed to parse Gemini AI Coach output as JSON"
        );
      }
    }
  }

  const result = GeminiCoachOutputSchema.safeParse(parsed);
  if (result.success) {
    return result.data;
  }

  // Graceful recovery if object contains message/text but minor field differences
  if (parsed && typeof parsed === "object" && (typeof parsed.message === "string" || typeof parsed.text === "string")) {
    const message = (parsed.message || parsed.text || "").trim();
    if (message.length > 0) {
      return {
        message,
        mode: typeof parsed.mode === "string" ? parsed.mode : "Coach",
        explanation: typeof parsed.explanation === "string" ? parsed.explanation : undefined,
        evidence: typeof parsed.evidence === "string" ? parsed.evidence : undefined,
        relatedKnowledgeIds: Array.isArray(parsed.relatedKnowledgeIds) ? parsed.relatedKnowledgeIds.map(String) : undefined,
        relatedRecommendationId: typeof parsed.relatedRecommendationId === "string" ? parsed.relatedRecommendationId : null,
        actionSuggestions: Array.isArray(parsed.actionSuggestions) ? parsed.actionSuggestions.map(String).slice(0, 5) : [],
      };
    }
  }

  throw createGradingError(
    "INVALID_ANSWER_FORMAT",
    `Gemini AI Coach schema validation failed: ${result.error.message}`,
    result.error.issues
  );
}

/**
 * Core AI Coach Advice Generator.
 * Retrieves targeted knowledge items, loads user memory, and prompts Gemini with fallback.
 */
export async function getCoachAdvice(
  input: AICoachChatInput,
  customClient?: GoogleGenAI,
  injectedKnowledge?: KnowledgeItem[],
  timeoutMs = AI_COACH_TIMEOUT_MS,
  options: CoachAdviceOptions = {},
): Promise<AICoachChatResponse> {
  // 1. Retrieve targeted knowledge items (Max 3 to avoid prompt bloat)
  const retrievedKnowledge = injectedKnowledge ?? retrieveRelevantKnowledge(input.userMessage, 3);

  // 2. Load persistent user memory if userId provided
  const userMemory = input.userId ? loadUserMemory(input.userId) : undefined;

  // 3. Build structured prompt
  const prompt = buildAICoachPrompt(input.coachContext, input.userMessage, retrievedKnowledge, userMemory);

  let client: GoogleGenAI;
  try {
    client = customClient ?? getGeminiClient();
  } catch (error) {
    logCoachAttempt({
      requestId: options.requestId,
      attempt: 1,
      maxAttempts: 1,
      model: "configured",
      latencyMs: 0,
      outcome: "error",
      errorCategory: safeErrorType(error),
    });
    throw providerFailure("AI Coach provider is unavailable");
  }

  const maxAttempts = clampAttempts(options.maxAttempts);
  const retryDelayMs = Math.max(0, Math.min(1_000, options.retryDelayMs ?? AI_COACH_RETRY_DELAY_MS));
  const candidateModels = coachCandidateModels();
  let validatedOutput: GeminiCoachOutput | undefined;
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const modelName = candidateModels[(attempt - 1) % candidateModels.length];
    const startedAt = Date.now();
    try {
      const response = await withAiGradingTimeout(
        (abortSignal) => client.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            systemInstruction: AI_COACH_SYSTEM_INSTRUCTION,
            responseMimeType: "application/json",
            abortSignal,
          },
        }),
        timeoutMs,
      );

      const rawResponseText = typeof response.text === "string" ? response.text.trim() : "";
      if (!rawResponseText) {
        throw providerFailure("AI Coach provider returned an empty response");
      }

      try {
        validatedOutput = parseAndValidateCoachOutput(rawResponseText);
      } catch (error) {
        // INVALID_ANSWER_FORMAT is a parser-level detail, not a client error.
        // A malformed provider response is retryable and must never become HTTP 400.
        throw providerFailure("AI Coach provider returned an invalid response", {
          parserError: safeErrorType(error),
        });
      }

      logCoachAttempt({
        requestId: options.requestId,
        attempt,
        maxAttempts,
        model: modelName,
        latencyMs: Date.now() - startedAt,
        outcome: "success",
      });
      break;
    } catch (error) {
      lastError = error;
      const retryable = isRetryableProviderFailure(error);
      logCoachAttempt({
        requestId: options.requestId,
        attempt,
        maxAttempts,
        model: modelName,
        latencyMs: Date.now() - startedAt,
        outcome: "error",
        errorCategory: safeErrorType(error),
        retryable,
      });
      if (attempt < maxAttempts && retryable) {
        await sleep(retryDelayMs * 2 ** (attempt - 1));
      } else if (!retryable) {
        break;
      }
    }
  }

  if (!validatedOutput) {
    if (lastError instanceof AiGradingTimeoutError) {
      throw createGradingError("GRADING_TIMEOUT", "AI Coach provider timed out");
    }
    throw providerFailure("AI Coach provider failed after bounded retries", {
      lastErrorType: safeErrorType(lastError),
    });
  }

  // 4. Map retrieved knowledge reference metadata
  const knowledgeRefs: RetrievedKnowledgeReference[] = retrievedKnowledge.map((k) => ({
    id: k.id,
    topic: k.topic,
    summary: k.summary,
    category: k.category,
    sourceFile: k.sourceFile,
    sourceName: k.sourceName,
  }));

  return {
    message: validatedOutput.message,
    mode: validatedOutput.mode,
    explanation: validatedOutput.explanation,
    evidence: validatedOutput.evidence,
    relatedKnowledgeIds: validatedOutput.relatedKnowledgeIds ?? retrievedKnowledge.map((k) => k.id),
    relatedRecommendationId: validatedOutput.relatedRecommendationId || null,
    actionSuggestions: validatedOutput.actionSuggestions || [],
    retrievedKnowledge: knowledgeRefs.length > 0 ? knowledgeRefs : undefined,
    disclaimer: "PRACTICE ESTIMATE — NOT AN OFFICIAL BRITISH COUNCIL SCORE",
  };
}
