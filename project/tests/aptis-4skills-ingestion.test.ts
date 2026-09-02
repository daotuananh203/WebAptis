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

// These records were transcribed from the source PDF's Listening pages, not
// inferred from the generated JSON. They cover the page/column boundaries
// that previously produced blank prompts and split Part 4 choices.
const SOURCE_RECOVERED_LISTENING: Record<string, {
  part1Prompt: [string, string];
  part4Options: Record<string, string[]>;
}> = {
  "aptis-4skills-01": {
    part1Prompt: ["t4s01_l1_q03", "A finance expert is giving advice to young people. What shouldn't they do?"],
    part4Options: { t4s01_l4_m2_q2: ["Should consider sports as a mandatory subject.", "Provides them with a balance in their lives.", "Keep students focused on academic subjects."] },
  },
  "aptis-4skills-02": {
    part1Prompt: ["t4s02_l1_q07", "Listen to an auction man talking about a cabinet. Which part of the cabinet is original?"],
    part4Options: {
      t4s02_l4_m1_q2: ["New seasons will be produced due to great demand.", "It inspires young filmmakers to follow a new movie-making style.", "Series are damaged by overexposure."],
      t4s02_l4_m2_q1: ["It helps to reach new customers.", "Advertisements might sometimes be repetitive which is annoying.", "Advertising costs the same amount of money to produce a movie."],
    },
  },
  "aptis-4skills-03": {
    part1Prompt: ["t4s03_l1_q13", "A man is calling his teacher to meet for the assignment. When is the meeting?"],
    part4Options: {},
  },
  "aptis-4skills-04": {
    part1Prompt: ["t4s04_l1_q13", "Listen to a tour guide introducing the tour. Where will tea be served?"],
    part4Options: { t4s04_l4_m1_q2: ["More opportunities for networking", "More competitive", "Many jobs offer great benefits"] },
  },
  "aptis-4skills-05": {
    part1Prompt: ["t4s05_l1_q13", "Listen to a principal talking about new school facilities. What new facility will the school have?"],
    part4Options: {
      t4s05_l4_m1_q1: ["Saving a large amount only on a daily basis.", "Organizing their resources more effectively", "Use credit cards to manage expenses"],
      t4s05_l4_m1_q2: ["Get advice from people that have experience", "Keep all your savings in a single account", "Avoid making any long-term financial plans"],
    },
  },
  "aptis-4skills-06": {
    part1Prompt: ["t4s06_l1_q09", "A man is giving directions to a friend about how to get to the football club. The football club is near."],
    part4Options: {
      t4s06_l4_m2_q1: ["It is focused on technical details", "It is exciting to read", "It is more of a textbook than a biography"],
      t4s06_l4_m2_q2: ["It has been written for a general audience", "It is only suitable for experts in the field", "It lacks engaging storytelling"],
    },
  },
  "aptis-4skills-07": {
    part1Prompt: ["t4s07_l1_q12", "Louis is having dinner in a new restaurant. What is his opinion about that restaurant?"],
    part4Options: {
      t4s07_l4_m2_q1: ["It is focused on technical details", "It is exciting to read", "It is more of a textbook than a biography"],
      t4s07_l4_m2_q2: ["It has been written for a general audience", "It is only suitable for experts in the field", "It lacks engaging storytelling"],
    },
  },
};

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
    assert.equal(publicData.metadata.sourceType, "user-provided");
    assert.equal(publicData.metadata.sourceName, "User-provided APTIS four-skills source bundle (PDF + transcript + MP3)");
    assert.equal(publicData.metadata.isOfficialBritishCouncil, false);
    assert.equal(publicData.metadata.isComplete, testId !== "aptis-4skills-02");
    assert.equal(publicData.metadata.audioStatus, testId === "aptis-4skills-02" ? "missing" : "available");

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
      p1.every((task: any) => Array.isArray(task.options) && task.options.length === 3),
      true,
      `${testId} Listening Part 1 must preserve three source options per question`
    );
    assert.equal(
      p1.some((task: any) => task.options.some((option: string) => /(?:is talking|is calling|tour guide|finance expert)/i.test(option))),
      false,
      `${testId} Listening Part 1 option parser leaked question prose into an option`
    );
    assert.equal(
      p1.some((task: any) => task.options.some((option: string) => /\s+D\.?\s*$/.test(option))),
      false,
      `${testId} Listening Part 1 option parser leaked the source PDF's blank D marker`
    );
    if (testId === "aptis-4skills-03") assert.equal(p1[1].options[2], "1500 years");
    if (testId === "aptis-4skills-05") assert.equal(p1[8].options[2], "22");
    if (testId === "aptis-4skills-07") assert.equal(p1[0].options[2], "20 minutes");
    assert.equal(
      p1.some((task: any) => String(task.questionText).includes("Câu 14")),
      false,
      `${testId} Listening Part 1 leaked a non-source question into the 13-question block`
    );
    assert.equal(
      p1.every((task: any) => typeof task.questionText === "string" && task.questionText.trim().length >= 20),
      true,
      `${testId} Listening Part 1 must not contain blank or truncated source prompts`
    );

    const recovered = SOURCE_RECOVERED_LISTENING[testId];
    const recoveredPrompt = p1.find((task: any) => task.id === recovered.part1Prompt[0]);
    assert.equal(recoveredPrompt?.questionText, recovered.part1Prompt[1], `${testId} source-recovered Listening Part 1 prompt`);

    const p4Questions = publicData.listening.parts[3].monologues.flatMap((monologue: any) => monologue.questions);
    assert.equal(p4Questions.length, 4, `${testId} Listening Part 4 question count`);
    for (const question of p4Questions) {
      assert.equal(question.options.length, 3, `${testId} Listening Part 4 option count for ${question.id}`);
      assert.equal(question.options.every((option: string) => option.trim().length >= 12), true, `${testId} Listening Part 4 has a split option for ${question.id}`);
      assert.ok(answerData.listening.part4[question.id], `${testId} missing Part 4 answer for ${question.id}`);
      assert.ok(question.options.includes(answerData.listening.part4[question.id]), `${testId} Part 4 answer is not one of its rendered options for ${question.id}`);
    }
    for (const [questionId, expectedOptions] of Object.entries(recovered.part4Options)) {
      const question = p4Questions.find((item: any) => item.id === questionId);
      assert.deepEqual(question?.options, expectedOptions, `${testId} source-recovered Listening Part 4 options for ${questionId}`);
    }
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
