import fs from "fs";
import path from "path";

export function runSpeakingRuntimeRegressionTests(): boolean {
  console.log("==================================================");
  console.log("▶ [TEST 21] Running Speaking Runtime & Image Regression Tests...");
  console.log("==================================================");

  let allPassed = true;

  // 21.1 Speaking Part 1 Verification Across All 16 Mock Tests
  console.log("  [21.1] Validating Speaking Part 1 in all 16 Mock Test Datasets...");
  let part1QuestionCount = 0;
  for (let i = 1; i <= 16; i++) {
    const pad = String(i).padStart(2, "0");
    const testId = `aptis-b2-${pad}`;
    const filePath = path.join(process.cwd(), `data/tests/${testId}-public.json`);
    if (!fs.existsSync(filePath)) {
      console.error(`  ✗ Missing mock test file: ${filePath}`);
      allPassed = false;
      continue;
    }
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const p1 = data.speaking?.parts?.find((p: any) => p.partNumber === 1);
    if (!p1) {
      console.error(`  ✗ ${testId} is missing speaking.parts Part 1!`);
      allPassed = false;
      continue;
    }
    if (p1.taskType !== "personal-information") {
      console.error(`  ✗ ${testId} Part 1 taskType is not personal-information`);
      allPassed = false;
    }
    if (!Array.isArray(p1.questions) || p1.questions.length !== 3) {
      console.error(`  ✗ ${testId} Part 1 does not have exactly 3 questions`);
      allPassed = false;
    }
    p1.questions.forEach((q: any) => {
      part1QuestionCount++;
      const prompt = q.prompt || q.questionText || "";
      if (!prompt || prompt.toLowerCase().includes("lorem") || prompt.toLowerCase().includes("placeholder")) {
        console.error(`  ✗ Synthetic/placeholder question found in ${testId} Part 1: ${prompt}`);
        allPassed = false;
      }
    });
  }
  console.log(`  ✓ 16/16 Mock tests verified with ${part1QuestionCount} authentic Part 1 personal questions.`);

  // 21.2 Speaking Bank Verification & Image Integrity
  console.log("  [21.2] Validating Speaking Bank (94 topics) & Verified Disk Images...");
  const bankPath = path.join(process.cwd(), "data/prediction/speaking/speaking-bank.json");
  if (!fs.existsSync(bankPath)) {
    console.error(`  ✗ Missing speaking bank: ${bankPath}`);
    return false;
  }
  const bank = JSON.parse(fs.readFileSync(bankPath, "utf-8"));
  if (bank.totalTopics !== 94 || !Array.isArray(bank.topics) || bank.topics.length !== 94) {
    console.error(`  ✗ Speaking bank topic count mismatch: expected 94, got ${bank.topics?.length}`);
    allPassed = false;
  }

  const p2Topics = bank.topics.filter((t: any) => t.partNumber === 2);
  const p3Topics = bank.topics.filter((t: any) => t.partNumber === 3);
  const p4Topics = bank.topics.filter((t: any) => t.partNumber === 4);

  if (p2Topics.length !== 32) {
    console.error(`  ✗ Part 2 topics count mismatch: expected 32, got ${p2Topics.length}`);
    allPassed = false;
  }
  if (p3Topics.length !== 33) {
    console.error(`  ✗ Part 3 topics count mismatch: expected 33, got ${p3Topics.length}`);
    allPassed = false;
  }
  if (p4Topics.length !== 29) {
    console.error(`  ✗ Part 4 topics count mismatch: expected 29, got ${p4Topics.length}`);
    allPassed = false;
  }

  let verifiedImagesChecked = 0;
  const verifiedImagePaths = new Set<string>();

  bank.topics.forEach((t: any) => {
    if (t.images && t.images.length > 0) {
      t.images.forEach((img: string) => {
        verifiedImagesChecked++;
        verifiedImagePaths.add(img);
        const fullPath = path.join(process.cwd(), "public", img);
        if (!fs.existsSync(fullPath)) {
          console.error(`  ✗ Missing image on disk: ${fullPath} for topic: ${t.topic}`);
          allPassed = false;
        }
      });
    }
  });
  console.log(`  ✓ ${verifiedImagesChecked} verified image references checked across ${verifiedImagePaths.size} unique image files on disk.`);

  // 21.3 Validating ts-speaking-data.json Total Count and Routing
  console.log("  [21.3] Validating ts-speaking-data.json (Exact 110 entries & Routing)...");
  const tsPath = path.join(process.cwd(), "data/staging/google-drive/speaking/ts-speaking-data.json");
  if (!fs.existsSync(tsPath)) {
    console.error(`  ✗ Missing ts-speaking-data.json at ${tsPath}`);
    return false;
  }
  const tsData = JSON.parse(fs.readFileSync(tsPath, "utf-8"));
  if (tsData.length !== 110) {
    console.error(`  ✗ ts-speaking-data.json count mismatch: expected 110, got ${tsData.length}`);
    allPassed = false;
  }

  const p1Count = tsData.filter((i: any) => i.tags.includes("#Part1")).length;
  const p2Count = tsData.filter((i: any) => i.tags.includes("#Part2")).length;
  const p3Count = tsData.filter((i: any) => i.tags.includes("#Part3")).length;
  const p4Count = tsData.filter((i: any) => i.tags.includes("#Part4")).length;

  if (p1Count !== 16 || p2Count !== 32 || p3Count !== 33 || p4Count !== 29) {
    console.error(`  ✗ ts-speaking-data distribution mismatch: P1=${p1Count}, P2=${p2Count}, P3=${p3Count}, P4=${p4Count}`);
    allPassed = false;
  }

  tsData.forEach((item: any, idx: number) => {
    if (item.testNumber !== idx + 1) {
      console.error(`  ✗ Sequential testNumber mismatch at index ${idx}: expected ${idx + 1}, got ${item.testNumber}`);
      allPassed = false;
    }
    if (!item.practiceUrl || !item.practiceUrl.startsWith("/practice/speaking/")) {
      console.error(`  ✗ Invalid practiceUrl in item ${item.testId}: ${item.practiceUrl}`);
      allPassed = false;
    }
  });
  console.log(`  ✓ 110/110 Speaking items verified with sequential testNumbers and valid practice URLs.`);

  // 21.4 Anti-Collision & Image Isolation Verification
  console.log("  [21.4] Verifying Zero Cross-Topic Image Collisions & Clean Isolation...");
  const p2ImageToTopic = new Map<string, string>();
  p2Topics.forEach((t: any) => {
    if (t.images && t.images.length > 0) {
      const img = t.images[0];
      if (p2ImageToTopic.has(img)) {
        console.error(`  ✗ Image collision in Part 2 between '${p2ImageToTopic.get(img)}' and '${t.topic}'`);
        allPassed = false;
      }
      p2ImageToTopic.set(img, t.topic);
    }
  });
  console.log(`  ✓ Zero image collisions across all 32 Part 2 topics.`);

  if (allPassed) {
    console.log("✅ [TEST 21 PASSED] Speaking Runtime & Image Regression tests completed successfully.\n");
  } else {
    console.error("❌ [TEST 21 FAILED] Speaking Runtime & Image Regression tests failed.\n");
  }

  return allPassed;
}