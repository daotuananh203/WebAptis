import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export function runListeningPart1BoundaryRegressionTests(): boolean {
  console.log("==================================================");
  console.log("▶ [TEST 31] Running Listening Part 1 Precision Boundary & 2s Pre/Post-Roll Tests...");
  console.log("==================================================");

  const DATA_DIR = path.join(process.cwd(), "data/tests");
  const MASTER_AUDIO_DIR = path.join(process.cwd(), "public/audio/listening");

  let totalQuestions = 0;
  let totalWithExactContract = 0;

  for (let i = 1; i <= 15; i++) {
    const pad = String(i).padStart(2, "0");
    const testId = `aptis-b2-${pad}`;
    const jsonPath = path.join(DATA_DIR, `${testId}-public.json`);
    const dataset = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
    const p1Tasks = dataset.listening?.parts?.[0]?.tasks || [];

    // Master MP3 integrity check
    const masterPath = path.join(MASTER_AUDIO_DIR, `${testId}.mp3`);
    assert.ok(fs.existsSync(masterPath), `Master MP3 must exist: ${masterPath}`);
    assert.ok(fs.statSync(masterPath).size > 10_000_000, `Master MP3 must be authentic size (>10MB): ${masterPath}`);

    for (let idx = 0; idx < p1Tasks.length; idx++) {
      const task = p1Tasks[idx];
      const qNum = task.questionNumber || idx + 1;
      const aud = task.audio;

      totalQuestions++;

      // 1. Every Q has mapping & verified status
      assert.ok(aud, `${testId} Q${qNum} must have audio`);
      assert.equal(aud.status, "VERIFIED", `${testId} Q${qNum} must be VERIFIED`);
      assert.equal(aud.mappingType, "QUESTION_SEGMENT", `${testId} Q${qNum} must be QUESTION_SEGMENT`);

      // 2. Pre-roll & Post-roll silence contracts: >= 2.0s
      const v = aud.verification || {};
      assert.ok(v.preRollSeconds !== undefined && v.preRollSeconds >= 2.0, `${testId} Q${qNum} must have >=2.0s pre-roll silence, got ${v.preRollSeconds}s`);
      assert.ok(v.postRollSeconds !== undefined && v.postRollSeconds >= 2.0, `${testId} Q${qNum} must have >=2.0s post-roll silence, got ${v.postRollSeconds}s`);

      // 3. No cross-question contamination asserted
      assert.equal(v.noCrossContamination, true, `${testId} Q${qNum} must have noCrossContamination = true`);

      // 4. Context sufficiency and answer evidence
      assert.equal(v.contextSufficient, true, `${testId} Q${qNum} must have contextSufficient = true`);
      assert.ok(v.evidence, `${testId} Q${qNum} must have answer evidence`);

      // 5. Segment file on disk exists, has substantial size and duration encompasses speech + 4.0s
      const cleanUrl = aud.url.replace(/^\//, "");
      const diskPath = path.join(process.cwd(), "public", cleanUrl);
      assert.ok(fs.existsSync(diskPath), `Segment file must exist: ${diskPath}`);
      assert.ok(fs.statSync(diskPath).size > 30_000, `Segment file must be substantial size (>30KB): ${diskPath}`);
      assert.ok(aud.duration >= (v.speechDuration + 4.0 - 0.1), `${testId} Q${qNum} duration (${aud.duration}s) must include speech (${v.speechDuration}s) + 4.0s silence buffer`);

      totalWithExactContract++;
    }
  }

  console.log(`  ✓ Total Part 1 Questions Verified with Exact 2s Pre/Post-Roll Contract: ${totalWithExactContract} / ${totalQuestions} (100.0%)`);
  assert.equal(totalQuestions, 195, "Exact 195 Part 1 questions verified");

  console.log("✅ [TEST 31 PASSED] Listening Part 1 Precision Boundary & 2s Pre/Post-Roll Tests PASSED!\n");
  return true;
}
