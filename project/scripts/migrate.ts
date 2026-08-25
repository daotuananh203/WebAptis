/**
 * Versioned Database Migration Runner
 * Applies SQL migration scripts from project/migrations/ sequentially to PostgreSQL (Neon/Managed).
 * Usage: tsx scripts/migrate.ts
 */

import fs from "fs";
import path from "path";
import { neon, neonConfig } from "@neondatabase/serverless";
import pg from "pg";

const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;

export async function runMigrations(customDbUrl?: string): Promise<{ applied: string[]; total: number }> {
  const dbUrl = customDbUrl || DATABASE_URL;

  if (!dbUrl) {
    throw new Error(
      "DATABASE_URL or POSTGRES_URL environment variable is missing. Cannot execute migrations."
    );
  }

  const migrationsDir = path.join(process.cwd(), "migrations");
  if (!fs.existsSync(migrationsDir)) {
    throw new Error(`Migrations directory not found at: ${migrationsDir}`);
  }

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  console.log(`[Migration] Found ${files.length} migration file(s). Connecting to PostgreSQL...`);

  // Use pg Pool for migration execution
  const client = new pg.Client({ connectionString: dbUrl });
  await client.connect();

  const applied: string[] = [];

  try {
    // 1. Ensure migrations tracking table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Fetch already applied migrations
    const res = await client.query("SELECT name FROM _migrations ORDER BY id ASC");
    const appliedSet = new Set(res.rows.map((r: { name: string }) => r.name));

    // 3. Apply pending migrations sequentially in transactions
    for (const file of files) {
      if (appliedSet.has(file)) {
        console.log(`  - [SKIP] ${file} (already applied)`);
        continue;
      }

      console.log(`  ▶ [APPLYING] ${file}...`);
      const sqlContent = fs.readFileSync(path.join(migrationsDir, file), "utf8");

      await client.query("BEGIN");
      try {
        await client.query(sqlContent);
        await client.query("INSERT INTO _migrations (name) VALUES ($1)", [file]);
        await client.query("COMMIT");
        applied.push(file);
        console.log(`  ✓ [APPLIED] ${file}`);
      } catch (err) {
        await client.query("ROLLBACK");
        throw new Error(`Migration failed on file "${file}": ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    console.log(`[Migration Complete] Successfully applied ${applied.length} new migration(s).\n`);
    return { applied, total: files.length };
  } finally {
    await client.end();
  }
}

// CLI execution
if (process.argv[1]?.endsWith("migrate.ts")) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("❌ Migration error:", err);
      process.exit(1);
    });
}
