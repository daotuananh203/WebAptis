"use client";

/**
 * Custom React hook for managing practice and exam session state.
 * Fully SSR-safe with client-side hydration awareness, auto-save capabilities, and user isolation.
 */

import { useCallback, useEffect, useState } from "react";
import { ProgressAttemptRecord } from "../progress/types";
import {
  clearActiveSession,
  completePracticeSession,
  completePracticeSessionWithResult,
  createPracticeSession,
  loadActiveSession,
  updateSessionAnswer,
  updateSessionNavigation,
  updateSessionTimer,
} from "../storage/session";
import { saveProgressAttempt } from "../storage/storage";
import { PracticeSessionState, UserAnswerValue } from "../storage/types";

export function usePracticeSession(userId?: string) {
  const [isHydrated, setIsHydrated] = useState(false);
  // Identifies which user scope the current session was loaded for.  This
  // prevents a user-scoped submitted result being overwritten by an
  // anonymous draft during the auth hydration race after a refresh.
  const [hydratedUserId, setHydratedUserId] = useState<string | undefined>(undefined);
  const [session, setSession] = useState<PracticeSessionState | null>(null);

  // Hydrate session from localStorage on client mount
  useEffect(() => {
    const loaded = loadActiveSession(userId);
    setSession(loaded);
    setHydratedUserId(userId);
    setIsHydrated(true);
  }, [userId]);

  const initSession = useCallback(
    (params: {
      testId: string;
      practiceItemId?: string;
      mode: "practice" | "mock-test";
      skill: "grammarVocabulary" | "reading" | "listening" | "writing" | "speaking";
      currentPartNumber?: number;
      currentQuestionId?: string;
      remainingTimeSeconds?: number;
      userId?: string;
    }) => {
      const targetUserId = params.userId ?? userId;
      const newSession = createPracticeSession({ ...params, userId: targetUserId });
      setSession(newSession);
      return newSession;
    },
    [userId]
  );

  const setAnswer = useCallback(
    (questionId: string, answerValue: UserAnswerValue) => {
      const updated = updateSessionAnswer(questionId, answerValue, userId);
      if (updated) {
        setSession(updated);
      }
    },
    [userId]
  );

  const setNavigation = useCallback(
    (currentPartNumber: number, currentQuestionId?: string) => {
      const updated = updateSessionNavigation(currentPartNumber, currentQuestionId, userId);
      if (updated) {
        setSession(updated);
      }
    },
    [userId]
  );

  const setTimeRemaining = useCallback(
    (remainingSeconds: number) => {
      const updated = updateSessionTimer(remainingSeconds, userId);
      if (updated) {
        setSession(updated);
      }
    },
    [userId]
  );

  const submitSession = useCallback(
    (record?: ProgressAttemptRecord, aiFeedback?: unknown) => {
      if (record) {
        saveProgressAttempt(record, userId);
      }
      const completed = record
        ? completePracticeSessionWithResult(record, aiFeedback, userId)
        : completePracticeSession(userId);
      setSession(completed);
    },
    [userId]
  );

  const discardSession = useCallback(() => {
    clearActiveSession(userId);
    setSession(null);
  }, [userId]);

  return {
    isHydrated,
    hydratedUserId,
    session,
    initSession,
    setAnswer,
    setNavigation,
    setTimeRemaining,
    submitSession,
    discardSession,
  };
}
