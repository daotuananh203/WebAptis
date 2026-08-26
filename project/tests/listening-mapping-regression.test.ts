import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { assertRuntimeMatchesArtifact, assertTest16Missing } from "./listening-contract-test-helpers";

export function runListeningMappingRegressionTests(): boolean {
  const root = process.cwd();
  for (let number = 1; number <= 15; number += 1) {
    const pad = String(number).padStart(2, "0");
    const testId = `aptis-b2-${pad}`;
    const master = path.join(root, `public/audio/listening/${testId}.mp3`);
    assert.ok(fs.existsSync(master) && fs.statSync(master).size > 10_000_000);
    const dataset = JSON.parse(fs.readFileSync(path.join(root, `data/tests/${testId}-public.json`), "utf8"));
    const [part1, part2, part3, part4] = dataset.listening.parts;
    part1.tasks.forEach((task: any, index: number) => {
      const blockId = `p1-q${String(index + 1).padStart(2, "0")}`;
      assert.equal(task.audioUrl, task.audio.url);
      assertRuntimeMatchesArtifact(testId, blockId, task.audio);
    });
    part2.speakers.forEach((speaker: any, index: number) =>
      assertRuntimeMatchesArtifact(testId, `p2-spk-${"abcd"[index]}`, speaker.audio),
    );
    assertRuntimeMatchesArtifact(testId, "p3-task-all", part3.audio);
    part4.monologues.forEach((mono: any, index: number) =>
      assertRuntimeMatchesArtifact(testId, `p4-mono${index + 1}`, mono.audio),
    );
  }
  assert.ok(!fs.existsSync(path.join(root, "public/audio/listening/aptis-b2-16.mp3")));
  assertTest16Missing();
  console.log("✓ [TEST 23] Runtime URLs and bytes match the transcript-validated contract manifest.");
  return true;
}
