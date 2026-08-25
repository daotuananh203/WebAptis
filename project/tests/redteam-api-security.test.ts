import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { gradeReadingSection } from "../lib/grading/deterministic";
import { createSessionToken, verifySessionToken } from "../lib/auth/session";

export async function runRedTeamApiSecurityTests(): Promise<boolean> {
  console.log("==================================================");
  console.log("▶ [RED-TEAM DOMAIN A] Running API Fuzzing & Security Assault Tests...");
  console.log("==================================================");

  const DATA_DIR = path.join(process.cwd(), "data/tests");

  // 1. Anti-Leak Public Endpoint Security Audit across all 16 tests
  console.log("  [A.1] Auditing Anti-Leak security on all 16 public test datasets...");
  for (let i = 1; i <= 16; i++) {
    const pad = String(i).padStart(2, "0");
    const testId = `aptis-b2-${pad}`;
    const jsonPath = path.join(DATA_DIR, `${testId}-public.json`);
    const rawContent = fs.readFileSync(jsonPath, "utf-8");

    // Critical security check: No raw answers in public dataset
    assert.ok(!rawContent.includes('"correctAnswer"'), `CRITICAL: ${testId} public dataset must NOT contain "correctAnswer"`);
    assert.ok(!rawContent.includes('"explanation"'), `CRITICAL: ${testId} public dataset must NOT contain "explanation"`);
    assert.ok(!rawContent.includes('"scoringGuide"'), `CRITICAL: ${testId} public dataset must NOT contain "scoringGuide"`);
  }
  console.log("  ✓ 16/16 Public datasets confirmed 100% sanitized with zero answer leaks.");

  // 2. API Contract Fuzzing against deterministic grading
  console.log("  [A.2] Fuzzing deterministic grading schema validation...");

  const mockReadingKey = {
    part1: { "q1": "A", "q2": "B", "q3": "C", "q4": "D", "q5": "A" },
    part2: { "story1": ["1", "2", "3", "4", "5", "6"] },
    part3: { "q1": "A", "q2": "B", "q3": "C", "q4": "D", "q5": "A", "q6": "B", "q7": "C" },
    part4: { "head1": "1", "head2": "2", "head3": "3", "head4": "4", "head5": "5", "head6": "6", "head7": "7" },
  };

  // Malformed input 1: null answers
  const res1 = gradeReadingSection({} as any, mockReadingKey);
  assert.equal(res1.rawScore, 0, "Null answers must yield 0 score gracefully without crashing");

  // Malformed input 2: malicious XSS injection in answers
  const xssAnswers = {
    part1: {
      "q1": "<script>alert('XSS')</script>",
      "q2": "'; DROP TABLE users; --",
      "q3": "\x00\x01\x02\x03",
      "q4": "A".repeat(50000),
    },
  };
  const res2 = gradeReadingSection(xssAnswers as any, mockReadingKey);
  assert.ok(res2.rawScore >= 0 && res2.rawScore <= 25, "XSS answers must not crash scoring engine");
  assert.equal(typeof res2.percentage, "number");

  // 3. User Authentication Token Security
  console.log("  [A.3] Testing Session Token tampering resistance...");

  const testUser = {
    id: "usr_test_victim",
    email: "victim@aptis.edu.vn",
    name: "Victim User",
    role: "user" as const,
  };

  const validToken = createSessionToken(testUser);
  assert.ok(validToken, "Valid token must be generated");

  // Tamper attack 1: modified signature
  const tamperedToken = validToken.slice(0, -5) + "abcde";
  const verifiedTampered = verifySessionToken(tamperedToken);
  assert.equal(verifiedTampered, null, "Tampered signature must be rejected");

  // Tamper attack 2: modified payload (privilege escalation to admin)
  const parts = validToken.split(".");
  if (parts.length === 2) {
    const fakePayload = Buffer.from(JSON.stringify({ ...testUser, role: "admin" })).toString("base64url");
    const forgedToken = `${fakePayload}.${parts[1]}`;
    const verifiedForged = verifySessionToken(forgedToken);
    assert.equal(verifiedForged, null, "Forged privilege escalation token must be rejected");
  }

  // Tamper attack 3: garbage / empty token
  assert.equal(verifySessionToken(""), null);
  assert.equal(verifySessionToken("null"), null);
  assert.equal(verifySessionToken("Bearer undefined"), null);

  console.log("  ✓ Session token tampering defenses 100% verified.");
  console.log("✅ [RED-TEAM DOMAIN A PASSED] API Fuzzing & Security Assault Tests PASSED!\n");
  return true;
}
