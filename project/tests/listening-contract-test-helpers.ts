import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const MANIFEST_PATH = path.join(ROOT, "data/listening-forensics/listening-audio-manifest.json");

export function loadListeningManifest(): any[] {
  return JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
}

export function resultFor(testId: string): any {
  const result = loadListeningManifest().find((item) => item.audit.testId === testId);
  assert.ok(result, `${testId}: missing contract manifest result`);
  return result;
}

export function artifactFor(testId: string, blockId: string): any {
  const artifact = resultFor(testId).artifacts.find((item: any) => item.blockId === blockId);
  assert.ok(artifact, `${testId} ${blockId}: missing contract artifact`);
  return artifact;
}

function fileSha256(filePath: string): string {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

export function assertRuntimeMatchesArtifact(
  testId: string,
  blockId: string,
  audio: any,
): "VERIFIED" | "UNCERTAIN" {
  const artifact = artifactFor(testId, blockId);
  if (artifact.status !== "VERIFIED") {
    assert.equal(artifact.status, "UNCERTAIN", `${testId} ${blockId}: invalid manifest status`);
    assert.equal(audio.status, "NOT_VERIFIED", `${testId} ${blockId}: runtime must fail closed`);
    assert.equal(audio.audioSegmentStatus, "NOT_VERIFIED");
    assert.equal(audio.url, "", `${testId} ${blockId}: uncertain bytes must not be playable`);
    assert.equal(audio.verification?.recordingBoundaryVerified, false);
    return "UNCERTAIN";
  }

  assert.equal(audio.status, "VERIFIED", `${testId} ${blockId}: runtime status mismatch`);
  assert.equal(audio.audioSegmentStatus, "VERIFIED");
  assert.equal(audio.url, artifact.url, `${testId} ${blockId}: runtime URL mismatch`);
  assert.equal(audio.sha256, artifact.sha256, `${testId} ${blockId}: runtime hash mismatch`);
  assert.equal(audio.cacheVersion, "20260826-contract-v1");
  assert.ok(!("start" in audio) && !("end" in audio), `${testId} ${blockId}: stale single-range boundary`);

  const diskPath = path.join(ROOT, artifact.path.replace(/^project\//, ""));
  assert.ok(fs.existsSync(diskPath), `${testId} ${blockId}: audio bytes missing`);
  assert.equal(fileSha256(diskPath), artifact.sha256, `${testId} ${blockId}: bytes changed after validation`);
  assert.ok(artifact.durationSeconds > 1, `${testId} ${blockId}: invalid duration`);

  const transcriptPath = path.join(ROOT, artifact.transcriptEvidence.replace(/^project\//, ""));
  const evidence = JSON.parse(fs.readFileSync(transcriptPath, "utf8"));
  assert.equal(evidence.audioSha256, artifact.sha256);
  assert.equal(evidence.validation.status, "VERIFIED");
  assert.deepEqual(evidence.validation.unexpectedTaskContamination, []);
  assert.ok(evidence.validation.checks.every((check: any) => check.pass));
  assert.equal(audio.verification?.fullTaskContentPresent, true);
  assert.equal(audio.verification?.openingMatched, true);
  assert.equal(audio.verification?.endingMatched, true);
  assert.equal(audio.verification?.noPreviousTaskContamination, true);
  assert.equal(audio.verification?.noNextTaskContamination, true);
  return "VERIFIED";
}

export function assertTest16Missing(): number {
  const dataset = JSON.parse(fs.readFileSync(path.join(ROOT, "data/tests/aptis-b2-16-public.json"), "utf8"));
  assert.equal(dataset.listening.audioUrl, "");
  assert.equal(dataset.listening.audio.status, "missing");
  let items = 0;
  for (const part of dataset.listening.parts) {
    if (part.audio) assert.equal(part.audio.status, "missing");
    for (const key of ["tasks", "speakers", "statements", "monologues"]) {
      for (const item of part[key] || []) {
        assert.equal(item.audio?.status, "missing");
        items += 1;
      }
    }
  }
  assert.equal(items, 23);
  return items;
}

export function assertPart1ClipIsolation(testId: string): void {
  const result = resultFor(testId);
  const artifacts = result.artifacts.filter(
    (item: any) => item.blockId.startsWith("p1-q") && item.status === "VERIFIED",
  );
  for (let leftIndex = 0; leftIndex < artifacts.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < artifacts.length; rightIndex += 1) {
      for (const left of artifacts[leftIndex].masterClips) {
        for (const right of artifacts[rightIndex].masterClips) {
          assert.ok(
            left.end <= right.start || right.end <= left.start,
            `${testId}: ${artifacts[leftIndex].blockId} overlaps ${artifacts[rightIndex].blockId}`,
          );
        }
      }
    }
  }
}
