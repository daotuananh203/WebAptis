import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
  validateAnswerKeyDataset,
  validateDatasetConsistency,
  validatePublicDataset,
} from "../lib/exam/schema/validator";
import { ALL_EXAM_TEST_CATALOG } from "../lib/exam/test-catalog";

const PROJECT_ROOT = path.resolve(import.meta.dirname, "..");
const TEST_IDS = Array.from({ length: 7 }, (_, index) => `aptis-4skills-${String(index + 1).padStart(2, "0")}`);

/**
 * Regression coverage for the independent four-skills source batch.  This
 * test validates the actual generated contract, not just that JSON files are
 * present: public data, answer keys, source-block manifests and public media
 * must agree with each other.
 */
export function runAptis4SkillsIngestionTests(): boolean {
  console.log("▶ [TEST] Running Aptis four-skills source ingestion tests...");

  assert.equal(TEST_IDS.length, 7);
  assert.equal(new Set(TEST_IDS).size, TEST_IDS.length);
  assert.equal(ALL_EXAM_TEST_CATALOG.length, 23);
  assert.deepEqual(
    ALL_EXAM_TEST_CATALOG.slice(-7).map((entry) => entry.testId),
    TEST_IDS,
    "The seven source-derived tests must be independent catalog entries"
  );

  for (const testId of TEST_IDS) {
    const publicPath = path.join(PROJECT_ROOT, "data", "tests", `${testId}-public.json`);
    const answerPath = path.join(PROJECT_ROOT, "data", "tests", `${testId}-answers.json`);
    const manifestPath = path.join(PROJECT_ROOT, "data", "source-ingestion", "aptis-4skills", "audio", `${testId}.json`);

    assert.ok(fs.existsSync(publicPath), `Missing public dataset: ${testId}`);
    assert.ok(fs.existsSync(answerPath), `Missing answer key: ${testId}`);
    assert.ok(fs.existsSync(manifestPath), `Missing audio manifest: ${testId}`);

    const publicData = JSON.parse(fs.readFileSync(publicPath, "utf8"));
    const answerData = JSON.parse(fs.readFileSync(answerPath, "utf8"));
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

    assert.equal(validatePublicDataset(publicData).valid, true, `${testId} public schema`);
    assert.equal(validateAnswerKeyDataset(answerData).valid, true, `${testId} answer schema`);
    assert.equal(validateDatasetConsistency(publicData, answerData).valid, true, `${testId} public/answer consistency`);
    assert.equal(publicData.metadata.testId, testId);
    assert.equal(publicData.metadata.sourceType, "edulife");
    assert.equal(publicData.metadata.isOfficialBritishCouncil, false);
    assert.equal(publicData.metadata.isComplete, true);

    assert.equal(publicData.grammarVocabulary.grammar.questions.length, 25);
    assert.equal(publicData.grammarVocabulary.vocabulary.sets.length, 5);
    assert.equal(publicData.reading.parts.length, 4);
    assert.equal(publicData.listening.parts.length, 4);
    assert.equal(publicData.writing.parts.length, 4);
    assert.equal(publicData.speaking.parts.length, 4);
    assert.equal(publicData.speaking.parts[1].questions.length, 3);
    assert.equal(publicData.speaking.parts[2].questions.length, 3);
    assert.equal(publicData.speaking.parts[1].imageUrl.startsWith("/images/speaking/aptis-4skills/"), true);
    assert.equal(publicData.speaking.parts[2].images.image1Url.startsWith("/images/speaking/aptis-4skills/"), true);
    assert.equal(publicData.speaking.parts[2].images.image2Url.startsWith("/images/speaking/aptis-4skills/"), true);

    const blocks = manifest.blocks as Array<Record<string, any>>;
    assert.equal(blocks.length, 20, `${testId} source listening block count`);
    assert.deepEqual(
      [1, 2, 3, 4].map((part) => blocks.filter((block) => block.part === part).length),
      [13, 4, 1, 2],
      `${testId} source listening structure`
    );

    for (let index = 0; index < blocks.length; index += 1) {
      const block = blocks[index];
      assert.ok(block.clipStart < block.clipEnd, `${testId} block ${index + 1} has invalid clip bounds`);
      assert.ok(block.audioSha256 && /^[a-f0-9]{64}$/.test(block.audioSha256), `${testId} block ${index + 1} missing audio hash`);
      assert.ok(block.url.startsWith("/audio/listening/aptis-4skills/"), `${testId} block URL escaped source namespace`);
      assert.equal(block.nextBlockSpeechOutsideClip, true, `${testId} block ${index + 1} contains next speech`);
      if (index > 0) {
        assert.ok(block.clipStart >= blocks[index - 1].clipEnd, `${testId} listening clips overlap at ${index}`);
      }

      const assetPath = path.join(PROJECT_ROOT, "public", block.url.slice(1));
      assert.ok(fs.existsSync(assetPath), `${testId} missing generated audio ${block.url}`);
      const bytes = fs.readFileSync(assetPath);
      assert.ok(bytes.length > 1000, `${testId} generated audio is empty ${block.url}`);
      assert.equal(sha256(bytes), block.audioSha256, `${testId} generated audio hash mismatch ${block.url}`);
    }

    assert.equal(manifest.partAudio[1].url.endsWith("/part-1/task-all.mp3"), true);
    assert.equal(manifest.partAudio[2].url.endsWith("/part-2/task-all.mp3"), true);
    assert.equal(manifest.partAudio[3].url.endsWith("/part-3/task-all.mp3"), true);
    assert.equal(manifest.partAudio[4].url.endsWith("/part-4/task-all.mp3"), true);

    const p1 = publicData.listening.parts[0].tasks;
    assert.equal(p1.length, 13);
    assert.deepEqual(p1.map((task: any) => task.questionNumber), Array.from({ length: 13 }, (_, i) => i + 1));
    assert.equal(p1.every((task: any) => task.audio?.url && task.audio?.start < task.audio?.end), true);
    assert.equal(
      p1.some((task: any) => String(task.questionText).includes("Câu 14")),
      false,
      `${testId} Listening Part 1 leaked a non-source question into the 13-question block`
    );
  }

  // The source alignment deliberately keeps the one known ASR coverage gap
  // uncertain; this assertion prevents a future generator run from silently
  // upgrading it without new evidence.
  const t2Manifest = JSON.parse(fs.readFileSync(
    path.join(PROJECT_ROOT, "data", "source-ingestion", "aptis-4skills", "audio", "aptis-4skills-02.json"),
    "utf8"
  ));
  const t2SpeakerC = t2Manifest.blocks.find((block: any) => block.part === 2 && block.index === 3);
  assert.equal(t2SpeakerC.status, "UNCERTAIN", "T02 Listening Part 2 Speaker C requires source/audio review");

  console.log("  ✓ 7 public datasets, answer keys, 140 source blocks, and generated media are mutually consistent.");
  return true;
}

function sha256(bytes: Buffer): string {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

if (process.argv[1]?.endsWith("aptis-4skills-ingestion.test.ts")) {
  runAptis4SkillsIngestionTests();
}
