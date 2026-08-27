import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import sharp from "sharp";

const ROOT = process.cwd();
const DOC_URL =
  "https://docs.google.com/document/d/1wsV6frhcqDHFMNWApkw0wl37C_HI7Zv9480r9ClAq1c/edit?tab=t.0#heading=h.gttuz9g05tb0";
const OUTPUT = path.join(ROOT, "data", "audits", "google-doc-speaking-image-inventory.json");
const PUBLIC = path.join(ROOT, "public");
const CANDIDATE_DIR = path.join(PUBLIC, "images", "speaking", "gdrive");
const MANIFEST = path.join(CANDIDATE_DIR, "manifest.json");
const BANK = path.join(ROOT, "data", "prediction", "speaking", "speaking-bank.json");

type Candidate = {
  path: string;
  filename: string;
  sha256: string;
  width: number;
  height: number;
  sourcePosition: number | null;
  sourceTopic?: string;
  sourcePart?: number;
};

function sha256(data: Buffer) {
  return crypto.createHash("sha256").update(data).digest("hex");
}

async function visualSignature(data: Buffer) {
  const { data: pixels, info } = await sharp(data)
    .resize(32, 32, { fit: "fill" })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const mean = [...pixels].reduce((sum, value) => sum + value, 0) / pixels.length;
  return { mean, values: [...pixels], channels: info.channels };
}

function visualDistance(a: { mean: number; values: number[] }, b: { mean: number; values: number[] }) {
  if (a.values.length !== b.values.length) return Number.POSITIVE_INFINITY;
  const meanAdjustedA = a.values.map((value) => value - a.mean);
  const meanAdjustedB = b.values.map((value) => value - b.mean);
  const mse = meanAdjustedA.reduce((sum, value, index) => sum + (value - meanAdjustedB[index]) ** 2, 0) / a.values.length;
  return Math.sqrt(mse);
}

async function main() {
  const manifest = JSON.parse(await fs.readFile(MANIFEST, "utf8")) as Record<string, any>;
  const bank = JSON.parse(await fs.readFile(BANK, "utf8")) as { topics: any[] };
  const manifestEntries = Object.values(manifest);
  const manifestByPath = new Map(manifestEntries.map((entry: any, index) => [entry.localPath.replace(/^\//, ""), { entry, sourcePosition: index + 1 }]));

  const localCandidates: Candidate[] = [];
  const localSignatures = new Map<string, { mean: number; values: number[] }>();
  for (const filename of (await fs.readdir(CANDIDATE_DIR)).filter((name) => name.toLowerCase().endsWith(".jpg")).sort()) {
    const absolute = path.join(CANDIDATE_DIR, filename);
    const data = await fs.readFile(absolute);
    const metadata = await sharp(data).metadata();
    const relative = path.relative(PUBLIC, absolute).replaceAll(path.sep, "/");
    const manifestRecord = manifestByPath.get(relative);
    localCandidates.push({
      path: `/${relative}`,
      filename,
      sha256: sha256(data),
      width: metadata.width ?? 0,
      height: metadata.height ?? 0,
      sourcePosition: manifestRecord?.sourcePosition ?? null,
      sourceTopic: manifestRecord?.entry?.topic,
      sourcePart: manifestRecord?.entry?.part,
    });
    localSignatures.set(filename, await visualSignature(data));
  }

  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(DOC_URL, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForTimeout(10_000);

  const model = await page.evaluate(() => {
    const scripts = [...document.scripts]
      .map((script) => script.textContent ?? "")
      .filter((text) => text.startsWith("DOCS_modelChunk = "));
    const chunks = scripts
      .map((text) => JSON.parse(text.slice("DOCS_modelChunk = ".length, text.indexOf("; DOCS_modelChunkLoadStart"))))
      .flatMap((chunk) => chunk.chunk ?? []);
    const documentText = chunks.filter((item: any) => item.ty === "is").map((item: any) => item.s).join("");
    const positions = new Map(chunks.filter((item: any) => item.ty === "te").map((item: any) => [item.id, item.spi]));
    const html = document.documentElement.outerHTML;
    const urls: Record<string, string> = {};
    const re = /"(s-blob-v1-IMAGE-[^"]+)":"([^"]+)"/g;
    let match: RegExpExecArray | null;
    while ((match = re.exec(html))) {
      urls[match[1]] = match[2]
        .replaceAll("\\u003d", "=")
        .replaceAll("\\u0026", "&")
        .replaceAll("\\u002f", "/");
    }
    const images = chunks
      .filter((item: any) => item.ty === "ae" && item.epm?.ee_eo?.i_cid)
      .map((item: any) => ({
        objectId: item.id,
        imageCid: item.epm.ee_eo.i_cid,
        documentPosition: positions.get(item.id) ?? null,
        widthInDocument: item.epm.ee_eo.i_wth ?? null,
        heightInDocument: item.epm.ee_eo.i_ht ?? null,
        sourceUrl: urls[item.epm.ee_eo.i_cid] ?? null,
      }))
      .sort((a: any, b: any) => (a.documentPosition ?? 0) - (b.documentPosition ?? 0));
    return { documentText, images, sectionPositions: { part2: documentText.indexOf("Part 2"), part3: documentText.indexOf("Part 3"), part4: documentText.indexOf("Part 4") } };
  });

  const sourceImages = [];
  for (const [index, image] of model.images.entries()) {
    if (!image.sourceUrl) {
      sourceImages.push({ sourceOrder: index + 1, ...image, status: "UNCERTAIN", reason: "Google Docs image URL not exposed" });
      continue;
    }
    const response = await context.request.get(image.sourceUrl);
    const data = await response.body();
    const metadata = await sharp(data).metadata();
    const signature = await visualSignature(data);
    const nearest = localCandidates
      .map((candidate) => ({ candidate, distance: visualDistance(signature, localSignatures.get(candidate.filename)!) }))
      .sort((a, b) => a.distance - b.distance)[0];
    const position = image.documentPosition ?? -1;
    const part = position >= model.sectionPositions.part4 ? 4 : position >= model.sectionPositions.part3 ? 3 : 2;
    sourceImages.push({
      sourceOrder: index + 1,
      ...image,
      part,
      httpStatus: response.status(),
      contentType: response.headers()["content-type"] ?? null,
      sha256: sha256(data),
      byteLength: data.length,
      width: metadata.width ?? 0,
      height: metadata.height ?? 0,
      nearestLocalCandidate: nearest?.candidate.filename ?? null,
      nearestLocalVisualDistance: nearest?.distance ?? null,
      sourceTextBefore: model.documentText.slice(Math.max(0, position - 180), Math.max(0, position)).replaceAll("\n", "↵"),
      sourceTextAfter: model.documentText.slice(position, position + 220).replaceAll("\n", "↵"),
      status: response.status() === 200 ? "EXTRACTED" : "UNCERTAIN",
    });
  }

  const candidateByTopic = bank.topics.map((topic, index) => ({
    candidateId: topic.candidateId,
    part: topic.partNumber,
    topic: topic.topic,
    images: topic.images,
    sourceOrder: index + 1,
    sourceArtifact: "data/prediction/speaking/speaking-bank.json",
  }));

  const output = {
    generatedAt: new Date().toISOString(),
    sourceDocument: { id: "1wsV6frhcqDHFMNWApkw0wl37C_HI7Zv9480r9ClAq1c", title: "Tổng hợp Speaking 2026", url: DOC_URL, access: "read-only browser inspection" },
    extractionMethod: ["Chrome channel via Playwright", "DOCS_modelChunk XML-equivalent document model", "embedded image CID → docs-images-rt URL map", "source document position and nearby text"],
    documentStructure: model.sectionPositions,
    sourceImages,
    candidateImageInventory: localCandidates,
    candidateBankRelationships: candidateByTopic,
    standardMapping: {
      status: "UNCERTAIN",
      reason: "The Google Doc has Part 2/Part 3 topic sections but no standard test IDs or task IDs aptis-b2-01..16/t01_s2/t01_s3. It therefore authenticates candidate-topic → embedded-image relationships, not standard-test → topic relationships.",
      standardTasksWithAuthoritativeMapping: 0,
      standardTasksNeedingEvidence: 32,
    },
    summary: {
      embeddedImages: sourceImages.length,
      extractedImages: sourceImages.filter((image: any) => image.status === "EXTRACTED").length,
      part2EmbeddedImages: sourceImages.filter((image: any) => image.part === 2).length,
      part3EmbeddedImages: sourceImages.filter((image: any) => image.part === 3).length,
      part4EmbeddedImages: sourceImages.filter((image: any) => image.part === 4).length,
      localCandidates: localCandidates.length,
      candidateTopics: candidateByTopic.length,
      standardTaskMappings: 0,
      verdict: "SPEAKING IMAGE MAPPING PARTIALLY VERIFIED",
    },
  };
  await fs.mkdir(path.dirname(OUTPUT), { recursive: true });
  await fs.writeFile(OUTPUT, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  await browser.close();
  console.log(JSON.stringify(output.summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
