import assert from "node:assert/strict";
import {
  clearActiveSession,
  clearProgressHistory,
  createPracticeSession,
  getStorageAdapter,
  loadActiveSession,
  loadProgressHistory,
  loadUserPreferences,
  markSessionCompleted,
  MemoryStorageAdapter,
  saveProgressAttempt,
  saveUserPreferences,
  updateSessionAnswer,
  updateSessionNavigation,
  updateSessionTimer,
} from "../lib/storage";
import { STORAGE_KEYS } from "../lib/storage/types";
import { ProgressAttemptRecord } from "../lib/progress/types";

export function runStorageTests() {
  console.log("▶ [TEST 9] Running Client Storage & Practice Session Unit Tests...");

  const memoryAdapter = new MemoryStorageAdapter();

  // ----------------------------------------------------
  // 1. Progress History Save, Load, and Deduplication
  // ----------------------------------------------------
  {
    clearProgressHistory(memoryAdapter);
    assert.deepEqual(loadProgressHistory(memoryAdapter), []);

    const attempt1: ProgressAttemptRecord = {
      id: "att_101",
      testId: "aptis-b2-01",
      mode: "practice",
      skill: "reading",
      partIdentifier: "part1",
      rawScore: 5,
      maxRawScore: 5,
      percentage: 100,
      completedAt: "2026-08-22T10:00:00Z",
      disclaimer: "PRACTICE ESTIMATE — NOT AN OFFICIAL BRITISH COUNCIL SCORE",
    };

    saveProgressAttempt(attempt1, memoryAdapter);
    const history1 = loadProgressHistory(memoryAdapter);
    assert.equal(history1.length, 1);
    assert.equal(history1[0].id, "att_101");
    assert.equal(history1[0].percentage, 100);

    // Save updated record with same ID -> should replace, not duplicate
    const attempt1Updated: ProgressAttemptRecord = {
      ...attempt1,
      percentage: 90,
    };
    saveProgressAttempt(attempt1Updated, memoryAdapter);
    const history2 = loadProgressHistory(memoryAdapter);
    assert.equal(history2.length, 1);
    assert.equal(history2[0].percentage, 90);
  }

  // ----------------------------------------------------
  // 2. Active Session Creation, Autosave & Navigation
  // ----------------------------------------------------
  {
    clearActiveSession(memoryAdapter);
    assert.equal(loadActiveSession(memoryAdapter), null);

    const session = createPracticeSession(
      {
        testId: "aptis-b2-01",
        mode: "practice",
        skill: "grammarVocabulary",
        currentPartNumber: 1,
        remainingTimeSeconds: 1500,
      },
      memoryAdapter
    );

    assert.ok(session.sessionId.startsWith("sess_"));
    assert.equal(session.testId, "aptis-b2-01");
    assert.equal(session.skill, "grammarVocabulary");
    assert.equal(session.remainingTimeSeconds, 1500);
    assert.equal(session.isSubmitted, false);

    // Update answer (Autosave)
    const updatedWithAnswer = updateSessionAnswer(
      "gv_q1",
      "would have gone",
      memoryAdapter
    );
    assert.ok(updatedWithAnswer);
    assert.equal(updatedWithAnswer?.answers["gv_q1"], "would have gone");

    // Update navigation
    const updatedNav = updateSessionNavigation(2, "gv_q26", memoryAdapter);
    assert.equal(updatedNav?.currentPartNumber, 2);
    assert.equal(updatedNav?.currentQuestionId, "gv_q26");

    // Update timer
    const updatedTimer = updateSessionTimer(1450, memoryAdapter);
    assert.equal(updatedTimer?.remainingTimeSeconds, 1450);

    // Resume / Load active session
    const reloadedSession = loadActiveSession(memoryAdapter);
    assert.ok(reloadedSession);
    assert.equal(reloadedSession?.sessionId, session.sessionId);
    assert.equal(reloadedSession?.answers["gv_q1"], "would have gone");
    assert.equal(reloadedSession?.currentPartNumber, 2);
  }

  // ----------------------------------------------------
  // 3. Session Completion & Clearance
  // ----------------------------------------------------
  {
    const completed = markSessionCompleted(memoryAdapter);
    assert.equal(completed?.isSubmitted, true);

    // Submitting answer on completed session should be blocked
    const blockedAnswer = updateSessionAnswer("gv_q2", "option_b", memoryAdapter);
    assert.equal(blockedAnswer, null);

    // Clear active session
    clearActiveSession(memoryAdapter);
    assert.equal(loadActiveSession(memoryAdapter), null);
  }

  // ----------------------------------------------------
  // 4. Corrupted JSON Recovery
  // ----------------------------------------------------
  {
    const corruptedAdapter = new MemoryStorageAdapter();
    corruptedAdapter.memoryMap.set(STORAGE_KEYS.HISTORY, "{ INVALID_CORRUPTED_JSON :::");

    // Adapter safely handles parse error and returns default []
    const safeHistory = loadProgressHistory(corruptedAdapter);
    assert.deepEqual(safeHistory, []);
  }

  // ----------------------------------------------------
  // 5. User Preferences Persistence
  // ----------------------------------------------------
  {
    const defaultPrefs = loadUserPreferences(memoryAdapter);
    assert.equal(defaultPrefs.audioPlaybackSpeed, 1.0);
    assert.equal(defaultPrefs.theme, "system");

    saveUserPreferences(
      { audioPlaybackSpeed: 1.25, theme: "dark" },
      memoryAdapter
    );
    const updatedPrefs = loadUserPreferences(memoryAdapter);
    assert.equal(updatedPrefs.audioPlaybackSpeed, 1.25);
    assert.equal(updatedPrefs.theme, "dark");
    assert.equal(updatedPrefs.soundEffectsEnabled, true); // Retains defaults
  }

  // ----------------------------------------------------
  // 6. SSR Safety Verification
  // ----------------------------------------------------
  {
    const globalAdapter = getStorageAdapter();
    assert.ok(globalAdapter.isAvailable());
    // Safe to call without browser window
    const history = loadProgressHistory();
    assert.ok(Array.isArray(history));
  }

  console.log("  ✓ Progress history save, load, and deduplication verified");
  console.log("  ✓ Active session creation, auto-saving, and navigation verified");
  console.log("  ✓ Session completion and clearance verified");
  console.log("  ✓ Corrupted storage JSON graceful recovery verified");
  console.log("  ✓ User preferences persistence verified");
  console.log("  ✓ Storage SSR safety in non-browser runtime verified");
  console.log("✅ [TEST 9 PASSED] Client Storage & Practice Session unit tests completed.\n");
}

// Allow direct CLI execution
if (process.argv[1] === import.meta.filename) {
  runStorageTests();
}
