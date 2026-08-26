import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

type Frame = { timestamp: number; bytes: Buffer };

const BITRATES = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 0];
const SAMPLE_RATES = [44100, 48000, 32000, 0];

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function parseFrames(data: Buffer): Frame[] {
  let pos = 0;
  if (data.subarray(0, 3).toString() === "ID3") {
    const tagLength = data.readUInt32BE(6);
    const tagSize = ((tagLength >> 24 & 0x7f) << 21) | ((tagLength >> 16 & 0x7f) << 14) | ((tagLength >> 8 & 0x7f) << 7) | (tagLength & 0x7f);
    pos = 10 + tagSize;
  }
  const frames: Frame[] = [];
  let timestamp = 0;
  while (pos < data.length - 4) {
    if (data[pos] === 0xff && (data[pos + 1] & 0xe0) === 0xe0) {
      const version = (data[pos + 1] >> 3) & 0x03;
      const layer = (data[pos + 1] >> 1) & 0x03;
      const bitrateIndex = (data[pos + 2] >> 4) & 0x0f;
      const sampleRateIndex = (data[pos + 2] >> 2) & 0x03;
      const padding = (data[pos + 2] >> 1) & 0x01;
      if (version === 3 && layer === 1 && bitrateIndex > 0 && bitrateIndex < 15 && sampleRateIndex < 3) {
        const frameLength = Math.floor(144 * BITRATES[bitrateIndex] * 1000 / SAMPLE_RATES[sampleRateIndex]) + padding;
        const frame = data.subarray(pos, pos + frameLength);
        if (frame.length === frameLength) {
          frames.push({ timestamp, bytes: frame });
          timestamp += 1152 / SAMPLE_RATES[sampleRateIndex];
          pos += frameLength;
          continue;
        }
      }
    }
    pos += 1;
  }
  return frames;
}

export function runListeningPart1Q1ContentGoldenTests(): boolean {
  const root = process.cwd();
  const fixture = JSON.parse(fs.readFileSync(path.join(root, "data/tests/aptis-b2-01-listening-part1-q1-ground-truth.json"), "utf8"));
  const dataset = JSON.parse(fs.readFileSync(path.join(root, "data/tests/aptis-b2-01-public.json"), "utf8"));
  const q1 = fixture.q1;
  const q1Task = dataset.listening.parts[0].tasks[0];
  const q2Task = dataset.listening.parts[0].tasks[1];
  const q1Audio = q1Task.audio;

  assert.equal(fixture.structure.playbackCount, 2);
  assert.equal(fixture.structure.questionPromptIsRecordedInBlock, false);
  assert.equal(q1Task.id, "t01_l1_q01");
  assert.deepEqual(q1Task.options, ["3250 pounds", "3550 pounds", "4250 pounds"]);
  assert.equal(q1.expectedAnswer, "3250 pounds");
  assert.equal(q1Audio.url, "/audio/listening/segments/aptis-b2-01/part-1/q01.mp3");
  assert.equal(q1Task.audioUrl, q1Audio.url);
  assert.equal(q1Audio.mappingType, "QUESTION_SEGMENT");

  const occurrences = q1.alignedOccurrences;
  assert.equal(occurrences.length, 2);
  assert.ok(occurrences[0].speechStart < occurrences[0].speechEnd);
  assert.ok(occurrences[0].speechEnd < occurrences[1].speechStart);
  assert.ok(occurrences[1].speechEnd < q1.nextQuestionSpeechStart);
  for (const phrase of q1.requiredPhrases) {
    assert.ok(normalize(q1.sourceTranscript).includes(normalize(phrase)), `Source transcript missing required phrase: ${phrase}`);
    for (const occurrence of occurrences) {
      assert.ok(normalize(occurrence.transcript).includes(normalize(phrase)), `Playback missing required phrase: ${phrase}`);
    }
  }

  const expectedStart = occurrences[0].speechStart - q1.boundaryPolicy.preRollSeconds;
  const expectedEnd = occurrences[1].speechEnd + q1.boundaryPolicy.postRollSeconds;
  assert.ok(q1Audio.start <= expectedStart + 0.05, `Q1 starts too late: ${q1Audio.start}s`);
  assert.ok(q1Audio.end >= expectedEnd - 0.05, `Q1 ends before the full block: ${q1Audio.end}s`);
  assert.ok(q1Audio.end < q1.nextQuestionSpeechStart, "Q1 boundary reaches Q2 speech");
  assert.ok(q1Audio.end <= q2Task.audio.start || q2Task.audio.start >= q1.nextQuestionSpeechStart, "Q1/Q2 metadata overlaps");

  const master = fs.readFileSync(path.join(root, "public/audio/listening/aptis-b2-01.mp3"));
  const q1Asset = fs.readFileSync(path.join(root, "public", q1Audio.url.replace(/^\//, "")));
  const expectedBytes = Buffer.concat(parseFrames(master).filter((frame) => frame.timestamp >= q1Audio.start && frame.timestamp <= q1Audio.end).map((frame) => frame.bytes));
  assert.ok(expectedBytes.length > 0);
  assert.deepEqual(q1Asset, expectedBytes, "Q1 asset is not the exact source-aligned master slice");

  const selectedDuration = parseFrames(master).filter((frame) => frame.timestamp >= q1Audio.start && frame.timestamp <= q1Audio.end).length * (1152 / 44100);
  assert.ok(selectedDuration >= 47 && selectedDuration <= 49, `Unexpected Q1 audio span: ${selectedDuration}s`);
  assert.ok(q1Audio.end + 2.0 <= q1.nextQuestionSpeechStart, "Post-roll would contaminate Q2");

  console.log("✅ [TEST Q1 GOLDEN] Source transcript coverage, ordered replay mapping, exact master slice, and Q2 exclusion passed.");
  return true;
}

if (process.argv[1]?.endsWith("listening-part1-q1-content-golden.test.ts")) {
  runListeningPart1Q1ContentGoldenTests();
}
