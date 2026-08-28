import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  collectMockSpeakingSubmissions,
  collectMockWritingSubmissions,
  expectedMockSpeakingResponses,
  expectedMockWritingResponses,
  gradeMockSubjectiveSection,
} from "../lib/grading/mock-subjective";

const PROJECT_ROOT = path.resolve(import.meta.dirname, "..");
const TEST_IDS = [
  ...Array.from({ length: 16 }, (_, index) => `aptis-b2-${String(index + 1).padStart(2, "0")}`),
  ...Array.from({ length: 7 }, (_, index) => `aptis-4skills-${String(index + 1).padStart(2, "0")}`),
];

export async function runMockSubjectiveGradingTests(): Promise<boolean> {
  console.log("▶ [TEST] Running mock subjective AI grading contract tests...");

  for (const testId of TEST_IDS) {
    const data = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, "data", "tests", `${testId}-public.json`), "utf8"));
    assert.equal(expectedMockWritingResponses(data.writing), 11, `${testId} Writing must have 11 independently scorable responses`);
    assert.equal(expectedMockSpeakingResponses(data.speaking), 10, `${testId} Speaking must have 10 independently scorable recordings`);

    const firstWritingPrompt = data.writing.parts[0].prompts[0];
    assert.deepEqual(
      collectMockWritingSubmissions(data.writing, { [firstWritingPrompt.id]: "A concise response" }),
      [{ partNumber: 1, taskId: firstWritingPrompt.id, submissionText: "A concise response" }],
      `${testId} Writing collector must retain the exact source task id`
    );

    const firstSpeakingQuestion = data.speaking.parts[0].questions[0];
    const audio = "data:audio/webm;base64,AA==";
    assert.deepEqual(
      collectMockSpeakingSubmissions(data.speaking, { [`${firstSpeakingQuestion.id}__speaking_audio`]: audio }),
      [{ partNumber: 1, taskId: firstSpeakingQuestion.id, audioData: audio }],
      `${testId} Speaking collector must retain the exact source question id`
    );
  }

  const sample = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, "data", "tests", "aptis-b2-01-public.json"), "utf8"));
  const writingEmpty = await gradeMockSubjectiveSection({
    testId: "aptis-b2-01",
    skill: "writing",
    sectionData: sample.writing,
    answers: {},
  });
  assert.deepEqual(
    writingEmpty,
    { status: "NOT_SUBMITTED", evaluatedResponses: 0, expectedResponses: 11, unevaluatedResponses: 11, evaluationErrors: [] },
    "An empty Writing mock must remain unscored rather than receive a fabricated zero"
  );

  const speakingEmpty = await gradeMockSubjectiveSection({
    testId: "aptis-b2-01",
    skill: "speaking",
    sectionData: sample.speaking,
    answers: {},
  });
  assert.deepEqual(
    speakingEmpty,
    { status: "NOT_SUBMITTED", evaluatedResponses: 0, expectedResponses: 10, unevaluatedResponses: 10, evaluationErrors: [] },
    "An empty Speaking mock must remain unscored rather than receive a fabricated zero"
  );

  console.log("  ✓ 23 test datasets expose exact task IDs for 11 Writing and 10 Speaking AI submissions; empty work is never assigned a fake score.");
  return true;
}

if (process.argv[1]?.endsWith("mock-subjective-grading.test.ts")) {
  runMockSubjectiveGradingTests();
}
