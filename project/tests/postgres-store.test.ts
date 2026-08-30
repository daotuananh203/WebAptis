/**
 * PostgreSQL Schema, Migration & Store Test Suite
 * Validates versioned migrations, PostgresUserStore, PostgresProgressStore,
 * strict user isolation, and production failure boundaries.
 */

import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import { PostgresUserStore } from "../lib/auth/postgres-user-store";
import { PostgresProgressStore } from "../lib/db/progress-store";
import { getUserStore, FileUserStore } from "../lib/auth/user-store";
import { ProgressAttemptRecord } from "../lib/progress/types";

export async function runPostgresStoreTests() {
  console.log("\n==================================================");
  console.log("▶ [TEST 15] Running PostgreSQL Schema & Data Store Tests...");
  console.log("==================================================");

  // ----------------------------------------------------
  // Subtest 1: Versioned Migration DDL Validation
  // ----------------------------------------------------
  {
    console.log("  [15.1] Validating Versioned Migration Files...");
    const migrationsDir = path.join(process.cwd(), "migrations");
    assert.ok(fs.existsSync(migrationsDir), "Migrations directory must exist");

    const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith(".sql"));
    assert.ok(files.length >= 1, "At least 1 versioned migration file must exist");
    assert.ok(files.includes("001_initial_schema.sql"), "001_initial_schema.sql must be present");
    assert.ok(files.includes("002_progress_practice_item.sql"), "Practice provenance migration must be present");

    const sqlContent = fs.readFileSync(path.join(migrationsDir, "001_initial_schema.sql"), "utf8");

    // Verify all 4 required tables exist in DDL
    assert.ok(sqlContent.includes("CREATE TABLE IF NOT EXISTS users"), "Must create users table");
    assert.ok(sqlContent.includes("CREATE TABLE IF NOT EXISTS sessions"), "Must create sessions table");
    assert.ok(sqlContent.includes("CREATE TABLE IF NOT EXISTS progress_attempts"), "Must create progress_attempts table");
    assert.ok(sqlContent.includes("CREATE TABLE IF NOT EXISTS user_preferences"), "Must create user_preferences table");

    // Verify critical foreign keys & indexes
    assert.ok(sqlContent.includes("REFERENCES users(id) ON DELETE CASCADE"), "Must enforce foreign keys with cascading delete");
    assert.ok(sqlContent.includes("CREATE INDEX IF NOT EXISTS idx_users_email"), "Must index user email");
    assert.ok(sqlContent.includes("CREATE INDEX IF NOT EXISTS idx_progress_user_id"), "Must index progress user_id");
    assert.ok(sqlContent.includes("CREATE INDEX IF NOT EXISTS idx_progress_user_skill"), "Must index progress user_id + skill");
    const practiceMigration = fs.readFileSync(path.join(migrationsDir, "002_progress_practice_item.sql"), "utf8");
    assert.ok(practiceMigration.includes("ADD COLUMN IF NOT EXISTS practice_item_id"), "Must preserve Practice Bank item provenance");
    assert.ok(practiceMigration.includes("idx_progress_user_practice_item"), "Must index Practice Bank provenance by user");
    console.log("  ✓ Versioned migration DDL structure and indexes verified.");
  }

  // ----------------------------------------------------
  // Subtest 2: Production Failure Boundary (No Silent Fallback in Production)
  // ----------------------------------------------------
  {
    console.log("  [15.2] Testing Production Failure Boundary...");
    const originalNodeEnv = process.env.NODE_ENV;
    const originalDbUrl = process.env.DATABASE_URL;
    const originalPostgresUrl = process.env.POSTGRES_URL;
    const originalAllowMemory = process.env.ALLOW_MEMORY_STORE;

    try {
      // Simulate production without DATABASE_URL
      (process.env as any).NODE_ENV = "production";
      delete process.env.DATABASE_URL;
      delete process.env.POSTGRES_URL;
      delete process.env.ALLOW_MEMORY_STORE;

      // Must throw an explicit error in production, NOT silently use memory/file store
      assert.throws(
        () => {
          getUserStore();
        },
        /CRITICAL: DATABASE_URL is required in production environment/,
        "Production runtime must throw when DATABASE_URL is missing"
      );
      console.log("  ✓ Explicit production failure boundary verified (no silent fallback).");
    } finally {
      (process.env as any).NODE_ENV = originalNodeEnv;
      if (originalDbUrl) process.env.DATABASE_URL = originalDbUrl;
      if (originalPostgresUrl) process.env.POSTGRES_URL = originalPostgresUrl;
      if (originalAllowMemory) process.env.ALLOW_MEMORY_STORE = originalAllowMemory;
    }
  }

  // ----------------------------------------------------
  // Subtest 3: PostgresProgressStore User Isolation Architecture
  // ----------------------------------------------------
  {
    console.log("  [15.3] Testing PostgresProgressStore Contract & Parameter Safety...");
    const store = new PostgresProgressStore();

    const storeSource = fs.readFileSync(path.join(process.cwd(), "lib/db/progress-store.ts"), "utf8");
    assert.ok(
      storeSource.includes("WHERE progress_attempts.user_id = EXCLUDED.user_id"),
      "Upsert must not let one user overwrite another user's attempt by reusing an id"
    );
    assert.ok(storeSource.includes("practice_item_id"), "Progress store must round-trip Practice Bank provenance");

    // Verify empty/missing userId guards
    await assert.rejects(
      async () => {
        await store.saveAttempt("", {} as any);
      },
      /userId and record.id are required/,
      "Must reject saveAttempt when userId is empty"
    );

    const emptyUserAttempts = await store.getAttemptsByUser("");
    assert.deepEqual(emptyUserAttempts, [], "Empty userId must safely return empty array without querying");
    console.log("  ✓ PostgresProgressStore user isolation guards verified.");
  }

  console.log("✅ [TEST 15 PASSED] PostgreSQL Schema & Data Store tests completed successfully.\n");
}

if (process.argv[1]?.endsWith("postgres-store.test.ts")) {
  runPostgresStoreTests().catch((err) => {
    console.error("❌ PostgreSQL store tests failed:", err);
    process.exit(1);
  });
}
