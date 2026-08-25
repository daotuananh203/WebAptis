/**
 * Progress Statistics Calculator
 * Pure functions to compute skill metrics, accuracy, improvement trends, and weak/strong areas.
 */

import {
  ExamComponentSkill,
  OverallLearningStatistics,
  PartPerformanceMetric,
  ProgressAttemptRecord,
  SkillPerformanceMetric,
  WeakAreaIndicator,
} from "./types";

export const ALL_EXAM_SKILLS: ExamComponentSkill[] = [
  "grammarVocabulary",
  "reading",
  "listening",
  "writing",
  "speaking",
];

export interface StatisticsOptions {
  criticalThresholdPercentage?: number; // default: 55
  moderateThresholdPercentage?: number; // default: 70
}

/**
 * Calculate performance metrics for a specific skill.
 */
export function calculateSkillPerformance(
  history: ProgressAttemptRecord[],
  skill: ExamComponentSkill
): SkillPerformanceMetric {
  const skillAttempts = history
    .filter((a) => a.skill === skill)
    .sort(
      (a, b) =>
        new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
    );

  if (skillAttempts.length === 0) {
    return {
      skill,
      totalAttempts: 0,
      averagePercentage: 0,
      highestPercentage: 0,
      latestPercentage: 0,
      improvementTrend: "stable",
      totalTimeSpentSeconds: 0,
    };
  }

  const percentages = skillAttempts.map((a) => a.percentage);
  const totalScore = percentages.reduce((acc, p) => acc + p, 0);
  const averagePercentage = Math.round((totalScore / percentages.length) * 10) / 10;
  const highestPercentage = Math.round(Math.max(...percentages) * 10) / 10;
  const latestPercentage =
    Math.round(percentages[percentages.length - 1] * 10) / 10;
  const totalTimeSpentSeconds = skillAttempts.reduce(
    (acc, a) => acc + (a.durationSeconds || 0),
    0
  );

  // Compute trend: recent (up to 3 latest) vs previous
  let improvementTrend: "improving" | "stable" | "declining" = "stable";
  if (skillAttempts.length >= 2) {
    const recentCount = Math.min(3, Math.floor(skillAttempts.length / 2) || 1);
    const recentAttempts = percentages.slice(-recentCount);
    const previousAttempts = percentages.slice(0, -recentCount);

    if (previousAttempts.length > 0) {
      const recentAvg =
        recentAttempts.reduce((a, b) => a + b, 0) / recentAttempts.length;
      const prevAvg =
        previousAttempts.reduce((a, b) => a + b, 0) / previousAttempts.length;
      const diff = recentAvg - prevAvg;

      if (diff >= 3) {
        improvementTrend = "improving";
      } else if (diff <= -3) {
        improvementTrend = "declining";
      }
    }
  }

  return {
    skill,
    totalAttempts: skillAttempts.length,
    averagePercentage,
    highestPercentage,
    latestPercentage,
    improvementTrend,
    totalTimeSpentSeconds,
  };
}

/**
 * Calculate performance metrics for all distinct sub-parts across attempts.
 */
export function calculatePartPerformance(
  history: ProgressAttemptRecord[]
): PartPerformanceMetric[] {
  const partMap = new Map<
    string,
    { skill: ExamComponentSkill; partIdentifier: string; scores: number[] }
  >();

  for (const record of history) {
    if (!record.partIdentifier) continue;
    const key = `${record.skill}_${record.partIdentifier}`;
    const existing = partMap.get(key);
    if (existing) {
      existing.scores.push(record.percentage);
    } else {
      partMap.set(key, {
        skill: record.skill,
        partIdentifier: record.partIdentifier,
        scores: [record.percentage],
      });
    }
  }

  const results: PartPerformanceMetric[] = [];
  for (const entry of partMap.values()) {
    const total = entry.scores.reduce((a, b) => a + b, 0);
    const average = Math.round((total / entry.scores.length) * 10) / 10;
    const latest = Math.round(entry.scores[entry.scores.length - 1] * 10) / 10;

    results.push({
      skill: entry.skill,
      partIdentifier: entry.partIdentifier,
      totalAttempts: entry.scores.length,
      averagePercentage: average,
      latestPercentage: latest,
    });
  }

  return results.sort((a, b) => a.averagePercentage - b.averagePercentage);
}

/**
 * Identify weak areas dynamically using configurable thresholds.
 */
export function calculateWeakAreas(
  history: ProgressAttemptRecord[],
  options?: StatisticsOptions
): WeakAreaIndicator[] {
  const criticalThreshold = options?.criticalThresholdPercentage ?? 55;
  const moderateThreshold = options?.moderateThresholdPercentage ?? 70;

  const partMetrics = calculatePartPerformance(history);
  const weakAreas: WeakAreaIndicator[] = [];

  for (const part of partMetrics) {
    if (part.averagePercentage < moderateThreshold) {
      const isCritical = part.averagePercentage < criticalThreshold;
      weakAreas.push({
        skill: part.skill,
        partIdentifier: part.partIdentifier,
        averagePercentage: part.averagePercentage,
        attemptCount: part.totalAttempts,
        urgency: isCritical ? "critical" : "moderate",
        reason: `Average score of ${part.averagePercentage}% is below the target B2 readiness threshold (${moderateThreshold}%).`,
      });
    }
  }

  return weakAreas.sort((a, b) => a.averagePercentage - b.averagePercentage);
}

/**
 * Calculate overall learning statistics across all skills and attempts.
 */
export function calculateOverallStatistics(
  history: ProgressAttemptRecord[],
  options?: StatisticsOptions
): OverallLearningStatistics {
  const totalAttempts = history.length;
  const totalTimeSpentSeconds = history.reduce(
    (acc, a) => acc + (a.durationSeconds || 0),
    0
  );

  const overallAccuracyPercentage =
    totalAttempts > 0
      ? Math.round(
          (history.reduce((acc, a) => acc + a.percentage, 0) / totalAttempts) * 10
        ) / 10
      : 0;

  const skillMetrics = {} as Record<ExamComponentSkill, SkillPerformanceMetric>;
  for (const skill of ALL_EXAM_SKILLS) {
    skillMetrics[skill] = calculateSkillPerformance(history, skill);
  }

  const partMetrics = calculatePartPerformance(history);
  const weakAreas = calculateWeakAreas(history, options);

  // Find strongest and weakest skills among those with at least 1 attempt
  const activeSkills = ALL_EXAM_SKILLS.filter(
    (s) => skillMetrics[s].totalAttempts > 0
  );

  let strongestSkill: ExamComponentSkill | undefined;
  let weakestSkill: ExamComponentSkill | undefined;

  if (activeSkills.length > 0) {
    activeSkills.sort(
      (a, b) =>
        skillMetrics[b].averagePercentage - skillMetrics[a].averagePercentage
    );
    strongestSkill = activeSkills[0];
    weakestSkill = activeSkills[activeSkills.length - 1];
  }

  return {
    totalAttempts,
    totalTimeSpentSeconds,
    overallAccuracyPercentage,
    skillMetrics,
    partMetrics,
    strongestSkill,
    weakestSkill,
    weakAreas,
  };
}
