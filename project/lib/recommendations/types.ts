/**
 * AI Coach Recommendation Engine Domain Types
 * Strongly typed models for adaptive study recommendations and AI Coach context.
 */

import { ExamComponentSkill, LearningMode, OverallLearningStatistics, ProgressAttemptRecord } from "../progress/types";

export type RecommendationPriority = "critical" | "high" | "medium" | "low";

export type RecommendationTriggerReason =
  | "critical_weakness"
  | "moderate_weakness"
  | "declining_trend"
  | "neglected_skill"
  | "retention_reinforcement"
  | "mock_test_readiness"
  | "initial_diagnostic";

export interface StudyRecommendation {
  id: string;
  skill: ExamComponentSkill;
  partIdentifier?: string;
  priority: RecommendationPriority;
  scoreWeight: number; // Used for deterministic sorting (higher = higher priority)
  title: string;
  reason: string;
  suggestedAction: string;
  targetMode: LearningMode;
  basedOn: RecommendationTriggerReason;
  estimatedMinutes: number;
}

export interface RecommendationEngineResult {
  generatedAt: string; // ISO 8601 string
  totalRecommendations: number;
  primaryRecommendation: StudyRecommendation | null;
  secondaryRecommendations: StudyRecommendation[];
  summaryMessage: string;
  disclaimer: "PRACTICE ESTIMATE — NOT AN OFFICIAL BRITISH COUNCIL SCORE";
}

/**
 * Structured context prepared for future Gemini AI Coach conversational interactions.
 */
export interface AICoachContext {
  overallStats: OverallLearningStatistics;
  recommendations: StudyRecommendation[];
  recentHistorySummary: {
    totalAttempts: number;
    lastActiveSkill?: ExamComponentSkill;
    lastScorePercentage?: number;
  };
}
