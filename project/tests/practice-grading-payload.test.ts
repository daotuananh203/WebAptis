import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { NextRequest } from "next/server";
import { POST as gradeDeterministic } from "../app/api/grade/deterministic/route";
import {
  createAttemptFromSpeakingResult,
  createAttemptFromWritingResult,
} from "../lib/progress/history";

export async function runPracticeGradingPayloadTests() {
  console.log("▶ [TEST 36] Running practice part-level grading payload regression tests...");

  const shellPath = path.join(process.cwd(), "components/practice/practice-shell.tsx");
  const shellSource = fs.readFileSync(shellPath, "utf8");
  assert.match(
    shellSource,
    /testId,\s*skill,\s*partIdentifier,\s*answers/,
    "PracticeShell must send partIdentifier to deterministic grading",
  );

  const answers = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), "data/tests/aptis-b2-01-answers.json"), "utf8"),
  );
  const request = new NextRequest("http://localhost/api/grade/deterministic", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      testId: "aptis-b2-01",
      skill: "listening",
      partIdentifier: "part1",
      answers: answers.listening.part1,
    }),
  });

  const response = await gradeDeterministic(request);
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.success, true);
  assert.equal(payload.data.rawScore, 13);
  assert.equal(payload.data.maxRawScore, 13);
  assert.equal(payload.data.percentage, 100);
  assert.equal(payload.data.parts, undefined);

  console.log("  ✓ Listening Part1 request grades 13/13 when partIdentifier is present.");

  // The client result view and persistence layer must use the score contract
  // returned by both AI examiner endpoints.  These two assertions protect the
  // exact mismatch that previously wrote undefined/NaN scores to progress.
  const writingAttempt = createAttemptFromWritingResult({
    result: {
      testId: "aptis-b2-01",
      partNumber: 4,
      taskType: "formal-email",
      wordCount: 120,
      wordCountStatus: "within_range",
      overallScore: 16,
      maxOverallScore: 20,
      percentage: 80,
      estimatedBand: "B2",
      scoreType: "AI_ESTIMATE",
      criteria: [],
      grammarErrors: [],
      vocabularyUpgrades: [],
      strengths: [],
      areasForImprovement: [],
      modelAnswer: "",
      correctedVersion: "",
      improvementPlan: [],
      linkedKnowledge: [],
      disclaimer: "PRACTICE ESTIMATE — NOT AN OFFICIAL BRITISH COUNCIL SCORE",
    },
    mode: "practice",
  });
  assert.deepEqual(
    [writingAttempt.rawScore, writingAttempt.maxRawScore, writingAttempt.percentage],
    [16, 20, 80],
    "Writing AI score must persist the endpoint's overall-score contract",
  );

  const speakingAttempt = createAttemptFromSpeakingResult({
    result: {
      testId: "aptis-4skills-01",
      partNumber: 3,
      taskType: "compare-speculate-opinion",
      audioQuality: "sufficient",
      overallScore: 18,
      maxOverallScore: 25,
      percentage: 72,
      estimatedBand: "B2",
      scoreType: "AI_ESTIMATE",
      criteria: [],
      pronunciationFeedback: [],
      pronunciationStatus: "pedagogical_estimate",
      fluencyStatus: "available",
      spokenGrammarErrors: [],
      vocabularyUpgrades: [],
      strengths: [],
      areasForImprovement: [],
      improvementPlan: [],
      linkedKnowledge: [],
      transcript: "A relevant spoken response.",
      transcriptStatus: "available",
      transcriptNotice: "AI-generated transcript — not guaranteed verbatim",
      disclaimer: "PRACTICE ESTIMATE — NOT AN OFFICIAL BRITISH COUNCIL SCORE",
    },
    mode: "practice",
  });
  assert.deepEqual(
    [speakingAttempt.rawScore, speakingAttempt.maxRawScore, speakingAttempt.percentage],
    [18, 25, 72],
    "Speaking AI score must persist the endpoint's overall-score contract",
  );
  assert.doesNotMatch(
    shellSource,
    /evalResult\.finalScore/,
    "PracticeShell must not read the retired finalScore field from AI examiner responses",
  );
  assert.match(
    shellSource,
    /Vui lòng nhập bài viết trước khi nộp để AI chấm\./,
    "PracticeShell must stop an empty Writing response before invoking the examiner",
  );
  console.log("  ✓ Writing and Speaking AI results preserve overallScore/maxOverallScore/percentage.");
  console.log("✅ [TEST 36 PASSED] Practice part-level grading payload regression tests completed.\n");
  return true;
}

if (process.argv[1] === import.meta.filename) {
  await runPracticeGradingPayloadTests();
}
