import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { resolveSectionParts } from "../components/mock-test/exam-shell";
import { assertRuntimeMatchesArtifact, assertTest16Missing } from "./listening-contract-test-helpers";

export function runListeningRuntimeArchitectureTests(): boolean {
  let partAudios = 0;
  for (let number = 1; number <= 15; number += 1) {
    const testId = `aptis-b2-${String(number).padStart(2, "0")}`;
    const dataset = JSON.parse(fs.readFileSync(path.join(process.cwd(), `data/tests/${testId}-public.json`), "utf8"));
    const parts = resolveSectionParts(dataset, "listening");
    assert.deepEqual(parts.map((part: any) => part.partIdentifier), ["part1", "part2", "part3", "part4"]);
    const runtimeParts = dataset.listening.parts;
    for (const [partIndex, blockId, mappingType] of [
      [1, "p2-task-all", "SHARED_TASK"],
      [2, "p3-task-all", "SHARED_TASK"],
      [3, "p4-task-all", "SHARED_TASK"],
    ] as const) {
      const audio = runtimeParts[partIndex].audio;
      assert.equal(audio.mappingType, mappingType);
      assertRuntimeMatchesArtifact(testId, blockId, audio);
      partAudios += 1;
    }
  }
  assert.equal(partAudios, 45);
  assertTest16Missing();
  const renderer = fs.readFileSync(path.join(process.cwd(), "components/practice/question-renderer.tsx"), "utf8");
  assert.match(renderer, /20260826-contract-v1/);
  assert.match(renderer, /isTaskVerified/);
  console.log("✅ [TEST 33] Practice and Mock Test resolve the same 45 transcript-validated part recordings.");
  return true;
}
