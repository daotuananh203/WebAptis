import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { isSpeakingImagePlaceholder, resolveSpeakingImageUrl } from "../lib/speaking/image-availability";
import { resolveSpeakingTaskContext } from "../lib/grading/speaking-ai";

/**
 * Regression contract for unresolved standard Speaking image mappings.
 * This deliberately does not bless a candidate image: until a source-backed
 * bridge exists, the application must not request the generated placeholder.
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
    assert.equal(isSpeakingImagePlaceholder(part2.imageUrl), true, `${testId} Part 2 must remain explicitly unresolved`);
    assert.equal(resolveSpeakingImageUrl(part2.imageUrl), null, `${testId} Part 2 placeholder must not reach an img request`);
    assert.equal(isSpeakingImagePlaceholder(part3.images.image1Url), true, `${testId} Part 3 image A must remain explicitly unresolved`);
    assert.equal(isSpeakingImagePlaceholder(part3.images.image2Url), true, `${testId} Part 3 image B must remain explicitly unresolved`);
    assert.equal(resolveSpeakingImageUrl(part3.images.image1Url), null);
    assert.equal(resolveSpeakingImageUrl(part3.images.image2Url), null);

    const part2Context = resolveSpeakingTaskContext(testId, 2);
    const part3Context = resolveSpeakingTaskContext(testId, 3);
    assert.equal(part2Context.imageUrls, undefined, `${testId} Part 2 must not send placeholder visual context to AI`);
    assert.equal(part3Context.imageUrls, undefined, `${testId} Part 3 must not send placeholder visual context to AI`);
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
