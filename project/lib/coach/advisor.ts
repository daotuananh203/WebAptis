/**
 * AI Coach Conversational Advisor Service
 * Orchestrates Gemini 3.7 Flash conversational advice based on trusted AICoachContext, User Memory, and retrieved Edulife Knowledge.
 */

import { GoogleGenAI } from "@google/genai";
import { getGeminiClient } from "../gemini/client";
import { GEMINI_MODELS } from "../gemini/models";
import { createGradingError } from "../grading/errors";
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
import { AI_GRADING_TIMEOUT_MS, AiGradingTimeoutError, withAiGradingTimeout } from "../grading/ai-timeout";

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
  timeoutMs = AI_GRADING_TIMEOUT_MS,
): Promise<AICoachChatResponse> {
  const client = customClient ?? getGeminiClient();

  // 1. Retrieve targeted knowledge items (Max 3 to avoid prompt bloat)
  const retrievedKnowledge = injectedKnowledge ?? retrieveRelevantKnowledge(input.userMessage, 3);

  // 2. Load persistent user memory if userId provided
  const userMemory = input.userId ? loadUserMemory(input.userId) : undefined;

  // 3. Build structured prompt
  const prompt = buildAICoachPrompt(input.coachContext, input.userMessage, retrievedKnowledge, userMemory);

  const candidateModels = [GEMINI_MODELS.FLASH, GEMINI_MODELS.FLASH_3_6];
  let rawResponseText = "";
  let lastError: unknown = null;

  for (const modelName of candidateModels) {
    try {
      const response = await withAiGradingTimeout(client.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          systemInstruction: AI_COACH_SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
        },
      }), timeoutMs);

      rawResponseText = response.text ?? "";
      if (rawResponseText) break;
    } catch (error) {
      lastError = error;
      if (customClient || error instanceof AiGradingTimeoutError) break;
    }
  }

  if (!rawResponseText) {
    if (lastError instanceof AiGradingTimeoutError) throw lastError;
    throw createGradingError(
      "INVALID_ANSWER_FORMAT",
      `Gemini AI Coach execution failed: ${lastError instanceof Error ? lastError.message : String(lastError)}`
    );
  }

  const validatedOutput = parseAndValidateCoachOutput(rawResponseText);

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
