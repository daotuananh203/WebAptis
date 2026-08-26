import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { resolveSectionParts } from "../components/mock-test/exam-shell";
import { assertRuntimeMatchesArtifact, assertTest16Missing } from "./listening-contract-test-helpers";

export function runListeningQuestionLevelCompletenessTests(): boolean {
  let verified = 0;
  let uncertain = 0;
  const count = (status: "VERIFIED" | "UNCERTAIN", amount = 1) => status === "VERIFIED" ? verified += amount : uncertain += amount;
  for (let number = 1; number <= 15; number += 1) {
    const testId = `aptis-b2-${String(number).padStart(2, "0")}`;
    const dataset = JSON.parse(fs.readFileSync(path.join(process.cwd(), `data/tests/${testId}-public.json`), "utf8"));
    const [p1, p2, p3, p4] = dataset.listening.parts;
    p1.tasks.forEach((item: any, index: number) => count(assertRuntimeMatchesArtifact(testId, `p1-q${String(index + 1).padStart(2, "0")}`, item.audio)));
    p2.speakers.forEach((item: any, index: number) => count(assertRuntimeMatchesArtifact(testId, `p2-spk-${"abcd"[index]}`, item.audio)));
    count(assertRuntimeMatchesArtifact(testId, "p3-task-all", p3.audio), 4);
    p4.monologues.forEach((item: any, index: number) => count(assertRuntimeMatchesArtifact(testId, `p4-mono${index + 1}`, item.audio)));
    assert.equal(resolveSectionParts(dataset, "listening").length, 4);
  }
  assert.equal(verified, 343);
  assert.equal(uncertain, 2);
  assert.equal(assertTest16Missing(), 23);
  console.log("✅ [TEST 27] 343 runtime items verified, 2 explicitly uncertain, 23 missing with no fake audio.");
  return true;
}
