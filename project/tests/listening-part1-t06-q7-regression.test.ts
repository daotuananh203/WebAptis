import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

export function runListeningPart1T06Q7RegressionTests(): boolean {
  const root = process.cwd();
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "data/listening-forensics/listening-audio-manifest.json"), "utf8"));
  const testEvidence = manifest.find((item: any) => item.audit.testId === "aptis-b2-06");
  const q6 = testEvidence.artifacts.find((item: any) => item.blockId === "p1-q06");
  const q7 = testEvidence.artifacts.find((item: any) => item.blockId === "p1-q07");
  const q8 = testEvidence.artifacts.find((item: any) => item.blockId === "p1-q08");
  const q7Audit = testEvidence.audit.blocks.find((item: any) => item.blockId === "p1-q07");

  assert.equal(q7.status, "VERIFIED");
  assert.equal(q7Audit.status, "CANDIDATE");
  assert.equal(q7Audit.occurrences.length, 1);
  assert.ok(q7Audit.occurrences[0].speechStart < 260, "Q7 must retain the first opening before the answer-bearing continuation");
  assert.ok(q7Audit.occurrences[0].speechEnd > 290, "Q7 must retain the final conversation turn");
  assert.ok(q6.masterClips[0].end <= q7.masterClips[0].start, "Q6 and Q7 source clips overlap");
  assert.ok(q7.masterClips[0].end <= q8.masterClips[0].start, "Q7 reaches into Q8");

  const evidence = JSON.parse(fs.readFileSync(path.join(root, q7.transcriptEvidence.replace(/^project\//, "")), "utf8"));
  assert.equal(evidence.validation.status, "VERIFIED");
  assert.deepEqual(evidence.validation.unexpectedTaskContamination, []);
  const transcript = normalize(evidence.transcription.segments.map((segment: any) => segment.text).join(" "));
  for (const phrase of [
    "hey sarah let's check out this store",
    "sure john how about this t-shirt",
    "what about this hat",
    "i really need a suit for the office",
    "let's keep looking for other things we might need",
  ]) {
    assert.ok(transcript.includes(normalize(phrase)), `Q7 transcript is missing source content: ${phrase}`);
  }
  assert.ok(!transcript.includes(normalize("hi im jack and i want to talk about where i live")), "Q7 contains Q8 opening speech");
  console.log("✅ [TEST T06 Q7] Source-internal repeated opening keeps the full Q7 block and excludes Q8.");
  return true;
}

if (process.argv[1]?.endsWith("listening-part1-t06-q7-regression.test.ts")) {
  runListeningPart1T06Q7RegressionTests();
}
