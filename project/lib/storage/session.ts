/**
 * Practice & Exam Session State Manager
 * Pure functions for creating, restoring, updating, autosaving, and clearing test session drafts.
 * Supports complete user data isolation and polymorphic adapter arguments for tests.
 */

import { ExamComponentSkill, LearningMode, ProgressAttemptRecord } from "../progress/types";
import { getStorageAdapter } from "./storage";
import {
  IStorageAdapter,
  MOCK_SECTION_DURATIONS,
  MOCK_TEST_SECTIONS,
  MockTestSectionState,
  MockTestSessionState,
  PracticeSessionState,
  STORAGE_KEYS,
  UserAnswerValue,
} from "./types";

function resolveUserAndAdapter(
  userIdOrAdapter?: string | IStorageAdapter,
  adapterParam?: IStorageAdapter
): { userId?: string; adapter: IStorageAdapter } {
  if (typeof userIdOrAdapter === "string") {
    return { userId: userIdOrAdapter, adapter: adapterParam ?? getStorageAdapter() };
  }
  if (userIdOrAdapter && typeof userIdOrAdapter === "object" && "getItem" in userIdOrAdapter) {
    return { userId: undefined, adapter: userIdOrAdapter };
  }
  return { userId: undefined, adapter: adapterParam ?? getStorageAdapter() };
}

// ==========================================
// 1. PRACTICE SESSION DRAFTS
// ==========================================

export function createPracticeSession(
  params: {
    testId: string;
    practiceItemId?: string;
    mode: LearningMode;
    skill: ExamComponentSkill;
    currentPartNumber?: number;
    currentQuestionId?: string;
    remainingTimeSeconds?: number;
    userId?: string;
  },
  adapter: IStorageAdapter = getStorageAdapter()
): PracticeSessionState {
  const now = new Date().toISOString();
  const session: PracticeSessionState = {
    sessionId: `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId: params.userId,
    testId: params.testId,
    practiceItemId: params.practiceItemId,
    mode: params.mode,
    skill: params.skill,
    currentPartNumber: params.currentPartNumber ?? 1,
    currentQuestionId: params.currentQuestionId,
    answers: {},
    remainingTimeSeconds: params.remainingTimeSeconds,
    startedAt: now,
    lastSavedAt: now,
    isSubmitted: false,
  };

  const key = params.userId ? STORAGE_KEYS.userActiveSession(params.userId) : STORAGE_KEYS.ACTIVE_SESSION;
  adapter.setItem(key, session);
  return session;
}

export function loadActiveSession(
  userIdOrAdapter?: string | IStorageAdapter,
  adapterParam?: IStorageAdapter
): PracticeSessionState | null {
  const { userId, adapter } = resolveUserAndAdapter(userIdOrAdapter, adapterParam);
  const key = userId ? STORAGE_KEYS.userActiveSession(userId) : STORAGE_KEYS.ACTIVE_SESSION;
  const session = adapter.getItem<PracticeSessionState | null>(key, null);

  if (!session || typeof session !== "object" || !session.sessionId) {
    return null;
  }

  return session;
}

export function updateSessionAnswer(
  questionId: string,
  answerValue: UserAnswerValue,
  userIdOrAdapter?: string | IStorageAdapter,
  adapterParam?: IStorageAdapter
): PracticeSessionState | null {
  const { userId, adapter } = resolveUserAndAdapter(userIdOrAdapter, adapterParam);
  const current = loadActiveSession(userId, adapter);
  if (!current || current.isSubmitted) return null;

  const updated: PracticeSessionState = {
    ...current,
    answers: {
      ...current.answers,
      [questionId]: answerValue,
    },
    lastSavedAt: new Date().toISOString(),
  };

  const key = userId ? STORAGE_KEYS.userActiveSession(userId) : STORAGE_KEYS.ACTIVE_SESSION;
  adapter.setItem(key, updated);
  return updated;
}

export function updateSessionNavigation(
  currentPartNumber: number,
  currentQuestionId?: string,
  userIdOrAdapter?: string | IStorageAdapter,
  adapterParam?: IStorageAdapter
): PracticeSessionState | null {
  const { userId, adapter } = resolveUserAndAdapter(userIdOrAdapter, adapterParam);
  const current = loadActiveSession(userId, adapter);
  if (!current || current.isSubmitted) return null;

  const updated: PracticeSessionState = {
    ...current,
    currentPartNumber,
    currentQuestionId: currentQuestionId ?? current.currentQuestionId,
    lastSavedAt: new Date().toISOString(),
  };

  const key = userId ? STORAGE_KEYS.userActiveSession(userId) : STORAGE_KEYS.ACTIVE_SESSION;
  adapter.setItem(key, updated);
  return updated;
}

export function updateSessionTimer(
  remainingTimeSeconds: number,
  userIdOrAdapter?: string | IStorageAdapter,
  adapterParam?: IStorageAdapter
): PracticeSessionState | null {
  const { userId, adapter } = resolveUserAndAdapter(userIdOrAdapter, adapterParam);
  const current = loadActiveSession(userId, adapter);
  if (!current || current.isSubmitted) return null;

  const updated: PracticeSessionState = {
    ...current,
    remainingTimeSeconds,
    lastSavedAt: new Date().toISOString(),
  };

  const key = userId ? STORAGE_KEYS.userActiveSession(userId) : STORAGE_KEYS.ACTIVE_SESSION;
  adapter.setItem(key, updated);
  return updated;
}

export function completePracticeSession(
  userIdOrAdapter?: string | IStorageAdapter,
  adapterParam?: IStorageAdapter
): PracticeSessionState | null {
  const { userId, adapter } = resolveUserAndAdapter(userIdOrAdapter, adapterParam);
  const current = loadActiveSession(userId, adapter);
  if (!current) return null;

  const updated: PracticeSessionState = {
    ...current,
    isSubmitted: true,
    lastSavedAt: new Date().toISOString(),
  };

  const key = userId ? STORAGE_KEYS.userActiveSession(userId) : STORAGE_KEYS.ACTIVE_SESSION;
  adapter.setItem(key, updated);
  return updated;
}

/**
 * Complete a practice session while retaining the exact rendered result.
 * Keeping this in the user-scoped session prevents refreshes from reopening
 * a submitted draft and generating a second progress attempt.
 */
export function completePracticeSessionWithResult(
  resultRecord: ProgressAttemptRecord,
  aiFeedback: unknown,
  userIdOrAdapter?: string | IStorageAdapter,
  adapterParam?: IStorageAdapter
): PracticeSessionState | null {
  const { userId, adapter } = resolveUserAndAdapter(userIdOrAdapter, adapterParam);
  const current = loadActiveSession(userId, adapter);
  if (!current || current.isSubmitted) return null;

  const updated: PracticeSessionState = {
    ...current,
    isSubmitted: true,
    resultRecord,
    aiFeedback,
    lastSavedAt: new Date().toISOString(),
  };

  const key = userId ? STORAGE_KEYS.userActiveSession(userId) : STORAGE_KEYS.ACTIVE_SESSION;
  adapter.setItem(key, updated);
  return updated;
}

// Alias for backwards compatibility
export const markSessionCompleted = completePracticeSession;

export function clearActiveSession(
  userIdOrAdapter?: string | IStorageAdapter,
  adapterParam?: IStorageAdapter
): boolean {
  const { userId, adapter } = resolveUserAndAdapter(userIdOrAdapter, adapterParam);
  const key = userId ? STORAGE_KEYS.userActiveSession(userId) : STORAGE_KEYS.ACTIVE_SESSION;
  return adapter.removeItem(key);
}

// ==========================================
// 2. MOCK TEST FULL EXAM SESSION DRAFTS
// ==========================================

export function createMockTestSession(
  testId: string,
  userIdOrAdapter?: string | IStorageAdapter,
  adapterParam?: IStorageAdapter
): MockTestSessionState {
  const { userId, adapter } = resolveUserAndAdapter(userIdOrAdapter, adapterParam);
  const now = new Date().toISOString();

  const sections = {} as Record<ExamComponentSkill, MockTestSectionState>;
  for (const skill of MOCK_TEST_SECTIONS) {
    sections[skill] = {
      skill,
      remainingTimeSeconds: MOCK_SECTION_DURATIONS[skill],
      answers: {},
      isCompleted: false,
    };
  }

  const session: MockTestSessionState = {
    sessionId: `mock_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId,
    testId,
    currentSectionIndex: 0,
    sections,
    startedAt: now,
    lastSavedAt: now,
    isSubmitted: false,
  };

  const key = userId ? STORAGE_KEYS.userActiveMockTest(userId) : STORAGE_KEYS.ACTIVE_MOCK_TEST;
  adapter.setItem(key, session);
  return session;
}

export function loadActiveMockTestSession(
  userIdOrAdapter?: string | IStorageAdapter,
  adapterParam?: IStorageAdapter
): MockTestSessionState | null {
  const { userId, adapter } = resolveUserAndAdapter(userIdOrAdapter, adapterParam);
  const key = userId ? STORAGE_KEYS.userActiveMockTest(userId) : STORAGE_KEYS.ACTIVE_MOCK_TEST;
  const session = adapter.getItem<MockTestSessionState | null>(key, null);

  if (!session || typeof session !== "object" || !session.sessionId) {
    return null;
  }

  return session;
}

export function updateMockTestAnswer(
  skill: ExamComponentSkill,
  questionId: string,
  answerValue: UserAnswerValue,
  userIdOrAdapter?: string | IStorageAdapter,
  adapterParam?: IStorageAdapter
): MockTestSessionState | null {
  const { userId, adapter } = resolveUserAndAdapter(userIdOrAdapter, adapterParam);
  const current = loadActiveMockTestSession(userId, adapter);
  if (!current || current.isSubmitted) return null;

  const section = current.sections[skill];
  if (!section || section.isCompleted) return null;

  const updatedSection: MockTestSectionState = {
    ...section,
    answers: {
      ...section.answers,
      [questionId]: answerValue,
    },
  };

  const updatedSession: MockTestSessionState = {
    ...current,
    sections: {
      ...current.sections,
      [skill]: updatedSection,
    },
    lastSavedAt: new Date().toISOString(),
  };

  const key = userId ? STORAGE_KEYS.userActiveMockTest(userId) : STORAGE_KEYS.ACTIVE_MOCK_TEST;
  adapter.setItem(key, updatedSession);
  return updatedSession;
}

export function updateMockTestSectionTimer(
  skill: ExamComponentSkill,
  remainingSeconds: number,
  userIdOrAdapter?: string | IStorageAdapter,
  adapterParam?: IStorageAdapter
): MockTestSessionState | null {
  const { userId, adapter } = resolveUserAndAdapter(userIdOrAdapter, adapterParam);
  const current = loadActiveMockTestSession(userId, adapter);
  if (!current || current.isSubmitted) return null;

  const section = current.sections[skill];
  if (!section || section.isCompleted) return null;

  const updatedSection: MockTestSectionState = {
    ...section,
    remainingTimeSeconds: remainingSeconds,
  };

  const updatedSession: MockTestSessionState = {
    ...current,
    sections: {
      ...current.sections,
      [skill]: updatedSection,
    },
    lastSavedAt: new Date().toISOString(),
  };

  const key = userId ? STORAGE_KEYS.userActiveMockTest(userId) : STORAGE_KEYS.ACTIVE_MOCK_TEST;
  adapter.setItem(key, updatedSession);
  return updatedSession;
}

export function completeMockTestSection(
  skill: ExamComponentSkill,
  scoreResult?: any,
  userIdOrAdapter?: string | IStorageAdapter,
  adapterParam?: IStorageAdapter
): MockTestSessionState | null {
  const { userId, adapter } = resolveUserAndAdapter(userIdOrAdapter, adapterParam);
  const current = loadActiveMockTestSession(userId, adapter);
  if (!current || current.isSubmitted) return null;

  const section = current.sections[skill];
  if (!section) return null;

  const now = new Date().toISOString();
  const updatedSection: MockTestSectionState = {
    ...section,
    isCompleted: true,
    completedAt: now,
    scoreResult,
  };

  const nextIndex = Math.min(
    current.currentSectionIndex + 1,
    MOCK_TEST_SECTIONS.length - 1
  );

  const updatedSession: MockTestSessionState = {
    ...current,
    currentSectionIndex: nextIndex,
    sections: {
      ...current.sections,
      [skill]: updatedSection,
    },
    lastSavedAt: now,
  };

  const key = userId ? STORAGE_KEYS.userActiveMockTest(userId) : STORAGE_KEYS.ACTIVE_MOCK_TEST;
  adapter.setItem(key, updatedSession);
  return updatedSession;
}

export function submitFullMockTest(
  userIdOrAdapter?: string | IStorageAdapter,
  adapterParam?: IStorageAdapter
): MockTestSessionState | null {
  const { userId, adapter } = resolveUserAndAdapter(userIdOrAdapter, adapterParam);
  const current = loadActiveMockTestSession(userId, adapter);
  if (!current) return null;

  const now = new Date().toISOString();
  const updatedSession: MockTestSessionState = {
    ...current,
    isSubmitted: true,
    completedAt: now,
    lastSavedAt: now,
  };

  const key = userId ? STORAGE_KEYS.userActiveMockTest(userId) : STORAGE_KEYS.ACTIVE_MOCK_TEST;
  adapter.setItem(key, updatedSession);
  adapter.setItem(`aptis_b2_completed_mock_${updatedSession.sessionId}`, updatedSession);
  return updatedSession;
}

export function loadCompletedMockTestSession(
  sessionId: string,
  userIdOrAdapter?: string | IStorageAdapter,
  adapterParam?: IStorageAdapter
): MockTestSessionState | null {
  const { userId, adapter } = resolveUserAndAdapter(userIdOrAdapter, adapterParam);
  const active = loadActiveMockTestSession(userId, adapter);
  if (active && (active.sessionId === sessionId || (active.isSubmitted && !sessionId))) {
    return active;
  }

  const archived = adapter.getItem<MockTestSessionState | null>(
    `aptis_b2_completed_mock_${sessionId}`,
    null
  );
  if (archived && typeof archived === "object" && archived.sessionId) {
    return archived;
  }

  return active?.isSubmitted ? active : null;
}

export function clearActiveMockTestSession(
  userIdOrAdapter?: string | IStorageAdapter,
  adapterParam?: IStorageAdapter
): boolean {
  const { userId, adapter } = resolveUserAndAdapter(userIdOrAdapter, adapterParam);
  const key = userId ? STORAGE_KEYS.userActiveMockTest(userId) : STORAGE_KEYS.ACTIVE_MOCK_TEST;
  return adapter.removeItem(key);
}
