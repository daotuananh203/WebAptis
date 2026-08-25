import fs from "fs";
import path from "path";
import assert from "assert/strict";
import {
  validatePublicDataset,
  validateAnswerKeyDataset,
  validateDatasetConsistency,
} from "../lib/exam/schema/validator";

export function runDatasetValidationTest(): boolean {
  console.log("▶ [TEST 1] Running Schema & Dataset Validation...");

  const publicDataPath = path.join(import.meta.dirname, "../data/tests/aptis-b2-01-public.json");
  const answersDataPath = path.join(import.meta.dirname, "../data/tests/aptis-b2-01-answers.json");

  if (!fs.existsSync(publicDataPath)) {
    console.error("❌ FAILED: aptis-b2-01-public.json does not exist at:", publicDataPath);
    return false;
  }
  if (!fs.existsSync(answersDataPath)) {
    console.error("❌ FAILED: aptis-b2-01-answers.json does not exist at:", answersDataPath);
    return false;
  }

  const publicData = JSON.parse(fs.readFileSync(publicDataPath, "utf-8"));
  const answersData = JSON.parse(fs.readFileSync(answersDataPath, "utf-8"));

  // 1. Validate Public Dataset
  const publicValidation = validatePublicDataset(publicData);
  if (!publicValidation.valid) {
    console.error("❌ FAILED: Public Dataset validation failed with errors:");
    publicValidation.errors?.forEach((err) => console.error("  -", err));
    return false;
  }
  console.log("  ✓ Public dataset conforms to AptisPublicTestDatasetSchema");

  // 2. Validate Speaking Structure Rigorously
  const spkParts = publicData.speaking.parts;
  assert.equal(spkParts.length, 4, "Speaking must have 4 parts");

  // Part 1: 3 questions, 30s each
  assert.equal(spkParts[0].questions.length, 3);
  spkParts[0].questions.forEach((q: any) => assert.equal(q.responseTimeSeconds, 30));

  // Part 2: 1 image, 3 questions, 45s each
  assert.ok(spkParts[1].imageUrl, "Part 2 must have 1 image");
  assert.equal(spkParts[1].questions.length, 3, "Part 2 must have 3 distinct questions");
  spkParts[1].questions.forEach((q: any) => assert.equal(q.responseTimeSeconds, 45));

  // Part 3: 2 images, 3 questions, 45s each
  assert.ok(spkParts[2].images.image1Url && spkParts[2].images.image2Url, "Part 3 must have 2 images");
  assert.equal(spkParts[2].questions.length, 3, "Part 3 must have 3 distinct questions");
  spkParts[2].questions.forEach((q: any) => assert.equal(q.responseTimeSeconds, 45));

  // Part 4: 3 questions, 60s prep, 120s response
  assert.equal(spkParts[3].questions.length, 3, "Part 4 must have 3 questions");
  assert.equal(spkParts[3].preparationTimeSeconds, 60);
  assert.equal(spkParts[3].responseTimeSeconds, 120);
  console.log("  ✓ Speaking format structure (Parts 1–4 question counts & timings) verified 100% compliant");

  // 3. Validate Answer Key Dataset
  const answersValidation = validateAnswerKeyDataset(answersData);
  if (!answersValidation.valid) {
    console.error("❌ FAILED: Answer Key Dataset validation failed with errors:");
    answersValidation.errors?.forEach((err) => console.error("  -", err));
    return false;
  }
  console.log("  ✓ Answer key dataset conforms to ServerAnswerKeySchema");

  // 4. Cross-validate Consistency
  const consistencyValidation = validateDatasetConsistency(publicData, answersData);
  if (!consistencyValidation.valid) {
    console.error("❌ FAILED: Dataset consistency check failed with errors:");
    consistencyValidation.errors?.forEach((err) => console.error("  -", err));
    return false;
  }
  console.log("  ✓ Public data and Server Answer Key are 100% consistent across all question IDs");

  console.log("✅ [TEST 1 PASSED] Dataset Validation Test completed successfully.\n");
  return true;
}
