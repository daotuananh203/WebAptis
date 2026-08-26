import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { resolveSectionParts } from "../components/mock-test/exam-shell";
import { assertRuntimeMatchesArtifact, assertTest16Missing } from "./listening-contract-test-helpers";

export function runListeningContentQARegressionTests(): boolean {
  let verified = 0;
  let uncertain = 0;
  for (let number = 1; number <= 15; number += 1) {
    const pad = String(number).padStart(2, "0");
    const testId = `aptis-b2-${pad}`;
    const dataset = JSON.parse(fs.readFileSync(path.join(process.cwd(), `data/tests/${testId}-public.json`), "utf8"));
    const [p1, p2, p3, p4] = dataset.listening.parts;
    const record = (status: "VERIFIED" | "UNCERTAIN", multiplier = 1) => {
      if (status === "VERIFIED") verified += multiplier;
      else uncertain += multiplier;
    };
    p1.tasks.forEach((task: any, index: number) => record(assertRuntimeMatchesArtifact(testId, `p1-q${String(index + 1).padStart(2, "0")}`, task.audio)));
    p2.speakers.forEach((speaker: any, index: number) => record(assertRuntimeMatchesArtifact(testId, `p2-spk-${"abcd"[index]}`, speaker.audio)));
    record(assertRuntimeMatchesArtifact(testId, "p3-task-all", p3.audio), p3.statements.length);
    p4.monologues.forEach((mono: any, index: number) => record(assertRuntimeMatchesArtifact(testId, `p4-mono${index + 1}`, mono.audio)));
    assert.equal(resolveSectionParts(dataset, "listening").length, 4);
  }
  assert.equal(verified, 343, "Only independently transcript-verified runtime items may be counted");
  assert.equal(uncertain, 2, "Test 03 Q13 and Test 06 Q7 must remain explicitly uncertain");
  assert.equal(assertTest16Missing(), 23);
  console.log(`✓ [TEST 24] VERIFIED=${verified}, UNCERTAIN=${uncertain}, MISSING=23; zero fake verification.`);
  return true;
}
