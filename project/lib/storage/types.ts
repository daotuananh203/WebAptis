/**
 * Client Storage & Session State Domain Types
 * Strongly typed schemas for client-side storage, active session drafts, and storage adapters.
 */

import { ExamComponentSkill, LearningMode, ProgressAttemptRecord } from "../progress/types";

export const STORAGE_SCHEMA_VERSION = 1;

export const STORAGE_KEYS = {
  HISTORY: `aptis_b2_progress_history_v${STORAGE_SCHEMA_VERSION}`,
  ACTIVE_SESSION: `aptis_b2_active_session_v${STORAGE_SCHEMA_VERSION}`,
  ACTIVE_MOCK_TEST: `aptis_b2_active_mock_test_v${STORAGE_SCHEMA_VERSION}`,
  PREFERENCES: `aptis_b2_user_preferences_v${STORAGE_SCHEMA_VERSION}`,
  userHistory: (userId: string) => `aptis_b2_progress_history_v${STORAGE_SCHEMA_VERSION}_usr_${userId}`,
  userActiveSession: (userId: string) => `aptis_b2_active_session_v${STORAGE_SCHEMA_VERSION}_usr_${userId}`,
  userActiveMockTest: (userId: string) => `aptis_b2_active_mock_test_v${STORAGE_SCHEMA_VERSION}_usr_${userId}`,
  userPreferences: (userId: string) => `aptis_b2_user_preferences_v${STORAGE_SCHEMA_VERSION}_usr_${userId}`,
} as const;

export type UserAnswerValue = string | string[] | number | Record<string, string>;

export interface PracticeSessionState {
  sessionId: string;
  userId?: string;
  testId: string;
  mode: LearningMode;
  skill: ExamComponentSkill;
  currentPartNumber: number;
  currentQuestionId?: string;
  answers: Record<string, UserAnswerValue>; // questionId -> answerValue
  remainingTimeSeconds?: number;
  startedAt: string; // ISO 8601
  lastSavedAt: string; // ISO 8601
  isSubmitted: boolean;
}

export const MOCK_TEST_SECTIONS: ExamComponentSkill[] = [
  "grammarVocabulary",
  "reading",
  "listening",
  "writing",
  "speaking",
];

export const MOCK_SECTION_DURATIONS: Record<ExamComponentSkill, number> = {
  grammarVocabulary: 25 * 60, // 25 mins
  reading: 35 * 60,          // 35 mins
  listening: 40 * 60,        // 40 mins
  writing: 50 * 60,          // 50 mins
  speaking: 12 * 60,         // 12 mins
};

export interface MockTestSectionState {
  skill: ExamComponentSkill;
  remainingTimeSeconds: number;
  answers: Record<string, UserAnswerValue>;
  isCompleted: boolean;
  completedAt?: string;
  scoreResult?: any;
}

export interface MockTestSessionState {
  sessionId: string;
  userId?: string;
  testId: string;
  currentSectionIndex: number; // 0 to 4
  sections: Record<ExamComponentSkill, MockTestSectionState>;
  startedAt: string; // ISO 8601
  lastSavedAt: string; // ISO 8601
  isSubmitted: boolean;
  completedAt?: string;
}

export interface UserPreferences {
  audioPlaybackSpeed: number; // e.g. 1.0, 1.25
  autoNextOnSelect: boolean;
  soundEffectsEnabled: boolean;
  theme: "light" | "dark" | "system";
}

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  audioPlaybackSpeed: 1.0,
  autoNextOnSelect: false,
  soundEffectsEnabled: true,
  theme: "system",
};

/**
 * Storage Adapter Interface
 * Enables seamless switching from localStorage to IndexedDB or cloud databases.
 */
export interface IStorageAdapter {
  getItem<T>(key: string, defaultValue: T): T;
  setItem<T>(key: string, value: T): boolean;
  removeItem(key: string): boolean;
  clear(): boolean;
  isAvailable(): boolean;
}
