import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { resolveSectionParts } from "../components/mock-test/exam-shell";

export function runListeningContentQARegressionTests(): boolean {
  console.log("▶ [TEST 24] Running Listening Content QA & Rollout Semantics Regression Tests...");

  const BASE_AUDIO_DIR = path.join(process.cwd(), "public/audio/listening");
  const DATA_DIR = path.join(process.cwd(), "data/tests");

  let totalVerified = 0;
  let totalNotVerified = 0;
  let totalMissing = 0;

  // 1. Rollout & Fallback Semantics Verification
  console.log("  [24.1] Validating Rollout & Fallback Semantics for all 16 tests (Zero fake verified items)...");
  for (let i = 1; i <= 16; i++) {
    const pad = String(i).padStart(2, "0");
    const testId = `aptis-b2-${pad}`;
    const jsonPath = path.join(DATA_DIR, `${testId}-public.json`);
    const dataset = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
    const parts = dataset.listening?.parts || [];

    // Part 1
    const p1Tasks = parts[0]?.tasks || [];
    for (const task of p1Tasks) {
      if (i === 16) {
        assert.equal(task.audio?.status, "missing", "Test 16 task status must be missing");
        totalMissing++;
      } else if (task.audio?.status === "VERIFIED") {
        totalVerified++;
        assert.ok(task.audio.url.includes("/segments/"), `${testId} verified task must point to segment`);
      } else {
        totalNotVerified++;
        assert.equal(task.audio?.status, "NOT_VERIFIED", `${testId} unverified task must be NOT_VERIFIED`);
        assert.ok(task.audio.url.endsWith(`${testId}.mp3`), `${testId} unverified task must fallback to full MP3`);
      }
    }

    // Part 2
    const speakers = parts[1]?.speakers || [];
    for (const spk of speakers) {
      if (i === 16) {
        totalMissing++;
      } else if (spk.audio?.status === "VERIFIED") {
        totalVerified++;
      } else {
        totalNotVerified++;
      }
    }

    // Part 3
    const statements = parts[2]?.statements || [];
    for (const stmt of statements) {
      if (i === 16) {
        totalMissing++;
      } else if (stmt.audio?.status === "VERIFIED") {
        totalVerified++;
      } else {
        totalNotVerified++;
      }
    }

    // Part 4
    const monologues = parts[3]?.monologues || [];
    for (const mono of monologues) {
      if (i === 16) {
        totalMissing++;
      } else if (mono.audio?.status === "VERIFIED") {
        totalVerified++;
      } else {
        totalNotVerified++;
      }
    }
  }

  console.log(`    Total Counts -> VERIFIED: ${totalVerified} | NOT_VERIFIED (Fallback): ${totalNotVerified} | MISSING: ${totalMissing}`);
  assert.equal(totalVerified, 345, "Exact 345 items across 15 tests must be 100% VERIFIED");
  assert.equal(totalNotVerified, 0, "Zero unverified items remaining");
  assert.equal(totalMissing, 23, "Exact 23 items in Test 16 must be MISSING");

  // 2. Practice vs Mock Test Consistency
  console.log("  [24.2] Verifying Practice and Full Mock Test use identical metadata and parts...");
  for (let i = 1; i <= 16; i++) {
    const pad = String(i).padStart(2, "0");
    const testId = `aptis-b2-${pad}`;
    const jsonPath = path.join(DATA_DIR, `${testId}-public.json`);
    const dataset = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
    const resolvedParts = resolveSectionParts(dataset, "listening");
    
    assert.equal(resolvedParts.length, 4, `${testId} must resolve 4 listening parts`);
    assert.equal(resolvedParts[0].partIdentifier, "part1");
    assert.equal(resolvedParts[1].partIdentifier, "part2");
    assert.equal(resolvedParts[2].partIdentifier, "part3");
    assert.equal(resolvedParts[3].partIdentifier, "part4");
  }

  // 3. Test 08 Golden Boundaries Non-Regression
  console.log("  [24.3] Verifying Test 08 Golden Boundaries (Mono 1: 738.0s-852.5s, Mono 2: 856.5s-924.5s)...");
  const t8Json = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "aptis-b2-08-public.json"), "utf-8"));
  const t8P4 = t8Json.listening.parts[3].monologues;
  assert.equal(t8P4[0].audio.start, 738.0);
  assert.equal(t8P4[0].audio.end, 852.5);
  assert.equal(t8P4[1].audio.start, 856.5);
  assert.equal(t8P4[1].audio.end, 924.5);

  // 4. Test 16 Zero Fake Audio Assets Policy
  console.log("  [24.4] Verifying Test 16 Zero Fake Audio Assets Policy...");
  const t16Json = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "aptis-b2-16-public.json"), "utf-8"));
  assert.equal(t16Json.listening.audioUrl, "");
  assert.equal(t16Json.listening.audio.status, "missing");

  console.log("✓ [TEST 24] All Listening Content QA Regression Tests PASSED!\n");
  return true;
}
