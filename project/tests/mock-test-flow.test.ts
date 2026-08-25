import assert from "node:assert/strict";
import {
  clearActiveMockTestSession,
  clearProgressHistory,
  completeMockTestSection,
  createMockTestSession,
  loadActiveMockTestSession,
  loadProgressHistory,
  MemoryStorageAdapter,
  saveProgressAttempt,
  submitFullMockTest,
  updateMockTestAnswer,
  updateMockTestSectionTimer,
} from "../lib/storage";
import { MOCK_SECTION_DURATIONS, MOCK_TEST_SECTIONS } from "../lib/storage/types";
import {
  calculateDailyStreak,
  calculateOverallStatistics,
} from "../lib/progress";

import fs from "node:fs";
import path from "node:path";
import { resolveSectionParts } from "../components/mock-test/exam-shell";

export function runMockTestFlowTests() {
  console.log("▶ [TEST 12] Running Full Mock Test Mode & Exam Room Unit Tests...");

  const memoryAdapter = new MemoryStorageAdapter();

  // ----------------------------------------------------
  // 1. Mock Test Session Initialization & Isolated Timers
  // ----------------------------------------------------
  {
    clearActiveMockTestSession(memoryAdapter);
    assert.equal(loadActiveMockTestSession(memoryAdapter), null);

    const session = createMockTestSession("aptis-b2-01", memoryAdapter);
    assert.ok(session.sessionId.startsWith("mock_"));
    assert.equal(session.testId, "aptis-b2-01");
    assert.equal(session.currentSectionIndex, 0);
    assert.equal(session.isSubmitted, false);

    // Verify 5 sections with independent timers
    assert.equal(session.sections.grammarVocabulary.remainingTimeSeconds, 25 * 60);
    assert.equal(session.sections.reading.remainingTimeSeconds, 35 * 60);
    assert.equal(session.sections.listening.remainingTimeSeconds, 40 * 60);
    assert.equal(session.sections.writing.remainingTimeSeconds, 50 * 60);
    assert.equal(session.sections.speaking.remainingTimeSeconds, 12 * 60);
  }

  // ----------------------------------------------------
  // 2. Answer Saving & Section Timer Updates
  // ----------------------------------------------------
  {
    const updated = updateMockTestAnswer(
      "grammarVocabulary",
      "g_q01",
      "would not have left",
      memoryAdapter
    );
    assert.ok(updated);
    assert.equal(
      updated?.sections.grammarVocabulary.answers["g_q01"],
      "would not have left"
    );

    const updatedTimer = updateMockTestSectionTimer(
      "grammarVocabulary",
      1400,
      memoryAdapter
    );
    assert.equal(
      updatedTimer?.sections.grammarVocabulary.remainingTimeSeconds,
      1400
    );
    // Reading timer remains unchanged
    assert.equal(
      updatedTimer?.sections.reading.remainingTimeSeconds,
      35 * 60
    );
  }

  // ----------------------------------------------------
  // 3. Section Completion & Sequential Locking
  // ----------------------------------------------------
  {
    const completedGv = completeMockTestSection(
      "grammarVocabulary",
      { rawScore: 45, maxRawScore: 50, percentage: 90 },
      memoryAdapter
    );
    assert.ok(completedGv);
    assert.equal(completedGv?.sections.grammarVocabulary.isCompleted, true);
    assert.equal(completedGv?.currentSectionIndex, 1); // Advanced to Reading

    // Mutating completed section is blocked
    const blockedAnswer = updateMockTestAnswer(
      "grammarVocabulary",
      "g_q02",
      "visiting",
      memoryAdapter
    );
    assert.equal(blockedAnswer, null);
  }

  // ----------------------------------------------------
  // 4. Session Resume after Reload
  // ----------------------------------------------------
  {
    const reloaded = loadActiveMockTestSession(memoryAdapter);
    assert.ok(reloaded);
    assert.equal(reloaded?.currentSectionIndex, 1);
    assert.equal(reloaded?.sections.grammarVocabulary.isCompleted, true);
    assert.equal(reloaded?.sections.reading.isCompleted, false);
    assert.equal(
      reloaded?.sections.grammarVocabulary.answers["g_q01"],
      "would not have left"
    );
  }

  // ----------------------------------------------------
  // 5. Final Exam Submission & Consolidated Progress
  // ----------------------------------------------------
  {
    clearProgressHistory(memoryAdapter);

    // Complete remaining sections
    completeMockTestSection("reading", { rawScore: 40, maxRawScore: 50, percentage: 80 }, memoryAdapter);
    completeMockTestSection("listening", { rawScore: 38, maxRawScore: 50, percentage: 76 }, memoryAdapter);
    completeMockTestSection("writing", { rawScore: 42, maxRawScore: 50, percentage: 84, estimatedBand: "B2" }, memoryAdapter);
    completeMockTestSection("speaking", { rawScore: 39, maxRawScore: 50, percentage: 78, estimatedBand: "B2" }, memoryAdapter);

    const finalized = submitFullMockTest(memoryAdapter);
    assert.ok(finalized);
    assert.equal(finalized?.isSubmitted, true);
    assert.ok(finalized?.completedAt);

    // Save progress attempt records
    for (const skill of MOCK_TEST_SECTIONS) {
      const sec = finalized!.sections[skill];
      saveProgressAttempt(
        {
          id: `mock_test_${skill}`,
          testId: "aptis-b2-01",
          mode: "mock-test",
          skill,
          rawScore: sec.scoreResult.rawScore,
          maxRawScore: sec.scoreResult.maxRawScore,
          percentage: sec.scoreResult.percentage,
          estimatedBand: sec.scoreResult.estimatedBand,
          completedAt: finalized!.completedAt!,
          disclaimer: "PRACTICE ESTIMATE — NOT AN OFFICIAL BRITISH COUNCIL SCORE",
        },
        memoryAdapter
      );
    }

    const history = loadProgressHistory(memoryAdapter);
    assert.equal(history.length, 5);

    const stats = calculateOverallStatistics(history);
    const streak = calculateDailyStreak(history);

    assert.equal(stats.totalAttempts, 5);
    assert.equal(streak.isActiveToday, true);
    assert.equal(stats.strongestSkill, "grammarVocabulary");
  }

  // ----------------------------------------------------
  // 6. Dynamic Part Resolver & 5-Skill Integrity (BUG A & BUG B Regression)
  // ----------------------------------------------------
  {
    for (const tid of ["aptis-b2-01", "aptis-b2-08", "aptis-b2-12"]) {
      const filePath = path.join(process.cwd(), `data/tests/${tid}-public.json`);
      const dataset = JSON.parse(fs.readFileSync(filePath, "utf-8"));

      // 6.1 Grammar & Vocabulary -> 2 resolved parts
      const gvParts = resolveSectionParts(dataset, "grammarVocabulary");
      assert.equal(gvParts.length, 2, `${tid} GV should have exactly 2 parts`);
      assert.equal(gvParts[0].partIdentifier, "grammar");
      assert.equal(gvParts[1].partIdentifier, "vocabulary");

      // 6.2 Reading -> 4 resolved parts
      const readingParts = resolveSectionParts(dataset, "reading");
      assert.equal(readingParts.length, 4, `${tid} Reading should have exactly 4 parts`);
      assert.equal(readingParts[0].partIdentifier, "part1");
      assert.equal(readingParts[1].partIdentifier, "part2");
      assert.equal(readingParts[2].partIdentifier, "part3");
      assert.equal(readingParts[3].partIdentifier, "part4");

      // 6.3 Listening -> 4 resolved parts
      const listeningParts = resolveSectionParts(dataset, "listening");
      assert.equal(listeningParts.length, 4, `${tid} Listening should have exactly 4 parts`);

      // 6.4 Writing -> 4 resolved parts with prompt normalization
      const writingParts = resolveSectionParts(dataset, "writing");
      assert.equal(writingParts.length, 4, `${tid} Writing should have exactly 4 parts`);
      const wPart1 = writingParts[0].data;
      assert.ok(Array.isArray(wPart1.prompts), `${tid} Writing Part 1 should have prompts array`);
      assert.equal(wPart1.prompts.length, 5, `${tid} Writing Part 1 should have 5 prompts`);

      // 6.5 Speaking -> 4 resolved parts with authentic questions
      const speakingParts = resolveSectionParts(dataset, "speaking");
      assert.equal(speakingParts.length, 4, `${tid} Speaking should have exactly 4 parts`);
      assert.ok(Array.isArray(speakingParts[0].data.questions), `${tid} Speaking Part 1 should have questions array`);
      assert.equal(speakingParts[0].data.questions.length, 3, `${tid} Speaking Part 1 should have 3 questions`);
    }
  }

  console.log("  ✓ Mock test session creation & isolated section timers verified");
  console.log("  ✓ Autosave, answer mutations, and timer persistence verified");
  console.log("  ✓ Sequential section locking and transition verified");
  console.log("  ✓ Session reload and resume integrity verified");
  console.log("  ✓ Final exam completion & consolidated progress persistence verified");
  console.log("  ✓ Dynamic Part Resolver (resolveSectionParts) verified across 5 skills (Reading 4 parts, Listening 4 parts, Writing 4 parts, Speaking 4 parts, G&V 2 parts)");
  console.log("✅ [TEST 12 PASSED] Full Mock Test Mode & Exam Room tests completed.\n");
}

// Allow direct CLI execution
if (process.argv[1] === import.meta.filename) {
  runMockTestFlowTests();
}
