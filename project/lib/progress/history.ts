/**
 * Learning History Utilities
 * Pure helper functions to construct, filter, and sort learning attempt records.
 */

import { DeterministicPartResult, DeterministicSectionResult } from "../grading/types";
import { WritingGradingResult } from "../grading/writing-schema";
import { SpeakingGradingResult } from "../grading/speaking-schema";
import { ExamComponentSkill, LearningMode, ProgressAttemptRecord } from "./types";

/**
 * Create a ProgressAttemptRecord from an objective DeterministicPartResult (Practice Drill).
 */
export function createPracticeAttemptFromDeterministicPart(params: {
  testId: string;
  skill: ExamComponentSkill;
  partIdentifier: string;
  result: DeterministicPartResult;
  durationSeconds?: number;
  completedAt?: string;
}): ProgressAttemptRecord {
  return {
    id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    testId: params.testId,
    mode: "practice",
    skill: params.skill,
    partIdentifier: params.partIdentifier,
    rawScore: params.result.rawScore,
    maxRawScore: params.result.maxRawScore,
    percentage: params.result.percentage,
    durationSeconds: params.durationSeconds,
    completedAt: params.completedAt ?? new Date().toISOString(),
    totalQuestions: params.result.totalItems,
    correctCount: params.result.correctItems,
    incorrectCount: params.result.answeredItems - params.result.correctItems,
    unansweredCount: params.result.totalItems - params.result.answeredItems,
    disclaimer: "PRACTICE ESTIMATE — NOT AN OFFICIAL BRITISH COUNCIL SCORE",
  };
}

/**
 * Create a ProgressAttemptRecord from an objective DeterministicSectionResult (Mock Test Section).
 */
export function createMockAttemptFromDeterministicSection(params: {
  testId: string;
  skill: ExamComponentSkill;
  result: DeterministicSectionResult;
  durationSeconds?: number;
  completedAt?: string;
}): ProgressAttemptRecord {
  let totalQuestions = 0;
  let correctCount = 0;
  let answeredCount = 0;

  for (const part of Object.values(params.result.parts)) {
    totalQuestions += part.totalItems;
    correctCount += part.correctItems;
    answeredCount += part.answeredItems;
  }

  return {
    id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    testId: params.testId,
    mode: "mock-test",
    skill: params.skill,
    rawScore: params.result.rawScore,
    maxRawScore: params.result.maxRawScore,
    percentage: params.result.percentage,
    durationSeconds: params.durationSeconds,
    completedAt: params.completedAt ?? new Date().toISOString(),
    totalQuestions,
    correctCount,
    incorrectCount: answeredCount - correctCount,
    unansweredCount: totalQuestions - answeredCount,
    disclaimer: "PRACTICE ESTIMATE — NOT AN OFFICIAL BRITISH COUNCIL SCORE",
  };
}

/**
 * Create a ProgressAttemptRecord from an AI Writing Grading result.
 */
export function createAttemptFromWritingResult(params: {
  result: WritingGradingResult;
  mode: LearningMode;
  durationSeconds?: number;
  completedAt?: string;
}): ProgressAttemptRecord {
  return {
    id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    testId: params.result.testId,
    mode: params.mode,
    skill: "writing",
    partIdentifier: `part${params.result.partNumber}`,
    rawScore: params.result.overallScore,
    maxRawScore: params.result.maxOverallScore,
    percentage: params.result.percentage,
    durationSeconds: params.durationSeconds,
    completedAt: params.completedAt ?? new Date().toISOString(),
    estimatedBand: params.result.estimatedBand,
    disclaimer: "PRACTICE ESTIMATE — NOT AN OFFICIAL BRITISH COUNCIL SCORE",
  };
}

/**
 * Create a ProgressAttemptRecord from an AI Speaking Grading result.
 */
export function createAttemptFromSpeakingResult(params: {
  result: SpeakingGradingResult;
  mode: LearningMode;
  durationSeconds?: number;
  completedAt?: string;
}): ProgressAttemptRecord {
  return {
    id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    testId: params.result.testId,
    practiceItemId: params.result.practiceItemId,
    mode: params.mode,
    skill: "speaking",
    partIdentifier: `part${params.result.partNumber}`,
    rawScore: params.result.overallScore,
    maxRawScore: params.result.maxOverallScore,
    percentage: params.result.percentage,
    durationSeconds: params.durationSeconds,
    completedAt: params.completedAt ?? new Date().toISOString(),
    estimatedBand: params.result.estimatedBand,
    disclaimer: "PRACTICE ESTIMATE — NOT AN OFFICIAL BRITISH COUNCIL SCORE",
  };
}

/**
 * Sort history records chronologically (newest first).
 */
export function sortHistoryNewestFirst(
  history: ProgressAttemptRecord[]
): ProgressAttemptRecord[] {
  return [...history].sort(
    (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  );
}

/**
 * Filter history records by skill.
 */
export function filterHistoryBySkill(
  history: ProgressAttemptRecord[],
  skill: ExamComponentSkill
): ProgressAttemptRecord[] {
  return history.filter((record) => record.skill === skill);
}
