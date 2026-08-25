import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { resolveSectionParts } from "../components/mock-test/exam-shell";

export function runListeningQuestionLevelCompletenessTests(): boolean {
  console.log("▶ [TEST 27] Running Listening Question-Level Audio 100% Completeness Tests...");

  const DATA_DIR = path.join(process.cwd(), "data/tests");

  let totalAuthenticVerified = 0;
  let totalMissing = 0;

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

    // 1. Part 1 (Tasks)
    const p1Tasks = parts[0]?.tasks || [];
    assert.ok(p1Tasks.length >= 9, `${testId} Part 1 must have at least 9 tasks`);
    for (const t of p1Tasks) {
      assert.ok(t.audio, `${testId} Part 1 ${t.id} must have audio`);
      assert.equal(t.audio.status, "VERIFIED", `${testId} Part 1 ${t.id} must be VERIFIED`);
      assert.ok(t.audio.url.includes("/segments/"), `${testId} Part 1 ${t.id} must point to a segment`);
      
      const cleanUrl = t.audio.url.replace(/^\//, "");
      const diskPath = path.join(process.cwd(), "public", cleanUrl);
      assert.ok(fs.existsSync(diskPath), `Segment file must exist on disk: ${diskPath}`);
      assert.ok(fs.statSync(diskPath).size > 1000, `Segment file must be non-empty: ${diskPath}`);
      totalAuthenticVerified++;
    }

    // 2. Part 2 (Speakers)
    const p2Speakers = parts[1]?.speakers || [];
    assert.ok(p2Speakers.length >= 3, `${testId} Part 2 must have at least 3 speakers`);
    for (const s of p2Speakers) {
      assert.ok(s.audio, `${testId} Part 2 ${s.speakerLabel || s.id} must have audio`);
      assert.equal(s.audio.status, "VERIFIED", `${testId} Part 2 ${s.speakerLabel} must be VERIFIED`);
      const cleanUrl = s.audio.url.replace(/^\//, "");
      const diskPath = path.join(process.cwd(), "public", cleanUrl);
      assert.ok(fs.existsSync(diskPath), `Speaker segment must exist on disk: ${diskPath}`);
      totalAuthenticVerified++;
    }

    // 3. Part 3 (Statements)
    const p3Statements = parts[2]?.statements || [];
    assert.equal(p3Statements.length, 4, `${testId} Part 3 must have 4 statements`);
    assert.equal(parts[2].audio?.status, "VERIFIED", `${testId} Part 3 audio must be VERIFIED`);
    for (const st of p3Statements) {
      assert.equal(st.audio?.status, "VERIFIED", `${testId} Part 3 statement must be VERIFIED`);
      totalAuthenticVerified++;
    }

    // 4. Part 4 (Monologues)
    const p4Monologues = parts[3]?.monologues || [];
    assert.equal(p4Monologues.length, 2, `${testId} Part 4 must have 2 monologues`);
    for (const m of p4Monologues) {
      assert.ok(m.audio, `${testId} Part 4 monologue must have audio`);
      assert.equal(m.audio.status, "VERIFIED", `${testId} Part 4 monologue must be VERIFIED`);
      const cleanUrl = m.audio.url.replace(/^\//, "");
      const diskPath = path.join(process.cwd(), "public", cleanUrl);
      assert.ok(fs.existsSync(diskPath), `Monologue segment must exist on disk: ${diskPath}`);
      assert.ok(fs.statSync(diskPath).size > 10000, `Monologue segment must not be empty: ${diskPath}`);
      totalAuthenticVerified++;
    }

    // 5. Parity between Practice and Mock Test
    const resolved = resolveSectionParts(dataset, "listening");
    assert.equal(resolved.length, 4, `${testId} resolved section must have 4 parts`);
  }

  console.log(`  ✓ Total Authentic Verified Items: ${totalAuthenticVerified} / 339 (100.0%)`);
  console.log(`  ✓ Total Authentic Missing Items: ${totalMissing} / 23 (Test 16)`);
  assert.equal(totalAuthenticVerified, 339, "All 339 authentic items across 15 tests must be 100% VERIFIED");
  assert.equal(totalMissing, 23, "Test 16 must have exact 23 missing items");

  console.log("✅ [TEST 27 PASSED] Listening Question-Level Audio 100% Completeness Tests PASSED!\n");
  return true;
}
