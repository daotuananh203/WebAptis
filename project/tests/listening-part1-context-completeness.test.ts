import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { assertRuntimeMatchesArtifact, assertTest16Missing } from "./listening-contract-test-helpers";

export function runListeningPart1ContextCompletenessTests(): boolean {
  let verified = 0;
  let uncertain = 0;
  for (let number = 1; number <= 15; number += 1) {
    const testId = `aptis-b2-${String(number).padStart(2, "0")}`;
    const dataset = JSON.parse(fs.readFileSync(path.join(process.cwd(), `data/tests/${testId}-public.json`), "utf8"));
    const tasks = dataset.listening.parts[0].tasks;
    assert.equal(tasks.length, 13);
    tasks.forEach((task: any, index: number) => {
      const status = assertRuntimeMatchesArtifact(testId, `p1-q${String(index + 1).padStart(2, "0")}`, task.audio);
      if (status === "VERIFIED") {
        assert.ok(task.audio.duration >= 10, `${testId} Q${index + 1}: implausibly short complete block`);
        assert.ok(task.audio.verification.transcriptEvidence);
        verified += 1;
      } else {
        uncertain += 1;
      }
    });
  }
  assert.equal(verified, 193);
  assert.equal(uncertain, 2);
  assertTest16Missing();
  console.log("✅ [TEST 29] Full-context evidence exists for 193 questions; two source/master conflicts remain uncertain.");
  return true;
}
