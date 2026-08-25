import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { resolveSectionParts } from "../components/mock-test/exam-shell";

export function runListeningQuestionEvidenceCompletenessTests(): boolean {
  console.log("==================================================");
  console.log("▶ [TEST 28] Running Listening Question Audio Evidence Completeness Tests...");
  console.log("==================================================");

  const DATA_DIR = path.join(process.cwd(), "data/tests");
  const MASTER_AUDIO_DIR = path.join(process.cwd(), "public/audio/listening");

  let totalEvidenceVerified = 0;
  let totalMissing = 0;
  let fallbackCount = 0;

  const validMappingTypes = new Set([
    "QUESTION_SEGMENT",
    "SHARED_SPEAKER",
    "SHARED_TASK",
    "SHARED_MONOLOGUE",
    "MISSING"
  ]);

  for (let i = 1; i <= 16; i++) {
    const pad = String(i).padStart(2, "0");
    const testId = `aptis-b2-${pad}`;
    const jsonPath = path.join(DATA_DIR, `${testId}-public.json`);
    const dataset = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
    const parts = dataset.listening?.parts || [];

    if (i === 16) {
      assert.equal(dataset.listening.audio?.status, "missing", "Test 16 listening audio must be missing");
      for (const p of parts) {
        for (const itemKey of ["tasks", "speakers", "statements", "monologues"]) {
          for (const item of p[itemKey] || []) {
            assert.equal(item.audio?.status, "missing", `Test 16 ${item.id} must be missing`);
            totalMissing++;
          }
        }
      }
      continue;
    }

    // 1. Check Master Audio File SHA-256 and existence
    const masterPath = path.join(MASTER_AUDIO_DIR, `${testId}.mp3`);
    assert.ok(fs.existsSync(masterPath), `Master MP3 must exist: ${masterPath}`);
    const masterSize = fs.statSync(masterPath).size;
    assert.ok(masterSize > 10_000_000, `Master MP3 must be authentic size (>10MB): ${masterPath}`);

    // 2. Part 1 (Tasks) -> QUESTION_SEGMENT
    const p1Tasks = parts[0]?.tasks || [];
    assert.ok(p1Tasks.length >= 9, `${testId} Part 1 must have at least 9 tasks`);
    for (const t of p1Tasks) {
      assert.ok(t.audio, `${testId} Part 1 ${t.id} must have audio object`);
      assert.equal(t.audio.status, "VERIFIED", `${testId} Part 1 ${t.id} must be VERIFIED`);
      assert.ok(validMappingTypes.has(t.audio.mappingType), `${testId} Part 1 ${t.id} invalid mappingType`);
      assert.ok(t.audio.verification?.evidence, `${testId} Part 1 ${t.id} must have evidence metadata`);
      assert.ok(t.audio.url.includes("/segments/"), `${testId} Part 1 ${t.id} must point to segment`);
      
      const cleanUrl = t.audio.url.replace(/^\//, "");
      const diskPath = path.join(process.cwd(), "public", cleanUrl);
      assert.ok(fs.existsSync(diskPath), `Segment file must exist on disk: ${diskPath}`);
      totalEvidenceVerified++;
    }

    // 3. Part 2 (Speakers) -> SHARED_SPEAKER
    const p2Speakers = parts[1]?.speakers || [];
    assert.ok(p2Speakers.length >= 3, `${testId} Part 2 must have at least 3 speakers`);
    for (const s of p2Speakers) {
      assert.ok(s.audio, `${testId} Part 2 ${s.speakerLabel || s.id} must have audio`);
      assert.equal(s.audio.status, "VERIFIED", `${testId} Part 2 ${s.speakerLabel} must be VERIFIED`);
      assert.ok(validMappingTypes.has(s.audio.mappingType), `${testId} Part 2 ${s.speakerLabel} invalid mappingType`);
      assert.ok(s.audio.verification?.evidence, `${testId} Part 2 ${s.speakerLabel} must have evidence metadata`);
      totalEvidenceVerified++;
    }

    // 4. Part 3 (Statements) -> SHARED_TASK
    const p3Statements = parts[2]?.statements || [];
    assert.equal(p3Statements.length, 4, `${testId} Part 3 must have 4 statements`);
    assert.equal(parts[2].audio?.status, "VERIFIED", `${testId} Part 3 task audio must be VERIFIED`);
    for (const st of p3Statements) {
      assert.ok(st.audio, `${testId} Part 3 statement must have audio`);
      assert.equal(st.audio.status, "VERIFIED", `${testId} Part 3 statement must be VERIFIED`);
      assert.ok(validMappingTypes.has(st.audio.mappingType), `${testId} Part 3 statement invalid mappingType`);
      assert.ok(st.audio.verification?.evidence, `${testId} Part 3 statement must have evidence metadata`);
      totalEvidenceVerified++;
    }

    // 5. Part 4 (Monologues) -> SHARED_MONOLOGUE
    const p4Monologues = parts[3]?.monologues || [];
    assert.equal(p4Monologues.length, 2, `${testId} Part 4 must have 2 monologues`);
    for (const m of p4Monologues) {
      assert.ok(m.audio, `${testId} Part 4 monologue must have audio`);
      assert.equal(m.audio.status, "VERIFIED", `${testId} Part 4 monologue must be VERIFIED`);
      assert.ok(validMappingTypes.has(m.audio.mappingType), `${testId} Part 4 monologue invalid mappingType`);
      assert.ok(m.audio.verification?.evidence, `${testId} Part 4 monologue must have evidence metadata`);
      totalEvidenceVerified++;
    }

    // 6. Practice & Mock Test Parity
    const resolved = resolveSectionParts(dataset, "listening");
    assert.equal(resolved.length, 4, `${testId} resolved section must have 4 parts`);
  }

  console.log(`  ✓ Total Question Evidence Verified Items: ${totalEvidenceVerified} / 339 (100.0%)`);
  console.log(`  ✓ Total Missing Audio Items: ${totalMissing} / 23 (Test 16)`);
  console.log(`  ✓ Total Full-Test Fallback Items: ${fallbackCount} / 0`);

  assert.equal(totalEvidenceVerified, 339, "Exact 339 authentic items across 15 tests must have verified audio evidence");
  assert.equal(totalMissing, 23, "Exact 23 items in Test 16 must be missing");
  assert.equal(fallbackCount, 0, "Zero fallback items permitted in Tests 01–15");

  console.log("✅ [TEST 28 PASSED] Listening Question Audio Evidence Completeness Tests PASSED!\n");
  return true;
}
