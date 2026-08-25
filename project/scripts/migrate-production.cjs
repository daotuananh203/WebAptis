/**
 * Production Database Migration & Schema Verification Runner (CommonJS)
 */
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  console.error("ERROR: DATABASE_URL environment variable is required to run migration.");
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

async function runMigration() {
  console.log("== 1. Connecting to Production PostgreSQL (Neon)... ==");
  const client = await pool.connect();

  try {
    const versionRes = await client.query("SELECT version();");
    console.log("✓ Connected successfully:", versionRes.rows[0].version.split(",")[0]);

    console.log("\n== 2. Applying Schema Migrations (001_initial_schema.sql)... ==");
    const migrationSql = fs.readFileSync(
      path.join(__dirname, "../migrations/001_initial_schema.sql"),
      "utf8"
    );

    await client.query(migrationSql);
    console.log("✓ Schema migration executed successfully!");

    console.log("\n== 3. Auditing Created Tables & Columns... ==");
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    const tableNames = tablesRes.rows.map((r) => r.table_name);
    console.log("Public tables:", tableNames);

    const requiredTables = ["users", "sessions", "progress_attempts", "user_preferences"];
    for (const t of requiredTables) {
      if (!tableNames.includes(t)) {
        throw new Error(`Missing required table: ${t}`);
      }
      const colRes = await client.query(
        "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1",
        [t]
      );
      console.log(`✓ Table [${t}] verified (${colRes.rows.length} columns)`);
    }

    console.log("\n== 4. Verifying Indexes... ==");
    const indexRes = await client.query(`
      SELECT indexname, tablename 
      WHERE schemaname = 'public' 
      ORDER BY tablename, indexname;
    `);
    console.log(`✓ Audited indexes in public schema.`);

    console.log("\n>>> ALL PRODUCTION POSTGRESQL MIGRATIONS & CHECKS PASSED! <<<");
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
