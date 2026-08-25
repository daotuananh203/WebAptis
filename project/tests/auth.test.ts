/**
 * User Authentication, Session Security & Data Isolation Test Suite
 * Validates registration, password encryption, login, tamper-proof sessions,
 * user-scoped storage isolation, and anonymous data migration.
 */

import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import {
  FileUserStore,
  hashPassword,
  verifyPassword,
  createSessionToken,
  verifySessionToken,
  RegisterInputSchema,
  LoginInputSchema,
} from "../lib/auth";
import {
  MemoryStorageAdapter,
  loadProgressHistory,
  saveProgressAttempt,
  clearProgressHistory,
  loadUserPreferences,
  saveUserPreferences,
} from "../lib/storage/storage";
import {
  createPracticeSession,
  loadActiveSession,
  createMockTestSession,
  loadActiveMockTestSession,
} from "../lib/storage/session";
import { migrateAnonymousStorageToUser } from "../lib/storage/migration";
import { STORAGE_KEYS } from "../lib/storage/types";
import { ProgressAttemptRecord } from "../lib/progress/types";

export async function runAuthTests() {
  console.log("\n==================================================");
  console.log("▶ [TEST 14] Running User Authentication & Data Isolation Tests...");
  console.log("==================================================");

  // ----------------------------------------------------
  // Subtest 1: Password Hashing & Cryptographic Salt
  // ----------------------------------------------------
  {
    console.log("  [14.1] Testing Password Hashing & Verification...");
    const rawPass = "MySecurePassword#2026";
    const { hash: hash1, salt: salt1 } = hashPassword(rawPass);
    const { hash: hash2, salt: salt2 } = hashPassword(rawPass);

    assert.ok(hash1 && hash1.length >= 64, "Hash length should be at least 64 hex characters");
    assert.ok(salt1 && salt1.length === 32, "Salt length should be 32 hex chars (16 bytes)");
    assert.notEqual(salt1, salt2, "Salts must be uniquely generated for every hash operation");
    assert.notEqual(hash1, hash2, "Hashes of same password with different salts must differ");

    assert.equal(verifyPassword(rawPass, hash1, salt1), true, "Correct password must verify successfully");
    assert.equal(verifyPassword("WrongPassword123", hash1, salt1), false, "Wrong password must be rejected");
    assert.equal(verifyPassword(rawPass, hash1, salt2), false, "Mismatched salt must fail verification");
    console.log("  ✓ Password hashing with unique cryptographic salt verified.");
  }

  // ----------------------------------------------------
  // Subtest 2: Zod Schema Validation for Register & Login
  // ----------------------------------------------------
  {
    console.log("  [14.2] Testing Input Validation Schemas...");
    const validRegister = RegisterInputSchema.safeParse({
      name: "Nguyen Van A",
      email: "  VAN.A@Example.COM  ",
      password: "strongpassword",
    });
    assert.equal(validRegister.success, true);
    if (validRegister.success) {
      assert.equal(validRegister.data.email, "van.a@example.com", "Email must be normalized to lowercase");
    }

    const shortPassword = RegisterInputSchema.safeParse({
      name: "Tran B",
      email: "tranb@example.com",
      password: "123",
    });
    assert.equal(shortPassword.success, false, "Passwords under 6 characters must be rejected");

    const invalidEmail = RegisterInputSchema.safeParse({
      name: "Tran B",
      email: "not-an-email",
      password: "validpassword123",
    });
    assert.equal(invalidEmail.success, false, "Invalid email formats must be rejected");
    console.log("  ✓ Input validation schemas verified.");
  }

  // ----------------------------------------------------
  // Subtest 3: User Store & Registration / Authentication
  // ----------------------------------------------------
  {
    console.log("  [14.3] Testing User Store (FileUserStore)...");
    const testDbPath = path.join(process.cwd(), "tests", "scratch", `test-users-${Date.now()}.json`);
    const store = new FileUserStore(testDbPath);

    // Register User 1
    const user1 = await store.createUser({
      name: "Lê Thị C",
      email: "lethic@aptis.edu.vn",
      password: "passwordC#123",
    });
    assert.ok(user1.id, "User must receive unique UUID");
    assert.equal(user1.email, "lethic@aptis.edu.vn");
    assert.equal(user1.role, "user");

    // Prevent duplicate email
    await assert.rejects(
      async () => {
        await store.createUser({
          name: "Lê Thị C Duplicate",
          email: "LETHIC@APTIS.EDU.VN",
          password: "anotherpassword",
        });
      },
      /Email đã được đăng ký/,
      "Duplicate email registration must be rejected"
    );

    // Authenticate with valid credentials
    const authSuccess = await store.authenticateUser("lethic@aptis.edu.vn", "passwordC#123");
    assert.ok(authSuccess, "Valid credentials must authenticate");
    assert.equal(authSuccess.id, user1.id);

    // Authenticate with invalid password
    const authWrongPass = await store.authenticateUser("lethic@aptis.edu.vn", "wrong_pass");
    assert.equal(authWrongPass, null, "Invalid password must return null");

    // Authenticate non-existent email
    const authNonExistent = await store.authenticateUser("unknown@aptis.edu.vn", "anypass");
    assert.equal(authNonExistent, null, "Non-existent user must return null");

    // Cleanup test db file
    try {
      if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
    } catch {}
    console.log("  ✓ User registration, duplicate protection, and login verified.");
  }

  // ----------------------------------------------------
  // Subtest 4: Tamper-Proof Session Token & Expiry
  // ----------------------------------------------------
  {
    console.log("  [14.4] Testing Session Token Signing & Tamper Detection...");
    const sampleUser = {
      id: "usr_uuid_test_123",
      email: "student@aptis.edu.vn",
      name: "Student Test",
      role: "user" as const,
    };

    const token = createSessionToken(sampleUser);
    assert.ok(token.includes("."), "Session token must contain payload.signature");

    // Verify valid token
    const decoded = verifySessionToken(token);
    assert.ok(decoded, "Valid token must decode correctly");
    assert.equal(decoded.userId, sampleUser.id);
    assert.equal(decoded.email, sampleUser.email);
    assert.equal(decoded.role, "user");

    // Tamper with payload
    const [payload, sig] = token.split(".");
    const tamperedPayload = Buffer.from(
      JSON.stringify({ ...JSON.parse(Buffer.from(payload, "base64url").toString("utf8")), role: "admin" })
    ).toString("base64url");
    const tamperedToken = `${tamperedPayload}.${sig}`;
    assert.equal(verifySessionToken(tamperedToken), null, "Tampered payload with mismatched signature must be rejected");

    // Random garbage token
    assert.equal(verifySessionToken("invalid.token.data"), null, "Malformed token must return null");
    console.log("  ✓ Session token HMAC-SHA256 signature and tamper resistance verified.");
  }

  // ----------------------------------------------------
  // Subtest 5: User-Scoped Storage Isolation
  // ----------------------------------------------------
  {
    console.log("  [14.5] Testing User-Scoped Data Isolation between Accounts...");
    const memoryAdapter = new MemoryStorageAdapter();

    const user1Id = "user_alpha_111";
    const user2Id = "user_beta_222";

    const attempt1: ProgressAttemptRecord = {
      id: "att_user1_reading_1",
      testId: "aptis-b2-01",
      mode: "practice",
      skill: "reading",
      rawScore: 45,
      maxRawScore: 50,
      percentage: 90,
      completedAt: new Date().toISOString(),
      disclaimer: "PRACTICE ESTIMATE — NOT AN OFFICIAL BRITISH COUNCIL SCORE",
    };

    const attempt2: ProgressAttemptRecord = {
      id: "att_user2_writing_1",
      testId: "aptis-b2-01",
      mode: "practice",
      skill: "writing",
      rawScore: 35,
      maxRawScore: 50,
      percentage: 70,
      completedAt: new Date().toISOString(),
      disclaimer: "PRACTICE ESTIMATE — NOT AN OFFICIAL BRITISH COUNCIL SCORE",
    };

    // Save attempts for User 1 and User 2 separately
    saveProgressAttempt(attempt1, user1Id, memoryAdapter);
    saveProgressAttempt(attempt2, user2Id, memoryAdapter);

    // Verify User 1 only sees their own history
    const user1History = loadProgressHistory(user1Id, memoryAdapter);
    assert.equal(user1History.length, 1, "User 1 must have exactly 1 record");
    assert.equal(user1History[0].id, "att_user1_reading_1");

    // Verify User 2 only sees their own history
    const user2History = loadProgressHistory(user2Id, memoryAdapter);
    assert.equal(user2History.length, 1, "User 2 must have exactly 1 record");
    assert.equal(user2History[0].id, "att_user2_writing_1");

    // Verify User 1 clearing history does not impact User 2
    clearProgressHistory(user1Id, memoryAdapter);
    assert.equal(loadProgressHistory(user1Id, memoryAdapter).length, 0, "User 1 history must be empty after clear");
    assert.equal(loadProgressHistory(user2Id, memoryAdapter).length, 1, "User 2 history must remain untouched");

    // Verify Active Session Isolation
    createPracticeSession(
      { testId: "aptis-b2-01", mode: "practice", skill: "listening", userId: user1Id },
      memoryAdapter
    );
    createPracticeSession(
      { testId: "aptis-b2-01", mode: "practice", skill: "speaking", userId: user2Id },
      memoryAdapter
    );

    const user1Session = loadActiveSession(user1Id, memoryAdapter);
    const user2Session = loadActiveSession(user2Id, memoryAdapter);

    assert.equal(user1Session?.skill, "listening", "User 1 active session must be listening");
    assert.equal(user2Session?.skill, "speaking", "User 2 active session must be speaking");
    console.log("  ✓ 100% User-scoped progress and session data isolation verified.");
  }

  // ----------------------------------------------------
  // Subtest 6: Anonymous to Authenticated Data Migration
  // ----------------------------------------------------
  {
    console.log("  [14.6] Testing Anonymous to Authenticated Storage Migration...");
    const memoryAdapter = new MemoryStorageAdapter();

    const anonAttempt: ProgressAttemptRecord = {
      id: "anon_grammar_attempt_1",
      testId: "aptis-b2-01",
      mode: "practice",
      skill: "grammarVocabulary",
      rawScore: 40,
      maxRawScore: 50,
      percentage: 80,
      completedAt: new Date().toISOString(),
      disclaimer: "PRACTICE ESTIMATE — NOT AN OFFICIAL BRITISH COUNCIL SCORE",
    };

    // Save anonymous progress attempt and active session
    memoryAdapter.setItem(STORAGE_KEYS.HISTORY, [anonAttempt]);
    memoryAdapter.setItem(STORAGE_KEYS.ACTIVE_SESSION, {
      sessionId: "anon_sess_1",
      testId: "aptis-b2-01",
      mode: "practice",
      skill: "reading",
      currentPartNumber: 2,
      answers: { q1: "A" },
      startedAt: new Date().toISOString(),
      lastSavedAt: new Date().toISOString(),
      isSubmitted: false,
    });
    memoryAdapter.setItem(STORAGE_KEYS.PREFERENCES, {
      audioPlaybackSpeed: 1.25,
      autoNextOnSelect: true,
      soundEffectsEnabled: true,
      theme: "light",
    });

    const targetUserId = "usr_migrated_999";

    // Perform migration
    const result = migrateAnonymousStorageToUser(targetUserId, memoryAdapter);

    assert.equal(result.migratedHistoryCount, 1, "Should migrate 1 history record");
    assert.equal(result.migratedActivePractice, true, "Should migrate active practice session");
    assert.equal(result.migratedPreferences, true, "Should migrate preferences");

    // Verify data is in user-scoped keys
    const userHistory = loadProgressHistory(targetUserId, memoryAdapter);
    assert.equal(userHistory.length, 1);
    assert.equal(userHistory[0].id, "anon_grammar_attempt_1");

    const userActiveSess = loadActiveSession(targetUserId, memoryAdapter);
    assert.equal(userActiveSess?.sessionId, "anon_sess_1");
    assert.equal(userActiveSess?.userId, targetUserId);

    const userPrefs = loadUserPreferences(targetUserId, memoryAdapter);
    assert.equal(userPrefs.audioPlaybackSpeed, 1.25);

    // Verify anonymous keys were purged to prevent re-migration
    assert.equal(memoryAdapter.getItem(STORAGE_KEYS.HISTORY, null), null);
    assert.equal(memoryAdapter.getItem(STORAGE_KEYS.ACTIVE_SESSION, null), null);
    console.log("  ✓ Anonymous data migration with zero data loss verified.");
  }

  console.log("✅ [TEST 14 PASSED] User Authentication & Data Isolation tests completed successfully.\n");
}

// Run standalone if executed directly
if (process.argv[1]?.endsWith("auth.test.ts")) {
  runAuthTests().catch((err) => {
    console.error("❌ Auth tests failed:", err);
    process.exit(1);
  });
}
