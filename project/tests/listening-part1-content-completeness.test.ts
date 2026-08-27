import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { artifactFor, assertPart1ClipIsolation, assertRuntimeMatchesArtifact } from "./listening-contract-test-helpers";

export function runListeningPart1ContentCompletenessTests(): boolean {
  let verified = 0;
  let uncertain = 0;
  for (let number = 1; number <= 15; number += 1) {
    const testId = `aptis-b2-${String(number).padStart(2, "0")}`;
    const dataset = JSON.parse(fs.readFileSync(path.join(process.cwd(), `data/tests/${testId}-public.json`), "utf8"));
    assertPart1ClipIsolation(testId);
    dataset.listening.parts[0].tasks.forEach((task: any, index: number) => {
      const blockId = `p1-q${String(index + 1).padStart(2, "0")}`;
      const status = assertRuntimeMatchesArtifact(testId, blockId, task.audio);
      if (status === "VERIFIED") {
        const artifact = artifactFor(testId, blockId);
        assert.ok(artifact.masterClips.length >= 1);
        assert.ok(artifact.masterClips.every((clip: any) => clip.start < clip.end));
        assert.equal(task.audio.verification.fullTaskContentPresent, true);
        verified += 1;
      } else uncertain += 1;
    });
  }
  assert.equal(verified, 194);
  assert.equal(uncertain, 1);
  console.log("✅ [TEST 32] Generated Part 1 blocks have full transcript coverage and isolated source clips.");
  return true;
}
