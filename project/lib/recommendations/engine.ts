/**
 * AI Coach Recommendation Engine
 * Pure, deterministic orchestrator combining learning statistics and adaptive rules.
 */

import { calculateOverallStatistics } from "../progress/statistics";
import { ProgressAttemptRecord } from "../progress/types";
import {
  generateCriticalWeaknessRecommendations,
  generateDecliningTrendRecommendations,
  generateInitialDiagnosticRecommendations,
  generateMockTestReadinessRecommendations,
  generateModerateWeaknessRecommendations,
  generateNeglectedSkillRecommendations,
} from "./rules";
import {
  AICoachContext,
  RecommendationEngineResult,
  StudyRecommendation,
} from "./types";

export interface RecommendationEngineOptions {
  maxRecommendations?: number;
  criticalThresholdPercentage?: number;
  moderateThresholdPercentage?: number;
}

/**
 * Generate prioritized, actionable study recommendations from candidate history.
 */
export function generateRecommendations(
  history: ProgressAttemptRecord[],
  options?: RecommendationEngineOptions
): RecommendationEngineResult {
  const maxRecs = options?.maxRecommendations ?? 5;
  const stats = calculateOverallStatistics(history, {
    criticalThresholdPercentage: options?.criticalThresholdPercentage,
    moderateThresholdPercentage: options?.moderateThresholdPercentage,
  });

  const candidates: StudyRecommendation[] = [];

  // 1. Initial Diagnostic (for new users)
  candidates.push(...generateInitialDiagnosticRecommendations(history.length));

  // 2. Critical & Moderate Weaknesses
  candidates.push(...generateCriticalWeaknessRecommendations(stats));
  candidates.push(...generateModerateWeaknessRecommendations(stats));

  // 3. Score Drops & Declining Trends
  candidates.push(...generateDecliningTrendRecommendations(stats));

  // 4. Neglected Skills
  candidates.push(...generateNeglectedSkillRecommendations(stats));

  // 5. Full Mock Test Readiness
  candidates.push(...generateMockTestReadinessRecommendations(stats));

  // Deduplicate by skill + partIdentifier
  const seenKeys = new Set<string>();
  const deduplicated: StudyRecommendation[] = [];

  // Sort by scoreWeight descending
  candidates.sort((a, b) => b.scoreWeight - a.scoreWeight);

  for (const rec of candidates) {
    const key = `${rec.skill}_${rec.partIdentifier || "all"}_${rec.basedOn}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      deduplicated.push(rec);
    }
  }

  const sliced = deduplicated.slice(0, maxRecs);
  const primaryRecommendation = sliced.length > 0 ? sliced[0] : null;
  const secondaryRecommendations = sliced.slice(1);

  let summaryMessage = "Start with a practice session to build your study profile.";
  if (primaryRecommendation) {
    if (primaryRecommendation.priority === "critical") {
      summaryMessage = `Action required: Focus on ${primaryRecommendation.title} to address critical score gaps.`;
    } else if (primaryRecommendation.basedOn === "mock_test_readiness") {
      summaryMessage = "Great progress across all skills! You are ready for a full Mock Test simulation.";
    } else {
      summaryMessage = `Next best action: ${primaryRecommendation.title} to improve B2 readiness.`;
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    totalRecommendations: sliced.length,
    primaryRecommendation,
    secondaryRecommendations,
    summaryMessage,
    disclaimer: "PRACTICE ESTIMATE — NOT AN OFFICIAL BRITISH COUNCIL SCORE",
  };
}

/**
 * Prepare structured AI Coach context for downstream Gemini interactions.
 */
export function prepareAICoachContext(
  history: ProgressAttemptRecord[]
): AICoachContext {
  const overallStats = calculateOverallStatistics(history);
  const { primaryRecommendation, secondaryRecommendations } =
    generateRecommendations(history);

  const allRecs = primaryRecommendation
    ? [primaryRecommendation, ...secondaryRecommendations]
    : [];

  const lastAttempt =
    history.length > 0 ? history[history.length - 1] : undefined;

  return {
    overallStats,
    recommendations: allRecs,
    recentHistorySummary: {
      totalAttempts: history.length,
      lastActiveSkill: lastAttempt?.skill,
      lastScorePercentage: lastAttempt?.percentage,
    },
  };
}
