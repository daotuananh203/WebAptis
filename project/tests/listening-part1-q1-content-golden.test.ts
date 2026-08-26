import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function sha256(data: Buffer): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

export function runListeningPart1Q1ContentGoldenTests(): boolean {
  const root = process.cwd();
  const fixture = JSON.parse(fs.readFileSync(path.join(root, "data/tests/aptis-b2-01-listening-part1-q1-ground-truth.json"), "utf8"));
  const dataset = JSON.parse(fs.readFileSync(path.join(root, "data/tests/aptis-b2-01-public.json"), "utf8"));
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "data/listening-forensics/listening-audio-manifest.json"), "utf8"));
  const testEvidence = manifest.find((item: any) => item.audit.testId === "aptis-b2-01");
  const q1Artifact = testEvidence.artifacts.find((item: any) => item.blockId === "p1-q01");
  const q2Artifact = testEvidence.artifacts.find((item: any) => item.blockId === "p1-q02");
  const q2Source = testEvidence.audit.blocks.find((item: any) => item.blockId === "p1-q02");
  const q1Task = dataset.listening.parts[0].tasks[0];
  const q1Audio = q1Task.audio;

  assert.equal(fixture.structure.playbackCount, 2);
  assert.equal(fixture.structure.questionPromptIsRecordedInBlock, false);
  assert.equal(q1Task.id, "t01_l1_q01");
  assert.deepEqual(q1Task.options, ["3250 pounds", "3550 pounds", "4250 pounds"]);
  assert.equal(fixture.q1.expectedAnswer, "3250 pounds");
  assert.equal(q1Audio.url, "/audio/listening/segments/aptis-b2-01/part-1/q01.mp3");
  assert.equal(q1Task.audioUrl, q1Audio.url);
  assert.equal(q1Audio.mappingType, "QUESTION_SEGMENT");
  assert.equal(q1Audio.status, "VERIFIED");
  assert.equal(q1Artifact.status, "VERIFIED");

  const audioPath = path.join(root, q1Artifact.path.replace(/^project\//, ""));
  const audioBytes = fs.readFileSync(audioPath);
  assert.equal(sha256(audioBytes), q1Artifact.sha256, "Q1 bytes changed after transcript validation");
  assert.equal(q1Audio.sha256, q1Artifact.sha256, "Runtime Q1 mapping does not use validated bytes");
  assert.ok(q1Artifact.durationSeconds > 40 && q1Artifact.durationSeconds < 60);

  const transcriptEvidence = JSON.parse(fs.readFileSync(path.join(root, q1Artifact.transcriptEvidence.replace(/^project\//, "")), "utf8"));
  assert.equal(transcriptEvidence.audioSha256, q1Artifact.sha256);
  assert.equal(transcriptEvidence.validation.status, "VERIFIED");
  assert.deepEqual(transcriptEvidence.validation.unexpectedTaskContamination, []);
  const q1Check = transcriptEvidence.validation.checks.find((item: any) => item.blockId === "p1-q01");
  assert.equal(q1Check.expectedCompleteRenditions, 2);
  assert.equal(q1Check.detectedCompleteRenditions, 2);
  assert.equal(q1Check.pass, true);

  const rawSegments = transcriptEvidence.transcription.segments;
  for (const phrase of fixture.q1.requiredPhrases) {
    assert.ok(normalize(fixture.q1.sourceTranscript).includes(normalize(phrase)), `Source transcript missing required phrase: ${phrase}`);
    for (const occurrence of q1Check.occurrences) {
      const renditionTranscript = rawSegments
        .filter((segment: any) => segment.end >= occurrence.speechStart && segment.start <= occurrence.speechEnd)
        .map((segment: any) => segment.text)
        .join(" ");
      assert.ok(normalize(renditionTranscript).includes(normalize(phrase)), `A complete Q1 rendition is missing: ${phrase}`);
    }
  }

  const browserTranscript = normalize(rawSegments.map((segment: any) => segment.text).join(" "));
  const q2Opening = normalize(q2Source.sourceText).split(" ").slice(0, 9).join(" ");
  assert.ok(!browserTranscript.includes(q2Opening), "Q1 contains the opening speech of Q2");
  assert.ok(
    Math.max(...q1Artifact.masterClips.map((clip: any) => clip.end)) <=
      Math.min(...q2Artifact.masterClips.map((clip: any) => clip.start)),
    "Q1 source clips reach Q2",
  );
  assert.ok(!("start" in q1Audio) && !("end" in q1Audio), "Runtime must not retain stale single-range boundaries");

  console.log("✅ [TEST Q1 GOLDEN] Exact bytes, two complete source renditions, opening/ending coverage, and Q2 exclusion passed.");
  return true;
}

if (process.argv[1]?.endsWith("listening-part1-q1-content-golden.test.ts")) {
  runListeningPart1Q1ContentGoldenTests();
}
