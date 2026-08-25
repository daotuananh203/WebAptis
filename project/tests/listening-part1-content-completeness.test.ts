import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

export function runListeningPart1ContentCompletenessTests(): boolean {
  console.log("==================================================");
  console.log("▶ [TEST 32] Running Listening Part 1 Full Content Completeness Tests...");
  console.log("==================================================");

  const DATA_DIR = path.join(process.cwd(), "data/tests");
  const MASTER_AUDIO_DIR = path.join(process.cwd(), "public/audio/listening");
  const SEGMENTS_DIR = path.join(process.cwd(), "public/audio/listening/segments");

  let totalQuestions = 0;
  let totalContentVerified = 0;
  let totalPhysicalSegments = 0;

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

    // Scan segment folder
    const segDir = path.join(SEGMENTS_DIR, testId, "part-1");
    assert.ok(fs.existsSync(segDir), `Segment directory must exist: ${segDir}`);
    const files = fs.readdirSync(segDir).filter(f => f.endsWith(".mp3"));
    assert.equal(files.length, p1Tasks.length, `${testId} physical segment files (${files.length}) must match canonical tasks (${p1Tasks.length})`);
    totalPhysicalSegments += files.length;

    for (let idx = 0; idx < p1Tasks.length; idx++) {
      const task = p1Tasks[idx];
      const qNum = task.questionNumber || idx + 1;
      const aud = task.audio;

      totalQuestions++;

      // 1. Audio Mapping & Status
      assert.ok(aud, `${testId} Q${qNum} must have audio`);
      assert.equal(aud.status, "VERIFIED", `${testId} Q${qNum} must be VERIFIED`);
      assert.equal(aud.mappingType, "QUESTION_SEGMENT", `${testId} Q${qNum} must be QUESTION_SEGMENT`);

      const v = aud.verification || {};

      // 2. Pre-roll & Post-roll Contract (>= 2.0s)
      assert.ok(v.preRollSeconds !== undefined && v.preRollSeconds >= 2.0, `${testId} Q${qNum} pre-roll must be >= 2.0s, got ${v.preRollSeconds}`);
      assert.ok(v.postRollSeconds !== undefined && v.postRollSeconds >= 2.0, `${testId} Q${qNum} post-roll must be >= 2.0s, got ${v.postRollSeconds}`);

      // 3. Full Content Completeness Indicators
      assert.equal(v.openingMatched, true, `${testId} Q${qNum} must have openingMatched = true`);
      assert.equal(v.middleContextMatched, true, `${testId} Q${qNum} must have middleContextMatched = true`);
      assert.equal(v.answerEvidenceMatched, true, `${testId} Q${qNum} must have answerEvidenceMatched = true`);
      assert.equal(v.endingMatched, true, `${testId} Q${qNum} must have endingMatched = true`);
      assert.equal(v.contextSufficient, true, `${testId} Q${qNum} must have contextSufficient = true`);
      assert.equal(v.noCrossContamination, true, `${testId} Q${qNum} must have noCrossContamination = true`);

      // 4. Physical File Existence on Disk
      const cleanUrl = aud.url.replace(/^\//, "");
      const diskPath = path.join(process.cwd(), "public", cleanUrl);
      assert.ok(fs.existsSync(diskPath), `Segment file must exist: ${diskPath}`);
      assert.ok(fs.statSync(diskPath).size > 30_000, `Segment file must be substantial size (>30KB): ${diskPath}`);

      totalContentVerified++;
    }
  }

  console.log(`  ✓ Total Canonical Questions Audited: ${totalQuestions} / 190`);
  console.log(`  ✓ Total Physical Segments on Disk:   ${totalPhysicalSegments} / 190`);
  console.log(`  ✓ Total Full Content Complete Items: ${totalContentVerified} / 190 (100.0%)`);

  assert.equal(totalQuestions, 190, "Exact 190 canonical Part 1 questions must be present");
  assert.equal(totalPhysicalSegments, 190, "Exact 190 physical segment files must exist on disk");
  assert.equal(totalContentVerified, 190, "Exact 190 items must be full content verified complete");

  console.log("✅ [TEST 32 PASSED] Listening Part 1 Full Content Completeness Tests PASSED!\n");
  return true;
}
