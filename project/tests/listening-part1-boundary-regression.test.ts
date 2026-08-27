import assert from "node:assert/strict";
import { artifactFor, assertPart1ClipIsolation, resultFor } from "./listening-contract-test-helpers";

export function runListeningPart1BoundaryRegressionTests(): boolean {
  let verified = 0;
  let uncertain = 0;
  for (let number = 1; number <= 15; number += 1) {
    const testId = `aptis-b2-${String(number).padStart(2, "0")}`;
    assertPart1ClipIsolation(testId);
    for (let question = 1; question <= 13; question += 1) {
      const blockId = `p1-q${String(question).padStart(2, "0")}`;
      const artifact = artifactFor(testId, blockId);
      if (artifact.status === "VERIFIED") {
        assert.ok(artifact.masterClips.every((clip: any) => clip.start >= 0 && clip.end > clip.start));
        verified += 1;
      } else {
        assert.equal(artifact.status, "UNCERTAIN");
        uncertain += 1;
      }
    }
    const audit = resultFor(testId).audit;
    assert.ok(audit.blocks.filter((block: any) => block.part === 1).every((block: any) => block.detectedRenditions >= block.completeRenditions));
  }
  assert.equal(verified, 194);
  assert.equal(uncertain, 1);
  console.log("✅ [TEST 31] Ordered source clips do not overlap; incomplete source renditions are never promoted.");
  return true;
}
