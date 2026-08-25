import fs from "fs";
import path from "path";

const FORBIDDEN_KEYS = [
  "correctAnswer",
  "correct_answer",
  "correct",
  "answerKey",
  "answer_key",
  "solution",
  "solutions",
  "expectedAnswer",
  "expected_answer",
  "scoringRules",
  "matchingKey",
  "correctOption",
  "answerMap",
];

function findForbiddenKeys(obj: unknown, currentPath = ""): string[] {
  const leaks: string[] = [];

  if (obj === null || typeof obj !== "object") {
    return leaks;
  }

  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      leaks.push(...findForbiddenKeys(item, `${currentPath}[${index}]`));
    });
    return leaks;
  }

  const record = obj as Record<string, unknown>;
  for (const [key, value] of Object.entries(record)) {
    const fullPath = currentPath ? `${currentPath}.${key}` : key;
    const lowerKey = key.toLowerCase();

    for (const forbidden of FORBIDDEN_KEYS) {
      if (lowerKey === forbidden.toLowerCase()) {
        leaks.push(`Forbidden key detected at: ${fullPath}`);
      }
    }

    leaks.push(...findForbiddenKeys(value, fullPath));
  }

  return leaks;
}

export function runAntiLeakTest(): boolean {
  console.log("▶ [TEST 2] Running Anti-Leak Security Test on Public Dataset...");

  const publicDataPath = path.join(import.meta.dirname, "../data/tests/aptis-b2-01-public.json");
  if (!fs.existsSync(publicDataPath)) {
    console.error("❌ FAILED: aptis-b2-01-public.json does not exist at:", publicDataPath);
    return false;
  }

  const publicData = JSON.parse(fs.readFileSync(publicDataPath, "utf-8"));
  const leaks = findForbiddenKeys(publicData);

  if (leaks.length > 0) {
    console.error("❌ SECURITY VIOLATION: Private answer data detected in public dataset!");
    leaks.forEach((leak) => console.error("  -", leak));
    return false;
  }

  console.log("  ✓ No private answer keys, solutions, or scoring maps found in public dataset.");
  console.log("  ✓ Public/Private data separation verified 100% secure.");
  console.log("✅ [TEST 2 PASSED] Anti-Leak Security Test completed successfully.\n");
  return true;
}
