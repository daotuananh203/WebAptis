import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { resolveSpeakingImageUrl } from "../lib/speaking/image-availability";

type Mapping = {
  testId: string;
  part: number;
  sourceTaskId: string;
  prompt: string[];
  imagePaths: string[];
  sourceEvidence: {
    sourceRelationshipStatus: string;
    embeddedImagePlacements: unknown[];
  };
  imageInventory: Array<{
    path: string;
    sha256: string;
    width: number;
    height: number;
    derivation?: {
      type: string;
      parentSourceSha256?: string;
      parentSha256?: string;
    };
  }>;
  confidence: string;
  status: string;
  assignmentMethod: string;
};

/**
 * Integrity test for the source-backed reconstruction.  It deliberately
 * checks dataset, manifest, public bytes, and examiner-visible paths together;
 * an HTTP 200 by itself would not prove the task/image relationship.
 */
export function runSpeakingImageMappingTests(): boolean {
  console.log("▶ [TEST] Running Speaking source-backed image mapping tests...");

  const manifestPath = path.join(process.cwd(), "data/speaking/canonical-speaking-mapping.json");
  assert.ok(fs.existsSync(manifestPath), "Canonical Speaking mapping manifest must exist");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

  assert.equal(manifest.mappingKind, "source-backed-reconstruction");
  assert.equal(manifest.historicalStandardMapping, "NOT_RECOVERED");
  assert.equal(manifest.standardMappings.length, 32);
  assert.equal(manifest.imageInventory.length, 48);
  assert.equal(manifest.summary.standardPart2.verifiedSourceBacked, 16);
  assert.equal(manifest.summary.standardPart3.verifiedSourceBacked, 16);

  const mappings = manifest.standardMappings as Mapping[];
  const mappedPaths = new Set<string>();

  for (let testNumber = 1; testNumber <= 16; testNumber += 1) {
    const testId = `aptis-b2-${testNumber.toString().padStart(2, "0")}`;
    const datasetPath = path.join(process.cwd(), `data/tests/${testId}-public.json`);
    const dataset = JSON.parse(fs.readFileSync(datasetPath, "utf8"));

    for (const part of [2, 3]) {
      const mapping = mappings.find((item) => item.testId === testId && item.part === part);
      assert.ok(mapping, `${testId} Part ${part} must have a canonical mapping`);
      assert.equal(mapping.status, "RECONSTRUCTED");
      assert.equal(mapping.confidence, "HIGH");
      assert.equal(mapping.assignmentMethod, "stable-sha256-slot-assignment");
      assert.equal(mapping.sourceEvidence.sourceRelationshipStatus, "VERIFIED");
      assert.ok(mapping.sourceEvidence.embeddedImagePlacements.length > 0);
      assert.equal(mapping.prompt.length, 3);

      const dataPart = dataset.speaking.parts[part - 1];
      const actualPaths = part === 2
        ? [dataPart.imageUrl]
        : [dataPart.images.image1Url, dataPart.images.image2Url];
      assert.deepEqual(actualPaths, mapping.imagePaths, `${testId} Part ${part} dataset must match manifest`);
      assert.deepEqual(
        dataPart.questions.map((question: { prompt: string }) => question.prompt),
        mapping.prompt,
        `${testId} Part ${part} source prompts must match manifest`
      );

      for (const imagePath of mapping.imagePaths) {
        assert.equal(isPlaceholder(imagePath), false, `${testId} Part ${part} cannot use a placeholder image`);
        assert.equal(imagePath.includes("/gdrive/"), false, `${testId} Part ${part} must use a stable public asset name`);
        assert.equal(resolveSpeakingImageUrl(imagePath), imagePath);
        assert.equal(mappedPaths.has(imagePath), false, `Image path reused unexpectedly: ${imagePath}`);
        mappedPaths.add(imagePath);

        const filePath = path.join(process.cwd(), "public", imagePath.slice(1));
        assert.ok(fs.existsSync(filePath), `Public image is missing: ${imagePath}`);
        const stat = fs.statSync(filePath);
        assert.ok(stat.isFile() && stat.size > 100, `Public image is empty: ${imagePath}`);

        const inventory: Mapping["imageInventory"][number] | undefined =
          mapping.imageInventory.find((item) => item.path === imagePath);
        assert.ok(inventory, `Image inventory is missing ${imagePath}`);
        assert.ok(inventory.width > 0 && inventory.height > 0);
        assert.match(inventory.sha256, /^[a-f0-9]{64}$/);
        assert.match(
          inventory.derivation?.parentSourceSha256 ?? "",
          /^[a-f0-9]{64}$/,
          `Missing source SHA provenance for ${imagePath}`
        );
        if (inventory.derivation?.type === "source-asset") {
          assert.equal(inventory.sha256, inventory.derivation.parentSourceSha256);
        }
      }
    }
  }

  assert.equal(mappedPaths.size, 48, "Standard Speaking Part 2/3 must expose 48 distinct public image paths");
  assert.ok(manifest.practiceBank.topics.length >= 65, "Imported source topics must remain in the Practice Bank");
  assert.equal(
    manifest.practiceBank.topics.filter((topic: { available: boolean }) => topic.available).length,
    manifest.practiceBank.topics.length - 32
  );

  console.log("  ✓ 16 Part 2 + 16 Part 3 mappings, 48 public assets, and source provenance verified.");
  return true;
}

function isPlaceholder(imagePath: unknown): boolean {
  return typeof imagePath === "string" && /^\/images\/speaking\/test_\d{2}_part(?:2|3)(?:_[ab])?\./.test(imagePath);
}

if (process.argv[1]?.endsWith("speaking-image-mapping.test.ts")) {
  runSpeakingImageMappingTests();
}
