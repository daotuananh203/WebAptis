import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { NextRequest } from "next/server";
import { POST as gradeDeterministic } from "../app/api/grade/deterministic/route";

export async function runPracticeGradingPayloadTests() {
  console.log("▶ [TEST 36] Running practice part-level grading payload regression tests...");

  const shellPath = path.join(process.cwd(), "components/practice/practice-shell.tsx");
  const shellSource = fs.readFileSync(shellPath, "utf8");
  assert.match(
    shellSource,
    /testId,\s*skill,\s*partIdentifier,\s*answers/,
    "PracticeShell must send partIdentifier to deterministic grading",
  );

  const answers = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), "data/tests/aptis-b2-01-answers.json"), "utf8"),
  );
  const request = new NextRequest("http://localhost/api/grade/deterministic", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      testId: "aptis-b2-01",
      skill: "listening",
      partIdentifier: "part1",
      answers: answers.listening.part1,
    }),
  });

  const response = await gradeDeterministic(request);
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.success, true);
  assert.equal(payload.data.rawScore, 13);
  assert.equal(payload.data.maxRawScore, 13);
  assert.equal(payload.data.percentage, 100);
  assert.equal(payload.data.parts, undefined);

  console.log("  ✓ Listening Part1 request grades 13/13 when partIdentifier is present.");
  console.log("✅ [TEST 36 PASSED] Practice part-level grading payload regression tests completed.\n");
  return true;
}

if (process.argv[1] === import.meta.filename) {
  await runPracticeGradingPayloadTests();
}
