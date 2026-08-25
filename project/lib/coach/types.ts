/**
 * AI Coach Conversational Advisor Domain Types
 * Strongly typed schemas for chat requests, structured coach responses, and advisor contexts.
 */

import { z } from "zod";
import { AICoachContext } from "../recommendations/types";

// ==========================================
// 1. DEFAULT COACH CONTEXT
// ==========================================

export const DEFAULT_EMPTY_COACH_CONTEXT: AICoachContext = {
  overallStats: {
    totalAttempts: 0,
    totalTimeSpentSeconds: 0,
    overallAccuracyPercentage: 0,
    skillMetrics: {
      grammarVocabulary: { skill: "grammarVocabulary", totalAttempts: 0, averagePercentage: 0, highestPercentage: 0, latestPercentage: 0, improvementTrend: "stable", totalTimeSpentSeconds: 0 },
      reading: { skill: "reading", totalAttempts: 0, averagePercentage: 0, highestPercentage: 0, latestPercentage: 0, improvementTrend: "stable", totalTimeSpentSeconds: 0 },
      listening: { skill: "listening", totalAttempts: 0, averagePercentage: 0, highestPercentage: 0, latestPercentage: 0, improvementTrend: "stable", totalTimeSpentSeconds: 0 },
      writing: { skill: "writing", totalAttempts: 0, averagePercentage: 0, highestPercentage: 0, latestPercentage: 0, improvementTrend: "stable", totalTimeSpentSeconds: 0 },
      speaking: { skill: "speaking", totalAttempts: 0, averagePercentage: 0, highestPercentage: 0, latestPercentage: 0, improvementTrend: "stable", totalTimeSpentSeconds: 0 },
    },
    partMetrics: [],
    weakAreas: [],
  },
  recommendations: [],
  recentHistorySummary: {
    totalAttempts: 0,
  },
};

// ==========================================
// 2. INPUT VALIDATION SCHEMAS
// ==========================================

export const ChatHistoryMessageSchema = z.object({
  role: z.enum(["user", "model", "coach"]),
  content: z.string().max(2000),
});

export const AICoachChatInputSchema = z.object({
  userMessage: z
    .string()
    .min(1, "Message cannot be empty")
    .max(1000, "Message exceeds 1000 characters maximum length"),
  coachContext: z
    .custom<AICoachContext>((val) => typeof val === "object" && val !== null, {
      message: "Invalid AICoachContext provided",
    })
    .optional()
    .default(DEFAULT_EMPTY_COACH_CONTEXT),
  userId: z.string().optional(),
  history: z.array(ChatHistoryMessageSchema).optional(),
});

export type AICoachChatInput = z.infer<typeof AICoachChatInputSchema>;

// ==========================================
// 3. STRUCTURED GEMINI OUTPUT SCHEMAS
// ==========================================

export const GeminiCoachOutputSchema = z.object({
  message: z.string().min(1, "Response message cannot be empty"),
  mode: z.enum(["Explain", "Why", "How", "Strategy", "Example", "Compare", "Correct", "Coach", "Review", "ExamPreparation"]).optional().default("Coach"),
  explanation: z.string().optional(),
  evidence: z.string().optional(),
  relatedKnowledgeIds: z.array(z.string()).optional(),
  relatedRecommendationId: z.string().nullable().optional(),
  actionSuggestions: z.array(z.string()).max(5).default([]),
});

export type GeminiCoachOutput = z.infer<typeof GeminiCoachOutputSchema>;

// ==========================================
// 4. FINAL CLIENT-SAFE RESULT SCHEMA
// ==========================================

export interface RetrievedKnowledgeReference {
  id: string;
  topic: string;
  summary: string;
  category: string;
  sourceFile: string;
  sourceName: string;
}

export interface AICoachChatResponse {
  message: string;
  mode?: string;
  explanation?: string;
  evidence?: string;
  relatedKnowledgeIds?: string[];
  relatedRecommendationId: string | null;
  actionSuggestions: string[];
  retrievedKnowledge?: RetrievedKnowledgeReference[];
  disclaimer: "PRACTICE ESTIMATE — NOT AN OFFICIAL BRITISH COUNCIL SCORE";
}
