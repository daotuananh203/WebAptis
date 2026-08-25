/**
 * Storage Migration Utility
 * Safely migrates anonymous/local storage practice history, active drafts, and preferences
 * to the authenticated user account without data loss.
 */

import { getStorageAdapter } from "./storage";
import {
  IStorageAdapter,
  MockTestSessionState,
  PracticeSessionState,
  STORAGE_KEYS,
  UserPreferences,
} from "./types";
import { ProgressAttemptRecord } from "../progress/types";

export interface MigrationResult {
  migratedHistoryCount: number;
  migratedActivePractice: boolean;
  migratedActiveMockTest: boolean;
  migratedPreferences: boolean;
}

/**
 * Migrate anonymous localStorage data to a specific user's scoped storage.
 */
export function migrateAnonymousStorageToUser(
  userId: string,
  adapter: IStorageAdapter = getStorageAdapter()
): MigrationResult {
  if (!userId) {
    return {
      migratedHistoryCount: 0,
      migratedActivePractice: false,
      migratedActiveMockTest: false,
      migratedPreferences: false,
    };
  }

  let migratedHistoryCount = 0;
  let migratedActivePractice = false;
  let migratedActiveMockTest = false;
  let migratedPreferences = false;

  try {
    // 1. Migrate Progress History
    const anonHistory = adapter.getItem<ProgressAttemptRecord[]>(STORAGE_KEYS.HISTORY, []);
    if (Array.isArray(anonHistory) && anonHistory.length > 0) {
      const userKey = STORAGE_KEYS.userHistory(userId);
      const existingUserHistory = adapter.getItem<ProgressAttemptRecord[]>(userKey, []);

      // Merge and deduplicate by attempt ID
      const mergedMap = new Map<string, ProgressAttemptRecord>();
      for (const item of existingUserHistory) {
        mergedMap.set(item.id, item);
      }
      for (const item of anonHistory) {
        if (!mergedMap.has(item.id)) {
          mergedMap.set(item.id, item);
          migratedHistoryCount++;
        }
      }

      const mergedList = Array.from(mergedMap.values());
      adapter.setItem(userKey, mergedList);
      adapter.removeItem(STORAGE_KEYS.HISTORY); // Clear anonymous legacy key
    }

    // 2. Migrate Active Practice Session
    const anonPractice = adapter.getItem<PracticeSessionState | null>(
      STORAGE_KEYS.ACTIVE_SESSION,
      null
    );
    if (anonPractice && typeof anonPractice === "object" && anonPractice.sessionId && !anonPractice.isSubmitted) {
      const userPracticeKey = STORAGE_KEYS.userActiveSession(userId);
      const existingUserPractice = adapter.getItem<PracticeSessionState | null>(userPracticeKey, null);

      if (!existingUserPractice || existingUserPractice.isSubmitted) {
        adapter.setItem(userPracticeKey, { ...anonPractice, userId });
        migratedActivePractice = true;
      }
      adapter.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
    }

    // 3. Migrate Active Mock Test Session
    const anonMock = adapter.getItem<MockTestSessionState | null>(
      STORAGE_KEYS.ACTIVE_MOCK_TEST,
      null
    );
    if (anonMock && typeof anonMock === "object" && anonMock.sessionId && !anonMock.isSubmitted) {
      const userMockKey = STORAGE_KEYS.userActiveMockTest(userId);
      const existingUserMock = adapter.getItem<MockTestSessionState | null>(userMockKey, null);

      if (!existingUserMock || existingUserMock.isSubmitted) {
        adapter.setItem(userMockKey, { ...anonMock, userId });
        migratedActiveMockTest = true;
      }
      adapter.removeItem(STORAGE_KEYS.ACTIVE_MOCK_TEST);
    }

    // 4. Migrate User Preferences
    const anonPrefs = adapter.getItem<Partial<UserPreferences> | null>(
      STORAGE_KEYS.PREFERENCES,
      null
    );
    if (anonPrefs && typeof anonPrefs === "object") {
      const userPrefsKey = STORAGE_KEYS.userPreferences(userId);
      const existingUserPrefs = adapter.getItem<Partial<UserPreferences> | null>(userPrefsKey, null);

      if (!existingUserPrefs) {
        adapter.setItem(userPrefsKey, anonPrefs);
        migratedPreferences = true;
      }
      adapter.removeItem(STORAGE_KEYS.PREFERENCES);
    }
  } catch (err) {
    console.warn("[Migration Error] Error migrating anonymous data to user:", err);
  }

  return {
    migratedHistoryCount,
    migratedActivePractice,
    migratedActiveMockTest,
    migratedPreferences,
  };
}
