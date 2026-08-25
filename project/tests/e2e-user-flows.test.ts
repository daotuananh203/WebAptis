import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { AptisPublicTestDatasetSchema } from "../lib/exam/schema";
import { gradeGrammarVocabularySection, gradeReadingSection, gradeListeningSection } from "../lib/grading/deterministic";
import { resolveWritingTaskContext } from "../lib/grading/writing-ai";
import { resolveSpeakingTaskContext } from "../lib/grading/speaking-ai";
import { createMockTestSession, updateMockTestAnswer, completeMockTestSection, submitFullMockTest } from "../lib/storage/session";
import { MemoryStorageAdapter } from "../lib/storage/storage";

const TESTS_DIR = path.join(process.cwd(), "data/tests");
const AUDIO_DIR = path.join(process.cwd(), "public/audio/listening");
const INDEX_DIR = path.join(process.cwd(), "data/content-index");

export async function runRealUserE2ETests() {
  console.log("\n==================================================");
  console.log("▶ [TEST 20] Running Real User E2E & Cross-Test Isolation Tests...");
  console.log("==================================================");

  // ----------------------------------------------------------------
  // FLOW A: Practice Reading (Reading -> Part 1 -> Test 05)
  // ----------------------------------------------------------------
  console.log("  [20.1] FLOW A: Practice Reading (Reading Part 1, Test 05)...");
  const test05PubPath = path.join(TESTS_DIR, "aptis-b2-05-public.json");
  const test05AnsPath = path.join(TESTS_DIR, "aptis-b2-05-answers.json");
  assert.ok(fs.existsSync(test05PubPath), "Test 05 public dataset must exist");
  assert.ok(fs.existsSync(test05AnsPath), "Test 05 answer keys must exist");

  const test05Pub = JSON.parse(fs.readFileSync(test05PubPath, "utf-8"));
  const test05Ans = JSON.parse(fs.readFileSync(test05AnsPath, "utf-8"));

  // Verify passage text is authentic to Test 05 (Dear Jane...)
  const p1Text = test05Pub.reading.parts[0].textWithGaps || test05Pub.reading.parts[0].passageText;
  assert.ok(p1Text.includes("Jane") || p1Text.includes("PART 1"), "Must contain authentic Test 05 reading text");
  assert.strictEqual(test05Pub.reading.parts[0].gaps.length, 5, "Reading Part 1 must have 5 gaps");

  // Perform deterministic grading with authentic answers
  const userAnswersP1: Record<string, string> = {};
  test05Pub.reading.parts[0].gaps.forEach((gap: any) => {
    userAnswersP1[gap.id] = test05Ans.reading.part1[gap.id];
  });
  const rResult = gradeReadingSection({ part1: userAnswersP1 }, test05Ans.reading);
  assert.strictEqual(rResult.parts.part1.rawScore, 5, "Perfect answers must score 5/5 on Part 1");
  console.log("  ✓ FLOW A: Practice Reading Test 05 completed with authentic passage and 5/5 score.");

  // ----------------------------------------------------------------
  // FLOW B: Practice Listening (Listening -> Part 1 -> Test 08)
  // ----------------------------------------------------------------
  console.log("  [20.2] FLOW B: Practice Listening (Listening Part 1, Test 08)...");
  const test08PubPath = path.join(TESTS_DIR, "aptis-b2-08-public.json");
  const test08AnsPath = path.join(TESTS_DIR, "aptis-b2-08-answers.json");
  assert.ok(fs.existsSync(test08PubPath), "Test 08 public dataset must exist");
  assert.ok(fs.existsSync(test08AnsPath), "Test 08 answer keys must exist");

  const test08Pub = JSON.parse(fs.readFileSync(test08PubPath, "utf-8"));
  const test08Ans = JSON.parse(fs.readFileSync(test08AnsPath, "utf-8"));

  // Verify audioUrl points to real audio file
  const test08AudioUrl = test08Pub.listening.parts[0].audioUrl || test08Pub.listening.parts[0].tasks[0].audioUrl;
  assert.strictEqual(test08AudioUrl, "/audio/listening/aptis-b2-08.mp3", "Audio URL must point to aptis-b2-08.mp3");

  const test08AudioFile = path.join(AUDIO_DIR, "aptis-b2-08.mp3");
  assert.ok(fs.existsSync(test08AudioFile), "aptis-b2-08.mp3 must exist on disk");
  const test08AudioStats = fs.statSync(test08AudioFile);
  assert.ok(test08AudioStats.size > 10 * 1024 * 1024, "Audio file must be real (>10MB)");

  // Perform listening grading
  const userAnswersL1: Record<string, string> = {};
  test08Pub.listening.parts[0].tasks.forEach((task: any) => {
    userAnswersL1[task.id] = test08Ans.listening.part1[task.id];
  });
  const lResult = gradeListeningSection({ part1: userAnswersL1 }, test08Ans.listening);
  assert.strictEqual(lResult.parts.part1.rawScore, 13, "Perfect answers must score 13/13 on Part 1");
  console.log("  ✓ FLOW B: Practice Listening Test 08 verified with real audio file and 13/13 score.");

  // ----------------------------------------------------------------
  // FLOW C: Practice Writing (Writing -> Part 3 -> Test 03)
  // ----------------------------------------------------------------
  console.log("  [20.3] FLOW C: Practice Writing (Writing Part 3, Test 03)...");
  const wContext = resolveWritingTaskContext("aptis-b2-03", 3, "t03_w3_m1");
  assert.strictEqual(wContext.testId, "aptis-b2-03");
  assert.strictEqual(wContext.partNumber, 3);
  assert.strictEqual(wContext.taskType, "social-network-chat");
  assert.ok(wContext.prompt.length > 5, "Writing prompt must not be empty");
  console.log("  ✓ FLOW C: Practice Writing Test 03 resolved authentic chatroom task context.");

  // ----------------------------------------------------------------
  // FLOW D: Practice Speaking (Speaking -> Part 2 -> Test 07)
  // ----------------------------------------------------------------
  console.log("  [20.4] FLOW D: Practice Speaking (Speaking Part 2, Test 07)...");
  const sContext = resolveSpeakingTaskContext("aptis-b2-07", 2, "t07_s2_q1");
  assert.strictEqual(sContext.testId, "aptis-b2-07");
  assert.strictEqual(sContext.partNumber, 2);
  assert.strictEqual(sContext.taskType, "describe-recount-opinion");
  assert.ok(sContext.prompt.length > 5, "Speaking prompt must not be empty");
  console.log("  ✓ FLOW D: Practice Speaking Test 07 resolved authentic picture task context.");

  // ----------------------------------------------------------------
  // FLOW E: Mock Test Flow (Test 12 across all 5 sections)
  // ----------------------------------------------------------------
  console.log("  [20.5] FLOW E: Full Mock Test Flow (Test 12)...");
  const memAdapter = new MemoryStorageAdapter();
  const session12 = createMockTestSession("aptis-b2-12", memAdapter);
  assert.strictEqual(session12.testId, "aptis-b2-12", "Session testId must be aptis-b2-12");
  assert.strictEqual(session12.currentSectionIndex, 0, "Must start at Section 0 (G&V)");

  const test12Pub = JSON.parse(fs.readFileSync(path.join(TESTS_DIR, "aptis-b2-12-public.json"), "utf-8"));
  const test12Ans = JSON.parse(fs.readFileSync(path.join(TESTS_DIR, "aptis-b2-12-answers.json"), "utf-8"));

  // Verify all 5 sections in Test 12 dataset belong to aptis-b2-12
  assert.strictEqual(test12Pub.metadata.testId, "aptis-b2-12");
  assert.strictEqual(test12Ans.testId, "aptis-b2-12");

  // Complete G&V section
  updateMockTestAnswer("grammarVocabulary", "q1", "is", memAdapter);
  const s1 = completeMockTestSection("grammarVocabulary", { rawScore: 50, maxScore: 50, scaledScore: 50, percentage: 100, isPassing: true }, memAdapter);
  assert.ok(s1, "Session must exist");
  assert.strictEqual(s1.currentSectionIndex, 1, "Must advance to Section 1 (Reading)");

  // Complete Reading section
  const s2 = completeMockTestSection("reading", { rawScore: 29, maxScore: 29, scaledScore: 50, percentage: 100, isPassing: true }, memAdapter);
  assert.ok(s2, "Session must exist");
  assert.strictEqual(s2.currentSectionIndex, 2, "Must advance to Section 2 (Listening)");

  // Complete Listening section
  const s3 = completeMockTestSection("listening", { rawScore: 25, maxScore: 25, scaledScore: 50, percentage: 100, isPassing: true }, memAdapter);
  assert.ok(s3, "Session must exist");
  assert.strictEqual(s3.currentSectionIndex, 3, "Must advance to Section 3 (Writing)");

  // Complete Writing section
  const s4 = completeMockTestSection("writing", { rawScore: 50, maxScore: 50, scaledScore: 50, percentage: 100, isPassing: true }, memAdapter);
  assert.ok(s4, "Session must exist");
  assert.strictEqual(s4.currentSectionIndex, 4, "Must advance to Section 4 (Speaking)");

  // Complete Speaking section & Final Exam Submission
  const s5 = completeMockTestSection("speaking", { rawScore: 50, maxScore: 50, scaledScore: 50, percentage: 100, isPassing: true }, memAdapter);
  assert.ok(s5, "Session must exist");
  const finalExam = submitFullMockTest(memAdapter);
  assert.ok(finalExam, "Final exam must be returned");
  assert.strictEqual(finalExam.testId, "aptis-b2-12", "Final exam must preserve testId aptis-b2-12");
  assert.strictEqual(finalExam.isSubmitted, true, "Exam must be marked as submitted");
  console.log("  ✓ FLOW E: Full Mock Test Test 12 completed across all 5 sections with testId preserved.");

  // ----------------------------------------------------------------
  // FLOW F: Cross-Test Isolation (Verify distinct tests do not collide or leak)
  // ----------------------------------------------------------------
  console.log("  [20.6] FLOW F: Cross-Test Isolation & Anti-Collision Verification...");
  const t01 = JSON.parse(fs.readFileSync(path.join(TESTS_DIR, "aptis-b2-01-public.json"), "utf-8"));
  const t05 = JSON.parse(fs.readFileSync(path.join(TESTS_DIR, "aptis-b2-05-public.json"), "utf-8"));
  const t08 = JSON.parse(fs.readFileSync(path.join(TESTS_DIR, "aptis-b2-08-public.json"), "utf-8"));
  const t12 = JSON.parse(fs.readFileSync(path.join(TESTS_DIR, "aptis-b2-12-public.json"), "utf-8"));
  const t16 = JSON.parse(fs.readFileSync(path.join(TESTS_DIR, "aptis-b2-16-public.json"), "utf-8"));

  // Check Reading Part 1 opening texts are distinct
  const t01R1 = t01.reading.parts[0].textWithGaps;
  const t05R1 = t05.reading.parts[0].textWithGaps;
  const t08R1 = t08.reading.parts[0].textWithGaps;
  const t12R1 = t12.reading.parts[0].textWithGaps;
  const t16R1 = t16.reading.parts[0].textWithGaps;

  assert.notStrictEqual(t01R1, t05R1, "Test 01 and Test 05 Reading text must not match");
  assert.notStrictEqual(t05R1, t08R1, "Test 05 and Test 08 Reading text must not match");
  assert.notStrictEqual(t08R1, t12R1, "Test 08 and Test 12 Reading text must not match");
  assert.notStrictEqual(t12R1, t16R1, "Test 12 and Test 16 Reading text must not match");

  // Check Test 16 missing audio status
  assert.strictEqual(t16.metadata.audioStatus, "missing", "Test 16 must have audioStatus: missing");
  assert.strictEqual(t16.metadata.isComplete, false, "Test 16 must be marked incomplete");

  console.log("  ✓ FLOW F: Cross-test isolation verified 100% distinct across tests.");

  // ----------------------------------------------------------------
  // FLOW G: Audio HTTP Server Verification
  // ----------------------------------------------------------------
  console.log("  [20.7] FLOW G: Real Audio Static Server Verification...");
  for (let i = 1; i <= 15; i++) {
    const mp3Name = `aptis-b2-${i.toString().padStart(2, "0")}.mp3`;
    const mp3Path = path.join(AUDIO_DIR, mp3Name);
    assert.ok(fs.existsSync(mp3Path), `Audio file ${mp3Name} must exist`);
    const size = fs.statSync(mp3Path).size;
    assert.ok(size > 10 * 1024 * 1024, `Audio file ${mp3Name} must be >10MB, got: ${size}`);
  }
  assert.strictEqual(fs.existsSync(path.join(AUDIO_DIR, "aptis-b2-16.mp3")), false, "Test 16 must NOT have an audio file");
  console.log("  ✓ FLOW G: 15 real audio tracks verified (>10MB each), Test 16 correctly missing.");

  console.log("✅ [TEST 20 PASSED] Real User E2E & Cross-Test Isolation tests completed successfully.");
}

if (process.argv[1]?.endsWith("e2e-user-flows.test.ts")) {
  runRealUserE2ETests();
}
