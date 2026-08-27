import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { isSpeakingImagePlaceholder, resolveSpeakingImageUrl } from "../lib/speaking/image-availability";
import { resolveSpeakingTaskContext } from "../lib/grading/speaking-ai";

/**
 * Runtime contract for the source-backed Speaking image reconstruction.
 * The canonical manifest owns the provenance; this test ensures the public
 * datasets and AI task context actually consume those public assets.
 */
export function runSpeakingImageAvailabilityTests(): boolean {
  const testsDir = path.join(process.cwd(), "data/tests");
  let checked = 0;

  for (let testNumber = 1; testNumber <= 16; testNumber += 1) {
    const testId = `aptis-b2-${testNumber.toString().padStart(2, "0")}`;
    const datasetPath = path.join(testsDir, `${testId}-public.json`);
    const dataset = JSON.parse(fs.readFileSync(datasetPath, "utf8"));
    const speakingParts = dataset.speaking.parts;
    const part2 = speakingParts.find((part: any) => part.partNumber === 2);
    const part3 = speakingParts.find((part: any) => part.partNumber === 3);

    assert.ok(part2 && part3, `${testId} must contain Speaking Parts 2 and 3`);
    assert.equal(isSpeakingImagePlaceholder(part2.imageUrl), false, `${testId} Part 2 must use a source-backed asset`);
    assert.equal(resolveSpeakingImageUrl(part2.imageUrl), part2.imageUrl, `${testId} Part 2 image must be a valid public path`);
    assert.equal(isSpeakingImagePlaceholder(part3.images.image1Url), false, `${testId} Part 3 image A must use a source-backed asset`);
    assert.equal(isSpeakingImagePlaceholder(part3.images.image2Url), false, `${testId} Part 3 image B must use a source-backed asset`);
    assert.equal(resolveSpeakingImageUrl(part3.images.image1Url), part3.images.image1Url);
    assert.equal(resolveSpeakingImageUrl(part3.images.image2Url), part3.images.image2Url);

    const part2Context = resolveSpeakingTaskContext(testId, 2);
    const part3Context = resolveSpeakingTaskContext(testId, 3);
    assert.deepEqual(part2Context.imageUrls, [part2.imageUrl], `${testId} Part 2 AI context must match the UI asset`);
    assert.deepEqual(part3Context.imageUrls, [part3.images.image1Url, part3.images.image2Url], `${testId} Part 3 AI context must match both UI assets`);
    checked += 3;
  }

  assert.equal(resolveSpeakingImageUrl("https://example.com/private.jpg"), null);
  assert.equal(resolveSpeakingImageUrl("/images/speaking/test_01_part2.jpg?cache=old"), null);
  assert.equal(resolveSpeakingImageUrl("/images/speaking/gdrive/verified-candidate.jpg"), "/images/speaking/gdrive/verified-candidate.jpg");

  console.log(`  ✓ Speaking image availability contract checked ${checked} standard Part 2/3 references.`);
  return true;
}

if (process.argv[1]?.endsWith("speaking-image-availability.test.ts")) {
  runSpeakingImageAvailabilityTests();
}
