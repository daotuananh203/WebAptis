import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

export function runListeningMappingRegressionTests(): boolean {
  console.log("▶ [TEST 23] Running Listening Audio Mapping & Segmentation V2 Regression Tests...");

  const BASE_AUDIO_DIR = path.join(process.cwd(), "public/audio/listening");
  const DATA_DIR = path.join(process.cwd(), "data/tests");

  // 1. Original MP3 Existence and Test 16 Missing Check
  console.log("  [23.1] Checking 15 original MP3 files and Test 16 expected missing...");
  for (let i = 1; i <= 16; i++) {
    const pad = String(i).padStart(2, "0");
    const testId = `aptis-b2-${pad}`;
    const mp3File = path.join(BASE_AUDIO_DIR, `${testId}.mp3`);
    
    if (i === 16) {
      assert.ok(!fs.existsSync(mp3File), `Test 16 must NOT have an original MP3 file`);
    } else {
      assert.ok(fs.existsSync(mp3File), `${testId}.mp3 must exist in public/audio/listening/`);
      const sz = fs.statSync(mp3File).size;
      assert.ok(sz > 10_000_000, `${testId}.mp3 size (${sz} bytes) must be authentic full recording`);
    }
  }

  // 2. Part 1 Mapping & Segment Validity
  console.log("  [23.2] Validating Part 1 Question-Level audio segments and disk existence...");
  for (let i = 1; i <= 15; i++) {
    const pad = String(i).padStart(2, "0");
    const testId = `aptis-b2-${pad}`;
    const jsonPath = path.join(DATA_DIR, `${testId}-public.json`);
    const dataset = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
    const p1Tasks = dataset.listening?.parts?.[0]?.tasks || [];
    
    for (let qIdx = 0; qIdx < p1Tasks.length; qIdx++) {
      const task = p1Tasks[qIdx];
      const audio = task.audio;
      assert.ok(audio, `${testId} P1 task ${task.id} must have audio object`);
      
      if (audio.status === "VERIFIED") {
        assert.ok(audio.url, `${testId} P1 verified task must have url`);
        assert.ok(audio.url.includes("/segments/"), `${testId} verified task must point to segment`);
        
        // Disk segment existence
        const cleanUrl = audio.url.replace(/^\//, "");
        const diskPath = path.join(process.cwd(), "public", cleanUrl.replace(/^audio\/listening\//, "audio/listening/"));
        assert.ok(fs.existsSync(diskPath), `Generated segment file must exist on disk: ${diskPath}`);
        const sz = fs.statSync(diskPath).size;
        assert.ok(sz > 1000, `Segment file must not be empty: ${diskPath}`);
      }
    }
  }

  // 3. Part 2 Speaker Verification and Disk Existence
  console.log("  [23.3] Validating Part 2 Speaker Isolation and Disk Existence...");
  for (let i = 1; i <= 15; i++) {
    const pad = String(i).padStart(2, "0");
    const testId = `aptis-b2-${pad}`;
    const jsonPath = path.join(DATA_DIR, `${testId}-public.json`);
    const dataset = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
    const p2 = dataset.listening?.parts?.[1];
    const speakers = p2?.speakers || [];
    
    for (let sIdx = 0; sIdx < speakers.length; sIdx++) {
      const spk = speakers[sIdx];
      const sAudio = spk.audio;
      if (sAudio?.status === "VERIFIED") {
        assert.ok(sAudio.url.includes("/segments/"), `${testId} Speaker ${sIdx} verified must point to segment`);
        const cleanUrl = sAudio.url.replace(/^\//, "");
        const diskPath = path.join(process.cwd(), "public", cleanUrl);
        assert.ok(fs.existsSync(diskPath), `Speaker segment must exist on disk: ${diskPath}`);
      }
    }
  }

  // 4. Part 4 Monologue Regression and No Corrupted Files
  console.log("  [23.4] Validating Part 4 Monologues are non-corrupted and valid (>15s)...");
  for (let i = 1; i <= 15; i++) {
    const pad = String(i).padStart(2, "0");
    const testId = `aptis-b2-${pad}`;
    const jsonPath = path.join(DATA_DIR, `${testId}-public.json`);
    const dataset = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
    const p4 = dataset.listening?.parts?.[3];
    const monologues = p4?.monologues || [];
    
    for (let mIdx = 0; mIdx < monologues.length; mIdx++) {
      const mono = monologues[mIdx];
      const mAudio = mono.audio;
      if (mAudio?.status === "VERIFIED") {
        const cleanUrl = mAudio.url.replace(/^\//, "");
        const diskPath = path.join(process.cwd(), "public", cleanUrl);
        assert.ok(fs.existsSync(diskPath), `Monologue segment must exist on disk: ${diskPath}`);
        const sz = fs.statSync(diskPath).size;
        assert.ok(sz > 30000, `${testId} Monologue ${mIdx+1} file size (${sz} bytes) must NOT be corrupted`);
      }
    }
  }

  // 5. Test 08 Golden Regression Verification
  console.log("  [23.5] Validating Test 08 Golden Boundaries Exact Match...");
  const t8Json = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "aptis-b2-08-public.json"), "utf-8"));
  const t8P1 = t8Json.listening.parts[0].tasks;
  const t8P2 = t8Json.listening.parts[1];
  const t8P3 = t8Json.listening.parts[2];
  const t8P4 = t8Json.listening.parts[3];

  assert.ok(t8P1[0].audio.start <= 5.0 && t8P1[0].audio.end >= 25.0, "Test 08 P1 Q1 must encompass 5.0s-25.0s with pre-roll");
  assert.ok(t8P1[12].audio.start <= 363.0 && t8P1[12].audio.end >= 429.8, "Test 08 P1 Q13 must encompass 363.0s-429.8s with pre-roll");
  assert.equal(t8P2.audio.start, 432.5, "Test 08 P2 All start must be 432.5s");
  assert.equal(t8P2.audio.end, 594.2, "Test 08 P2 All end must be 594.2s");
  assert.equal(t8P3.audio.start, 599.0, "Test 08 P3 start must be 599.0s");
  assert.equal(t8P3.audio.end, 733.2, "Test 08 P3 end must be 733.2s");
  assert.equal(t8P4.audio.start, 738.0, "Test 08 Part 4 start must be 738.0s");
  assert.equal(t8P4.audio.end, 924.5, "Test 08 Part 4 end must be 924.5s");

  // 6. Test 16 Missing Audio State Verification
  console.log("  [23.6] Validating Test 16 has status 'missing' across all parts...");
  const t16Json = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "aptis-b2-16-public.json"), "utf-8"));
  for (const part of t16Json.listening.parts) {
    if (part.audio) {
      assert.equal(part.audio.status, "missing", "Test 16 part audio status must be 'missing'");
    }
  }

  console.log("✓ [TEST 23] All Listening Audio Mapping Regression Tests PASSED!\n");
  return true;
}
