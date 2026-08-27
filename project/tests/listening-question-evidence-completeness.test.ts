import assert from "node:assert/strict";
import { artifactFor, loadListeningManifest, resultFor } from "./listening-contract-test-helpers";

export function runListeningQuestionEvidenceCompletenessTests(): boolean {
  const manifest = loadListeningManifest();
  assert.equal(manifest.length, 15);
  let verified = 0;
  let uncertain = 0;
  for (const result of manifest) {
    assert.ok(result.audit.sourceTranscript);
    assert.ok(result.audit.masterAudio);
    assert.ok(result.audit.masterAudioSha256);
    for (const artifact of result.artifacts) {
      const stored = artifactFor(result.audit.testId, artifact.blockId);
      if (stored.status === "VERIFIED") {
        assert.match(stored.sha256, /^[a-f0-9]{64}$/);
        assert.ok(stored.transcriptEvidence);
        verified += 1;
      } else {
        assert.equal(stored.status, "UNCERTAIN");
        assert.ok(stored.reason);
        uncertain += 1;
      }
    }
  }
  assert.equal(verified, 329);
  assert.equal(uncertain, 1);
  const test04 = resultFor("aptis-b2-04");
  const test04Mono1 = test04.audit.blocks.find((block: any) => block.blockId === "p4-mono1");
  const test04Mono2 = test04.audit.blocks.find((block: any) => block.blockId === "p4-mono2");
  assert.doesNotMatch(test04Mono1.sourceText, /Advertising in sports/i);
  assert.match(test04Mono2.sourceText, /^Advertising in sports/i);
  const recovered = artifactFor("aptis-b2-04", "p4-mono1");
  assert.equal(recovered.sourceMasterTestId, "aptis-b2-07");
  assert.equal(recovered.sourceDuplicateRecovery.sourceTranscriptSha256, recovered.sourceTranscriptSha256);
  const test06Q11 = resultFor("aptis-b2-06").audit.blocks.find((block: any) => block.blockId === "p1-q11");
  assert.doesNotMatch(test06Q11.sourceText, /Hi, I'm Emma/i);
  console.log("✅ [TEST 28] All 329 generated assets have immutable byte hashes and transcript evidence; 1 was not generated.");
  return true;
}
