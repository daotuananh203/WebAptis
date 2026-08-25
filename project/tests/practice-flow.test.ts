import assert from "node:assert/strict";
import { PRACTICE_SKILLS_CATALOG } from "../components/practice/practice-hub";
import {
  clearProgressHistory,
  createPracticeSession,
  loadProgressHistory,
  MemoryStorageAdapter,
  saveProgressAttempt,
  updateSessionAnswer,
} from "../lib/storage";
import { ProgressAttemptRecord } from "../lib/progress/types";
import {
  calculateOverallStatistics,
  calculateDailyStreak,
} from "../lib/progress";
import { generateRecommendations } from "../lib/recommendations";

export function runPracticeFlowTests() {
  console.log("▶ [TEST 11] Running Practice Mode UI & Drill Flow Unit Tests...");

  // ----------------------------------------------------
  // 1. Practice Skills & Parts Catalog Verification
  // ----------------------------------------------------
  {
    assert.equal(PRACTICE_SKILLS_CATALOG.length, 5);
    const skills = PRACTICE_SKILLS_CATALOG.map((c) => c.skill);
    assert.ok(skills.includes("grammarVocabulary"));
    assert.ok(skills.includes("reading"));
    assert.ok(skills.includes("listening"));
    assert.ok(skills.includes("writing"));
    assert.ok(skills.includes("speaking"));

    // Verify Speaking parts match official structure (Parts 1-4)
    const speakingCat = PRACTICE_SKILLS_CATALOG.find((c) => c.skill === "speaking");
    assert.equal(speakingCat?.parts.length, 4);
    assert.equal(speakingCat?.parts[0].partIdentifier, "part1");
    assert.equal(speakingCat?.parts[1].partIdentifier, "part2");
    assert.equal(speakingCat?.parts[2].partIdentifier, "part3");
    assert.equal(speakingCat?.parts[3].partIdentifier, "part4");
  }

  // ----------------------------------------------------
  // 2. Practice Session State & Autosave Flow
  // ----------------------------------------------------
  {
    const memoryAdapter = new MemoryStorageAdapter();

    const session = createPracticeSession(
      {
        testId: "aptis-b2-01",
        mode: "practice",
        skill: "grammarVocabulary",
        currentPartNumber: 1,
        remainingTimeSeconds: 600,
      },
      memoryAdapter
    );

    assert.ok(session.sessionId);
    assert.equal(session.skill, "grammarVocabulary");

    // Save answer
    const updated = updateSessionAnswer("g_q01", "would not have left", memoryAdapter);
    assert.equal(updated?.answers["g_q01"], "would not have left");
  }

  // ----------------------------------------------------
  // 3. Post-Submission Flow: Storage, Progress & Recommendations
  // ----------------------------------------------------
  {
    const memoryAdapter = new MemoryStorageAdapter();
    clearProgressHistory(memoryAdapter);

    const completedPracticeRecord: ProgressAttemptRecord = {
      id: "att_practice_001",
      testId: "aptis-b2-01",
      mode: "practice",
      skill: "reading",
      partIdentifier: "part2",
      rawScore: 6,
      maxRawScore: 6,
      percentage: 100,
      durationSeconds: 150,
      completedAt: new Date().toISOString(),
      disclaimer: "PRACTICE ESTIMATE — NOT AN OFFICIAL BRITISH COUNCIL SCORE",
    };

    saveProgressAttempt(completedPracticeRecord, memoryAdapter);
    const history = loadProgressHistory(memoryAdapter);
    assert.equal(history.length, 1);
    assert.equal(history[0].percentage, 100);

    // Compute progress & streak
    const streak = calculateDailyStreak(history);
    const stats = calculateOverallStatistics(history);
    const recs = generateRecommendations(history);

    assert.equal(streak.currentStreak, 1);
    assert.equal(streak.isActiveToday, true);
    assert.equal(stats.totalAttempts, 1);
    assert.equal(stats.skillMetrics.reading.totalAttempts, 1);
    assert.equal(stats.skillMetrics.reading.averagePercentage, 100);
    assert.ok(recs.primaryRecommendation !== null);
  }

  console.log("  ✓ Skills and parts catalog structure verified");
  console.log("  ✓ Drill session state and autosave flow verified");
  console.log("  ✓ Post-submission history, statistics, and recommendation pipeline verified");
  console.log("✅ [TEST 11 PASSED] Practice Mode UI & Drill Flow tests completed.\n");
}

// Allow direct CLI execution
if (process.argv[1] === import.meta.filename) {
  runPracticeFlowTests();
}
