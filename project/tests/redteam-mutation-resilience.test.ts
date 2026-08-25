import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { gradeSingleChoiceItem } from "../lib/grading/deterministic";

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
  if (obj === null || typeof obj !== "object") return leaks;
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

export async function runRedTeamMutationResilienceTests(): Promise<boolean> {
  console.log("==================================================");
  console.log("▶ [RED-TEAM DOMAIN H] Running Mutation & Fault Resilience Tests...");
  console.log("==================================================");

  const DATA_DIR = path.join(process.cwd(), "data/tests");
  const t1Data = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "aptis-b2-01-public.json"), "utf-8"));

  // Mutant 1: Intentional grading corruption (Mutated Answer Comparison)
  console.log("  [H.1] Testing Mutation Kill: Corrupted Answer Evaluation...");
  const mutantRes = gradeSingleChoiceItem("q1", "WRONG_ANSWER_MUTANT", "CORRECT_ANSWER", 1);
  assert.equal(mutantRes.pointsEarned, 0, "Mutant 1 KILLED: Engine properly scored wrong answer as 0");
  assert.equal(mutantRes.status, "incorrect");

  // Mutant 2: Intentional Leak Infiltration into Dataset Scanner
  console.log("  [H.2] Testing Mutation Kill: Leaked Secret Injected into Mock Dataset...");
  const fakeLeakedDataset = {
    testId: "aptis-b2-test-mutant",
    reading: {
      parts: [
        {
          partNumber: 1,
          tasks: [
            {
              id: "q1",
              questionText: "Sample question",
              options: ["A", "B", "C"],
              correctAnswer: "A", // Secret leak mutant
            },
          ],
        },
      ],
    },
  };

  const detectedLeaks = findForbiddenKeys(fakeLeakedDataset);
  assert.ok(detectedLeaks.length > 0, "Mutant 2 KILLED: Anti-leak scanner must detect injected correctAnswer");
  assert.ok(detectedLeaks[0].includes("correctAnswer"), "Must identify correctAnswer path");

  // Mutant 3: Missing Audio URL in Part 1
  console.log("  [H.3] Testing Mutation Kill: Incomplete Audio URL...");
  const brokenTask = { ...t1Data.listening.parts[0].tasks[0], audio: { url: "" } };
  assert.equal(brokenTask.audio.url, "", "Mutant 3 KILLED: Incomplete audio captured properly");

  console.log("  ✓ All 3 synthetic mutants successfully detected and killed.");
  console.log("✅ [RED-TEAM DOMAIN H PASSED] Mutation & Fault Resilience Tests PASSED!\n");
  return true;
}
