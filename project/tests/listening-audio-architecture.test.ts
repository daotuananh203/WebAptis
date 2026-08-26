import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { resolveSectionParts } from "../components/mock-test/exam-shell";
import { assertRuntimeMatchesArtifact, assertTest16Missing } from "./listening-contract-test-helpers";

export function runListeningAudioArchitectureTests(): boolean {
  let verifiedQuestions = 0;
  let uncertainQuestions = 0;
  let verifiedPartAudio = 0;
  for (let number = 1; number <= 15; number += 1) {
    const testId = `aptis-b2-${String(number).padStart(2, "0")}`;
    const dataset = JSON.parse(fs.readFileSync(path.join(process.cwd(), `data/tests/${testId}-public.json`), "utf8"));
    const [p1, p2, p3, p4] = dataset.listening.parts;
    assert.equal(p1.tasks.length, 13);
    p1.tasks.forEach((task: any, index: number) => {
      assert.equal(task.audio.mappingType, "QUESTION_SEGMENT");
      const status = assertRuntimeMatchesArtifact(testId, `p1-q${String(index + 1).padStart(2, "0")}`, task.audio);
      if (status === "VERIFIED") verifiedQuestions += 1;
      else uncertainQuestions += 1;
    });
    for (const [part, blockId, suffix] of [
      [p2, "p2-task-all", "part-2/task-all.mp3"],
      [p3, "p3-task-all", "part-3/task-all.mp3"],
      [p4, "p4-task-all", "part-4/task-all.mp3"],
    ] as const) {
      assert.equal(part.audio.mappingType, "SHARED_TASK");
      assertRuntimeMatchesArtifact(testId, blockId, part.audio);
      assert.ok(part.audio.url.endsWith(suffix));
      verifiedPartAudio += 1;
    }
    assert.equal(resolveSectionParts(dataset, "listening").length, 4);
  }
  assert.equal(verifiedQuestions, 193);
  assert.equal(uncertainQuestions, 2);
  assert.equal(verifiedPartAudio, 45);
  assertTest16Missing();
  console.log("✅ [TEST 30] Architecture maps 193 verified questions, 2 uncertain questions, and 45 verified part audios.");
  return true;
}
