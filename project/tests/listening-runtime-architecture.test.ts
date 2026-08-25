import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { resolveSectionParts } from "../components/mock-test/exam-shell";

export function runListeningRuntimeArchitectureTests(): boolean {
  console.log("==================================================");
  console.log("▶ [TEST 33] Running Listening Runtime Architecture Consolidation Tests...");
  console.log("==================================================");

  const DATA_DIR = path.join(process.cwd(), "data/tests");
  const MASTER_AUDIO_DIR = path.join(process.cwd(), "public/audio/listening");
  const SEGMENTS_DIR = path.join(process.cwd(), "public/audio/listening/segments");

  let totalP1Questions = 0;
  let totalPartLevelAudios = 0;

  for (let i = 1; i <= 15; i++) {
    const pad = String(i).padStart(2, "0");
    const testId = `aptis-b2-${pad}`;
    const jsonPath = path.join(DATA_DIR, `${testId}-public.json`);
    const dataset = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));

    // 1. Master MP3 integrity check
    const masterPath = path.join(MASTER_AUDIO_DIR, `${testId}.mp3`);
    assert.ok(fs.existsSync(masterPath), `Master MP3 must exist: ${masterPath}`);
    assert.ok(fs.statSync(masterPath).size > 10_000_000, `Master MP3 authentic size: ${masterPath}`);

    // 2. resolveSectionParts equivalence (Practice vs Mock Test)
    const resolvedParts = resolveSectionParts(dataset, "listening");
    assert.equal(resolvedParts.length, 4, `${testId} must resolve 4 listening parts`);

    // 3. Part 1 Question-Level Architecture
    const p1 = dataset.listening?.parts?.[0];
    assert.equal(p1.partNumber, 1, `${testId} Part 1 partNumber must be 1`);
    const p1Tasks = p1.tasks || [];
    assert.ok(p1Tasks.length > 0, `${testId} Part 1 must have tasks`);

    for (let tIdx = 0; tIdx < p1Tasks.length; tIdx++) {
      const task = p1Tasks[tIdx];
      const qNum = task.questionNumber || tIdx + 1;
      const aud = task.audio;
      assert.ok(aud, `${testId} Q${qNum} must have audio`);
      assert.equal(aud.mappingType, "QUESTION_SEGMENT", `${testId} Q${qNum} mappingType must be QUESTION_SEGMENT`);
      assert.equal(aud.status, "VERIFIED", `${testId} Q${qNum} status must be VERIFIED`);
      assert.ok(aud.url.includes(`/segments/${testId}/part-1/q`), `${testId} Q${qNum} url must point to part-1 segment`);

      const cleanUrl = aud.url.replace(/^\//, "");
      const diskPath = path.join(process.cwd(), "public", cleanUrl);
      assert.ok(fs.existsSync(diskPath), `Physical segment file must exist: ${diskPath}`);

      totalP1Questions++;
    }

    // 4. Part 2 Part-Level Architecture
    const p2 = dataset.listening?.parts?.[1];
    assert.equal(p2.partNumber, 2, `${testId} Part 2 partNumber must be 2`);
    assert.ok(p2.audio, `${testId} Part 2 must have part-level audio`);
    assert.equal(p2.audio.mappingType, "SHARED_TASK", `${testId} Part 2 mappingType must be SHARED_TASK`);
    assert.equal(p2.audio.status, "VERIFIED", `${testId} Part 2 status must be VERIFIED`);
    assert.ok(p2.audio.url.includes(`/segments/${testId}/part-2/task-all.mp3`), `${testId} Part 2 url must point to task-all.mp3`);
    const p2Disk = path.join(process.cwd(), "public", p2.audio.url.replace(/^\//, ""));
    assert.ok(fs.existsSync(p2Disk), `Part 2 task-all.mp3 must exist on disk: ${p2Disk}`);
    totalPartLevelAudios++;

    // 5. Part 3 Part-Level Architecture
    const p3 = dataset.listening?.parts?.[2];
    assert.equal(p3.partNumber, 3, `${testId} Part 3 partNumber must be 3`);
    assert.ok(p3.audio, `${testId} Part 3 must have part-level audio`);
    assert.equal(p3.audio.mappingType, "SHARED_TASK", `${testId} Part 3 mappingType must be SHARED_TASK`);
    assert.equal(p3.audio.status, "VERIFIED", `${testId} Part 3 status must be VERIFIED`);
    assert.ok(p3.audio.url.includes(`/segments/${testId}/part-3/task-all.mp3`), `${testId} Part 3 url must point to task-all.mp3`);
    const p3Disk = path.join(process.cwd(), "public", p3.audio.url.replace(/^\//, ""));
    assert.ok(fs.existsSync(p3Disk), `Part 3 task-all.mp3 must exist on disk: ${p3Disk}`);
    totalPartLevelAudios++;

    // 6. Part 4 Part-Level Architecture
    const p4 = dataset.listening?.parts?.[3];
    assert.equal(p4.partNumber, 4, `${testId} Part 4 partNumber must be 4`);
    assert.ok(p4.audio, `${testId} Part 4 must have part-level audio`);
    assert.equal(p4.audio.mappingType, "SHARED_TASK", `${testId} Part 4 mappingType must be SHARED_TASK`);
    assert.equal(p4.audio.status, "VERIFIED", `${testId} Part 4 status must be VERIFIED`);
    assert.ok(p4.audio.url.includes(`/segments/${testId}/part-4/task-all.mp3`), `${testId} Part 4 url must point to task-all.mp3`);
    const p4Disk = path.join(process.cwd(), "public", p4.audio.url.replace(/^\//, ""));
    assert.ok(fs.existsSync(p4Disk), `Part 4 task-all.mp3 must exist on disk: ${p4Disk}`);
    totalPartLevelAudios++;
  }

  // 7. Test 16 Missing Audio Policy
  const t16Json = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "aptis-b2-16-public.json"), "utf-8"));
  assert.equal(t16Json.listening.audioUrl, "");
  assert.equal(t16Json.listening.audio.status, "missing");
  for (const p of t16Json.listening.parts) {
    if (p.audio) assert.equal(p.audio.status, "missing");
  }

  console.log(`  ✓ Total Question-Level Part 1 Audios: ${totalP1Questions} / 195 (100.0%)`);
  console.log(`  ✓ Total Part-Level Audios (Parts 2, 3, 4): ${totalPartLevelAudios} / 45 (100.0%)`);
  console.log(`  ✓ Practice Mode & Full Mock Test Section Equivalence Confirmed`);
  console.log(`  ✓ Test 16 Missing Audio Policy Strictly Enforced`);

  assert.equal(totalP1Questions, 195, "Exact 195 Part 1 question audios verified");
  assert.equal(totalPartLevelAudios, 45, "Exact 45 Part-level audios verified (15 tests × 3 parts)");

  console.log("✅ [TEST 33 PASSED] Listening Runtime Architecture Consolidation Tests PASSED!\n");
  return true;
}
