import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

export function runListeningPart1ContextCompletenessTests(): boolean {
  console.log("==================================================");
  console.log("▶ [TEST 29] Running Listening Part 1 Context Completeness Tests...");
  console.log("==================================================");

  const DATA_DIR = path.join(process.cwd(), "data/tests");

  let totalP1Questions = 0;
  let totalP1Verified = 0;

  for (let i = 1; i <= 16; i++) {
    const pad = String(i).padStart(2, "0");
    const testId = `aptis-b2-${pad}`;
    const jsonPath = path.join(DATA_DIR, `${testId}-public.json`);
    const dataset = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
    const p1 = dataset.listening?.parts?.[0];

    if (i === 16) {
      assert.equal(dataset.listening.audio?.status, "missing", "Test 16 listening must be missing");
      continue;
    }

    const tasks = p1?.tasks || [];
    assert.ok(tasks.length >= 9, `${testId} Part 1 must have >=9 tasks`);

    for (const t of tasks) {
      totalP1Questions++;
      assert.ok(t.audio, `${testId} Part 1 Q${t.questionNumber} must have audio`);
      assert.equal(t.audio.status, "VERIFIED", `${testId} Part 1 Q${t.questionNumber} must be VERIFIED`);
      assert.equal(t.audio.mappingType, "QUESTION_SEGMENT", `${testId} Part 1 Q${t.questionNumber} must be QUESTION_SEGMENT`);
      
      const dur = t.audio.duration ?? (t.audio.end - t.audio.start);
      assert.ok(dur >= 10.0, `${testId} Part 1 Q${t.questionNumber} must have sufficient context (duration >= 10s), got ${dur}s`);
      assert.ok(t.audio.verification?.evidence, `${testId} Part 1 Q${t.questionNumber} must have answer evidence`);

      const cleanUrl = t.audio.url.replace(/^\//, "");
      const diskPath = path.join(process.cwd(), "public", cleanUrl);
      assert.ok(fs.existsSync(diskPath), `Segment file must exist on disk: ${diskPath}`);
      assert.ok(fs.statSync(diskPath).size > 50_000, `Segment file must be substantial size (>50KB): ${diskPath}`);
      totalP1Verified++;
    }
  }

  console.log(`  ✓ Total Part 1 Context-Complete Questions: ${totalP1Verified} / ${totalP1Questions} (100.0%)`);
  assert.equal(totalP1Verified, 190, "Exact 190 Part 1 questions across 15 tests must be context-complete");

  console.log("✅ [TEST 29 PASSED] Listening Part 1 Context Completeness Tests PASSED!\n");
  return true;
}
