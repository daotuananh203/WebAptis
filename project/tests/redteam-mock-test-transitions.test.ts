import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  createMockTestSession,
  updateMockTestAnswer,
  completeMockTestSection,
  submitFullMockTest,
  loadActiveMockTestSession,
} from "../lib/storage/session";
import { MemoryStorageAdapter } from "../lib/storage/storage";

export async function runRedTeamMockTestTransitionsTests(): Promise<boolean> {
  console.log("==================================================");
  console.log("▶ [RED-TEAM DOMAIN F] Running Full Mock & Transition Fuzzing Tests...");
  console.log("==================================================");

  const DATA_DIR = path.join(process.cwd(), "data/tests");

  // 1. All 16 Tests Session Creation & Part Resolution
  console.log("  [F.1] Verifying session initialization across all 16 mock tests...");
  const { resolveSectionParts } = await import("../components/mock-test/exam-shell");

  for (let i = 1; i <= 16; i++) {
    const pad = String(i).padStart(2, "0");
    const testId = `aptis-b2-${pad}`;
    const dataset = JSON.parse(fs.readFileSync(path.join(DATA_DIR, `${testId}-public.json`), "utf-8"));

    const gvParts = resolveSectionParts(dataset, "grammarVocabulary");
    const rParts = resolveSectionParts(dataset, "reading");
    const lParts = resolveSectionParts(dataset, "listening");
    const wParts = resolveSectionParts(dataset, "writing");
    const sParts = resolveSectionParts(dataset, "speaking");

    assert.equal(gvParts.length, 2, `${testId} GV parts must be 2`);
    assert.equal(rParts.length, 4, `${testId} Reading parts must be 4`);
    assert.equal(lParts.length, 4, `${testId} Listening parts must be 4`);
    assert.equal(wParts.length, 4, `${testId} Writing parts must be 4`);
    assert.equal(sParts.length, 4, `${testId} Speaking parts must be 4`);
  }
  console.log("  ✓ 16/16 Mock test datasets verified with 18 parts each (2+4+4+4+4).");

  // 2. Full Mock Test State Machine Assault (0 answers -> Partial -> Complete)
  console.log("  [F.2] Testing Full Mock State Machine with zero and partial answers...");
  const memAdapter = new MemoryStorageAdapter();
  const testUserId = "usr_mock_redteam_" + Date.now();
  const session = createMockTestSession("aptis-b2-15", testUserId, memAdapter);
  assert.equal(session.currentSectionIndex, 0);
  assert.equal(session.isSubmitted, false);

  // Transition 1: GV with 0 answers
  const gvCompleted = completeMockTestSection(
    "grammarVocabulary",
    { rawScore: 0, maxRawScore: 50, percentage: 0, scaledScore: 0 },
    testUserId,
    memAdapter
  );
  assert.equal(gvCompleted?.currentSectionIndex, 1, "Must advance to section 1 (reading)");

  // Transition 2: Reading with partial answer
  updateMockTestAnswer("reading", "aptis-b2-15-r-p1-q1", "A", testUserId, memAdapter);
  const rCompleted = completeMockTestSection(
    "reading",
    { rawScore: 1, maxRawScore: 29, percentage: 3, scaledScore: 2 },
    testUserId,
    memAdapter
  );
  assert.equal(rCompleted?.currentSectionIndex, 2, "Must advance to section 2 (listening)");

  // Transition 3: Listening
  const lCompleted = completeMockTestSection(
    "listening",
    { rawScore: 13, maxRawScore: 24, percentage: 54, scaledScore: 27 },
    testUserId,
    memAdapter
  );
  assert.equal(lCompleted?.currentSectionIndex, 3, "Must advance to section 3 (writing)");

  // Transition 4: Writing
  const wCompleted = completeMockTestSection(
    "writing",
    { rawScore: 0, maxRawScore: 50, percentage: 0, scaledScore: 0, status: "completed" },
    testUserId,
    memAdapter
  );
  assert.equal(wCompleted?.currentSectionIndex, 4, "Must advance to section 4 (speaking)");

  // Transition 5: Speaking & Final Submission
  completeMockTestSection(
    "speaking",
    { rawScore: 0, maxRawScore: 50, percentage: 0, scaledScore: 0, status: "completed" },
    testUserId,
    memAdapter
  );
  const finalized = submitFullMockTest(testUserId, memAdapter);
  assert.equal(finalized?.isSubmitted, true, "Session must be marked isSubmitted = true");

  console.log("  ✓ Full Mock Exam state machine lifecycle validated.");
  console.log("✅ [RED-TEAM DOMAIN F PASSED] Full Mock & Transition Fuzzing Tests PASSED!\n");
  return true;
}
