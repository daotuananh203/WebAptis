/**
 * Progress Tracking Engine Domain Types
 * Strongly typed models for practice sessions, mock test attempts, statistics, streaks, and heatmap data.
 */

export type ExamComponentSkill =
  | "grammarVocabulary"
  | "reading"
  | "listening"
  | "writing"
  | "speaking";

export type LearningMode = "practice" | "mock-test";

export interface ProgressAttemptRecord {
  id: string; // Unique attempt ID
  testId: string;
  /** Canonical Speaking Practice item id, when the attempt is bank-based. */
  practiceItemId?: string;
  mode: LearningMode;
  skill: ExamComponentSkill;
  partIdentifier?: string; // e.g. "part1", "part2", "grammar", "vocabulary"
  rawScore: number;
  maxRawScore: number;
  percentage: number;
  durationSeconds?: number;
  completedAt: string; // ISO 8601 string: e.g. "2026-08-22T10:30:00.000Z"
  estimatedBand?: "A0" | "A1" | "A2" | "B1" | "B2" | "C" | "C1" | "C2";
  totalQuestions?: number;
  correctCount?: number;
  incorrectCount?: number;
  unansweredCount?: number;
  disclaimer: "PRACTICE ESTIMATE — NOT AN OFFICIAL BRITISH COUNCIL SCORE";
}

export interface SkillPerformanceMetric {
  skill: ExamComponentSkill;
  totalAttempts: number;
  averagePercentage: number;
  highestPercentage: number;
  latestPercentage: number;
  improvementTrend: "improving" | "stable" | "declining"; // Comparison of last 3 vs previous attempts
  totalTimeSpentSeconds: number;
}

export interface PartPerformanceMetric {
  skill: ExamComponentSkill;
  partIdentifier: string;
  totalAttempts: number;
  averagePercentage: number;
  latestPercentage: number;
}

export interface WeakAreaIndicator {
  skill: ExamComponentSkill;
  partIdentifier?: string;
  averagePercentage: number;
  attemptCount: number;
  urgency: "critical" | "moderate" | "minor";
  reason: string;
}

export interface OverallLearningStatistics {
  totalAttempts: number;
  totalTimeSpentSeconds: number;
  overallAccuracyPercentage: number;
  skillMetrics: Record<ExamComponentSkill, SkillPerformanceMetric>;
  partMetrics: PartPerformanceMetric[];
  strongestSkill?: ExamComponentSkill;
  weakestSkill?: ExamComponentSkill;
  weakAreas: WeakAreaIndicator[];
}

export interface DailyStreakSummary {
  currentStreak: number;
  longestStreak: number;
  isActiveToday: boolean;
  lastActiveDate: string | null; // "YYYY-MM-DD"
  totalActiveDays: number;
}

export type HeatmapIntensity = 0 | 1 | 2 | 3 | 4;

export interface HeatmapDayData {
  date: string; // "YYYY-MM-DD"
  activityCount: number;
  totalMinutes: number;
  completedActivities: {
    skill: ExamComponentSkill;
    mode: LearningMode;
    partIdentifier?: string;
  }[];
  intensity: HeatmapIntensity;
}

export interface TwelveWeekHeatmapSummary {
  startDate: string; // "YYYY-MM-DD"
  endDate: string; // "YYYY-MM-DD"
  totalWeeks: 12;
  days: HeatmapDayData[];
  totalActivities: number;
  totalStudyMinutes: number;
}
