import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { resolveSectionParts } from "../components/mock-test/exam-shell";

export function runListeningAudioArchitectureTests(): boolean {
  console.log("==================================================");
  console.log("▶ [TEST 30] Running Listening Audio Architecture Normalization Tests...");
  console.log("==================================================");

  const DATA_DIR = path.join(process.cwd(), "data/tests");
  const MASTER_AUDIO_DIR = path.join(process.cwd(), "public/audio/listening");
  const SEGMENTS_DIR = path.join(process.cwd(), "public/audio/listening/segments");

  let totalP1Questions = 0;
  let totalPartAudios = 0;

  for (let i = 1; i <= 16; i++) {
    const pad = String(i).padStart(2, "0");
    const testId = `aptis-b2-${pad}`;
    const jsonPath = path.join(DATA_DIR, `${testId}-public.json`);
    const dataset = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
    const parts = dataset.listening?.parts || [];

    if (i === 16) {
      assert.equal(dataset.listening.audio?.status, "missing", "Test 16 listening audio must be missing");
      assert.equal(dataset.listening.audioUrl, "");
      continue;
    }

    // 1. Master Audio Integrity Check
    const masterPath = path.join(MASTER_AUDIO_DIR, `${testId}.mp3`);
    assert.ok(fs.existsSync(masterPath), `Master MP3 must exist: ${masterPath}`);
    assert.ok(fs.statSync(masterPath).size > 10_000_000, `Master MP3 must be authentic size (>10MB): ${masterPath}`);

    // 2. Part 1 (Question-Level Audio)
    const p1Tasks = parts[0]?.tasks || [];
    assert.ok(p1Tasks.length >= 9, `${testId} Part 1 must have at least 9 tasks`);
    for (const t of p1Tasks) {
      assert.ok(t.audio, `${testId} Part 1 Q${t.questionNumber} must have audio`);
      assert.equal(t.audio.status, "VERIFIED", `${testId} Part 1 Q${t.questionNumber} must be VERIFIED`);
      assert.equal(t.audio.mappingType, "QUESTION_SEGMENT", `${testId} Part 1 Q${t.questionNumber} must be QUESTION_SEGMENT`);
      
      const dur = t.audio.duration ?? (t.audio.end - t.audio.start);
      assert.ok(dur >= 10.0, `${testId} Part 1 Q${t.questionNumber} duration must be >= 10s, got ${dur}s`);
      
      const cleanUrl = t.audio.url.replace(/^\//, "");
      const diskPath = path.join(process.cwd(), "public", cleanUrl);
      assert.ok(fs.existsSync(diskPath), `Question segment must exist: ${diskPath}`);
      totalP1Questions++;
    }

    // 3. Part 2 (Part-Level Audio: task-all.mp3)
    const p2 = parts[1];
    assert.ok(p2.audio, `${testId} Part 2 must have part-level audio`);
    assert.equal(p2.audio.status, "VERIFIED", `${testId} Part 2 audio must be VERIFIED`);
    assert.ok(p2.audio.url.endsWith("part-2/task-all.mp3"), `${testId} Part 2 audio must point to part-2/task-all.mp3`);
    const p2Disk = path.join(process.cwd(), "public", p2.audio.url.replace(/^\//, ""));
    assert.ok(fs.existsSync(p2Disk), `Part 2 task-all.mp3 must exist: ${p2Disk}`);
    assert.ok(fs.statSync(p2Disk).size > 10_000, `Part 2 task-all.mp3 must be non-empty`);
    totalPartAudios++;

    // 4. Part 3 (Part-Level Audio: task-all.mp3)
    const p3 = parts[2];
    assert.ok(p3.audio, `${testId} Part 3 must have part-level audio`);
    assert.equal(p3.audio.status, "VERIFIED", `${testId} Part 3 audio must be VERIFIED`);
    assert.ok(p3.audio.url.endsWith("part-3/task-all.mp3"), `${testId} Part 3 audio must point to part-3/task-all.mp3`);
    const p3Disk = path.join(process.cwd(), "public", p3.audio.url.replace(/^\//, ""));
    assert.ok(fs.existsSync(p3Disk), `Part 3 task-all.mp3 must exist: ${p3Disk}`);
    assert.ok(fs.statSync(p3Disk).size > 10_000, `Part 3 task-all.mp3 must be non-empty`);
    totalPartAudios++;

    // 5. Part 4 (Part-Level Audio: task-all.mp3)
    const p4 = parts[3];
    assert.ok(p4.audio, `${testId} Part 4 must have part-level audio`);
    assert.equal(p4.audio.status, "VERIFIED", `${testId} Part 4 audio must be VERIFIED`);
    assert.ok(p4.audio.url.endsWith("part-4/task-all.mp3"), `${testId} Part 4 audio must point to part-4/task-all.mp3`);
    const p4Disk = path.join(process.cwd(), "public", p4.audio.url.replace(/^\//, ""));
    assert.ok(fs.existsSync(p4Disk), `Part 4 task-all.mp3 must exist: ${p4Disk}`);
    assert.ok(fs.statSync(p4Disk).size > 10_000, `Part 4 task-all.mp3 must be non-empty`);
    totalPartAudios++;

    // 6. Practice & Mock Test Parity
    const resolved = resolveSectionParts(dataset, "listening");
    assert.equal(resolved.length, 4, `${testId} resolved section must have 4 parts`);
  }

  console.log(`  ✓ Total Question-Level Part 1 Audios Verified: ${totalP1Questions} / 190`);
  console.log(`  ✓ Total Part-Level Audios Verified (Parts 2, 3, 4): ${totalPartAudios} / 45 (15 tests × 3 parts)`);

  assert.equal(totalP1Questions, 190, "Exact 190 Part 1 question-level audios must be verified");
  assert.equal(totalPartAudios, 45, "Exact 45 part-level audios (Part 2, 3, 4 across 15 tests) must be verified");

  console.log("✅ [TEST 30 PASSED] Listening Audio Architecture Normalization Tests PASSED!\n");
  return true;
}
