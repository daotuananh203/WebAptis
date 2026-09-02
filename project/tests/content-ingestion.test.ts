import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { AptisPublicTestDatasetSchema, ServerAnswerKeySchema } from "../lib/exam/schema";

const TESTS_DIR = path.join(process.cwd(), "data/tests");
const INDEX_DIR = path.join(process.cwd(), "data/content-index");
const AUDIO_DIR = path.join(process.cwd(), "public/audio/listening");

export async function runContentIngestionTests() {
  console.log("\n==================================================");
  console.log("▶ [TEST 16] Running Content Ingestion & Practice Library Tests...");
  console.log("==================================================");

  // 1. Validate All 16 Ingested Public Tests against Zod Schema
  console.log("  [16.1] Validating Ingested Public Datasets (aptis-b2-01 .. aptis-b2-16)...");
  const readingPart1Texts: string[] = [];
  
  for (let i = 1; i <= 16; i++) {
    const testId = `aptis-b2-${i.toString().padStart(2, "0")}`;
    const pubFile = path.join(TESTS_DIR, `${testId}-public.json`);
    assert.ok(fs.existsSync(pubFile), `Public file must exist for ${testId}`);

    const raw = fs.readFileSync(pubFile, "utf-8");
    const json = JSON.parse(raw);

    const parseResult = AptisPublicTestDatasetSchema.safeParse(json);
    if (!parseResult.success) {
      console.error(`Schema error on ${testId}:`, parseResult.error.issues);
    }
    assert.ok(parseResult.success, `Public dataset ${testId} must conform to schema`);

    // Check specific metadata requirements
    if (i === 16 || i === 3) {
      assert.strictEqual(json.metadata.isComplete, false, `Test ${testId} must be marked incomplete`);
      assert.strictEqual(json.metadata.audioStatus, "missing", `Test ${testId} audio status must be missing`);
    } else {
      assert.strictEqual(json.metadata.isComplete, true, `Test ${testId} must be complete`);
      assert.strictEqual(json.metadata.audioStatus, "available", `Test ${testId} audio status must be available`);
    }

    assert.strictEqual(json.metadata.sourceType, "edulife", `Test ${testId} sourceType must be 'edulife'`);
    assert.strictEqual(json.metadata.isOfficialBritishCouncil, false, `Test ${testId} isOfficialBritishCouncil must be false`);

    // Collect reading part 1 text to prove uniqueness
    readingPart1Texts.push(json.reading.parts[0].textWithGaps || json.reading.parts[0].passageText);
  }
  console.log("  ✓ All 16 public test datasets conform to schema & metadata requirements.");

  // 2. Validate Content Uniqueness Across All 16 Tests (No Template Cloning)
  console.log("  [16.2] Validating Real Content Uniqueness Across All 16 Tests...");
  const uniqueReadingTexts = new Set(readingPart1Texts);
  assert.strictEqual(uniqueReadingTexts.size, 16, "All 16 tests must have distinct, authentic Reading Part 1 texts");
  console.log("  ✓ 16/16 unique authentic Reading texts verified across tests.");

  // 3. Strict Synthetic Marker Elimination Check
  console.log("  [16.3] Verifying Complete Elimination of Synthetic Markers...");
  for (let i = 1; i <= 16; i++) {
    const testId = `aptis-b2-${i.toString().padStart(2, "0")}`;
    const pubFile = path.join(TESTS_DIR, `${testId}-public.json`);
    const content = fs.readFileSync(pubFile, "utf-8");

    assert.strictEqual(content.includes("William Bell"), false, `Synthetic marker 'William Bell' must NOT be in ${testId}`);
    assert.strictEqual(content.includes("Manchester train"), false, `Synthetic marker 'Manchester train' must NOT be in ${testId}`);
  }
  console.log("  ✓ Zero synthetic clone markers found in production datasets.");

  // 4. Validate Audio Files Integrity & Test 16 Missing State
  console.log("  [16.4] Validating Real Listening Audio Mounting & Audio Integrity...");
  for (let i = 1; i <= 15; i++) {
    const audioFileName = `aptis-b2-${i.toString().padStart(2, "0")}.mp3`;
    const audioPath = path.join(AUDIO_DIR, audioFileName);
    assert.ok(fs.existsSync(audioPath), `Audio file ${audioFileName} must exist in public/audio/listening/`);
    const stats = fs.statSync(audioPath);
    assert.ok(stats.size > 10 * 1024 * 1024, `Audio file ${audioFileName} must be real audio (>10MB), size: ${stats.size}`);
  }
  const test16AudioPath = path.join(AUDIO_DIR, "aptis-b2-16.mp3");
  assert.strictEqual(fs.existsSync(test16AudioPath), false, "Test 16 must NOT have an audio file generated");
  console.log("  ✓ 15 real audio tracks (>10MB each) mounted; Test 16 audio correctly missing with no synthetic TTS.");

  // 5. Validate All 16 Server-Side Answer Keys against Schema
  console.log("  [16.5] Validating Server-Side Answer Keys...");
  for (let i = 1; i <= 16; i++) {
    const testId = `aptis-b2-${i.toString().padStart(2, "0")}`;
    const ansFile = path.join(TESTS_DIR, `${testId}-answers.json`);
    assert.ok(fs.existsSync(ansFile), `Answer file must exist for ${testId}`);

    const raw = fs.readFileSync(ansFile, "utf-8");
    const json = JSON.parse(raw);

    const parseResult = ServerAnswerKeySchema.safeParse(json);
    if (!parseResult.success) {
      console.error(`Answer key schema error on ${testId}:`, parseResult.error.issues);
    }
    assert.ok(parseResult.success, `Answer key ${testId} must conform to schema`);
  }
  console.log("  ✓ All 16 server-side answer keys conform to schema.");

  // 6. Strict Anti-Leak Verification
  console.log("  [16.6] Verifying Anti-Leak Isolation Across All 16 Tests...");
  for (let i = 1; i <= 16; i++) {
    const testId = `aptis-b2-${i.toString().padStart(2, "0")}`;
    const pubFile = path.join(TESTS_DIR, `${testId}-public.json`);
    const content = fs.readFileSync(pubFile, "utf-8");

    assert.strictEqual(content.includes("grammarAnswers"), false, `No grammarAnswers in ${testId}-public.json`);
    assert.strictEqual(content.includes("vocabularyAnswers"), false, `No vocabularyAnswers in ${testId}-public.json`);
    assert.strictEqual(content.includes("part1Answers"), false, `No part1Answers in ${testId}-public.json`);
    assert.strictEqual(content.includes("part2Order"), false, `No part2Order in ${testId}-public.json`);
    assert.strictEqual(content.includes("part3Answers"), false, `No part3Answers in ${testId}-public.json`);
    assert.strictEqual(content.includes("part4Answers"), false, `No part4Answers in ${testId}-public.json`);
  }
  console.log("  ✓ Zero answer keys leaked in public client datasets.");

  // 7. Practice Library Content Index Validation & Study Material Attribution
  console.log("  [16.7] Validating Practice Library Content Index & Source Attribution...");
  const masterIndexPath = path.join(INDEX_DIR, "index.json");
  assert.ok(fs.existsSync(masterIndexPath), "Master index.json must exist");
  const masterIndex = JSON.parse(fs.readFileSync(masterIndexPath, "utf-8"));
  assert.ok(masterIndex.totalItems >= 250, "Master index must contain at least 250 indexed items");

  const skills = ["reading", "listening", "writing", "speaking", "grammar-vocabulary"];
  for (const sk of skills) {
    const p = path.join(INDEX_DIR, `${sk}.json`);
    assert.ok(fs.existsSync(p), `${sk}.json index must exist`);
    const catalog = JSON.parse(fs.readFileSync(p, "utf-8"));
    assert.ok(catalog.items.length > 0, `${sk} catalog must have items`);
    assert.strictEqual(catalog.totalItems, catalog.items.length);
  }
  
  // Verify G&V source attribution
  const gvCatalog = JSON.parse(fs.readFileSync(path.join(INDEX_DIR, "grammar-vocabulary.json"), "utf-8"));
  for (const it of gvCatalog.items) {
    assert.strictEqual(it.sourceType, "edulife-study-material", "G&V must have source 'edulife-study-material'");
    assert.strictEqual(it.sourceName, "22-tong-quan-grammar-and-vocabulary.pptx", "G&V must attribute source file");
  }
  console.log("  ✓ G&V study material attribution and all 5 skill catalogs verified.");

  // 8. Shared Content Item Architecture (No Duplication)
  console.log("  [16.8] Verifying Shared Content Item Architecture (No Duplication)...");
  const readingCatalog = JSON.parse(fs.readFileSync(path.join(INDEX_DIR, "reading.json"), "utf-8"));
  const item = readingCatalog.items.find((it: any) => it.contentId === "aptis-b2-03-r2");
  assert.ok(item, "Reading item aptis-b2-03-r2 must be indexed");
  assert.strictEqual(item.testId, "aptis-b2-03");
  assert.strictEqual(item.partIdentifier, "part2");

  const test03 = JSON.parse(fs.readFileSync(path.join(TESTS_DIR, "aptis-b2-03-public.json"), "utf-8"));
  assert.ok(test03.reading.parts[1], "Test 03 must have reading part 2");
  assert.strictEqual(test03.reading.parts[1].taskType, item.taskType);

  console.log("  ✓ Content item sharing between Mock Test and Practice verified with zero duplicate storage.");
  console.log("✅ [TEST 16 PASSED] Content Ingestion & Practice Library tests completed successfully.");
}

if (process.argv[1]?.endsWith("content-ingestion.test.ts")) {
  runContentIngestionTests();
}
