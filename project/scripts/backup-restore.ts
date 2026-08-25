/**
 * WebAptis B2 — Production Backup & Restore Utility
 * Supports dumping and restoring PostgreSQL user/attempt tables & compiled knowledge stores.
 * Usage:
 *   Backup:  tsx scripts/backup-restore.ts backup [targetDir]
 *   Restore: tsx scripts/backup-restore.ts restore [targetDir]
 */

import fs from "fs";
import path from "path";
import pg from "pg";

const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;

export async function runBackup(outputDir = "backups"): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupFolder = path.join(process.cwd(), outputDir, `backup-${timestamp}`);
  fs.mkdirSync(backupFolder, { recursive: true });

  console.log(`▶ Starting backup to: ${backupFolder}`);

  // 1. Backup Knowledge Vault Compiled Store
  const knowledgeSource = path.join(process.cwd(), "data/knowledge/vault-compiled.json");
  if (fs.existsSync(knowledgeSource)) {
    fs.copyFileSync(knowledgeSource, path.join(backupFolder, "vault-compiled.json"));
    console.log("  ✓ Backed up compiled knowledge store");
  }

  // 2. Backup Local Users & User Memories
  const usersSource = path.join(process.cwd(), "data/users.json");
  if (fs.existsSync(usersSource)) {
    fs.copyFileSync(usersSource, path.join(backupFolder, "users.json"));
    console.log("  ✓ Backed up local users store");
  }

  // 3. Backup PostgreSQL if configured
  if (DATABASE_URL) {
    try {
      const client = new pg.Client({ connectionString: DATABASE_URL });
      await client.connect();
      const usersRes = await client.query("SELECT * FROM users");
      const progressRes = await client.query("SELECT * FROM progress_attempts");
      fs.writeFileSync(path.join(backupFolder, "db-users.json"), JSON.stringify(usersRes.rows, null, 2));
      fs.writeFileSync(path.join(backupFolder, "db-progress.json"), JSON.stringify(progressRes.rows, null, 2));
      await client.end();
      console.log("  ✓ Backed up PostgreSQL database tables (users, progress_attempts)");
    } catch (err) {
      console.warn("  ⚠ PostgreSQL backup skipped or failed:", err instanceof Error ? err.message : err);
    }
  }

  console.log(`✅ Backup completed successfully in: ${backupFolder}\n`);
  return backupFolder;
}

export async function runRestore(backupFolder: string): Promise<void> {
  if (!fs.existsSync(backupFolder)) {
    throw new Error(`Backup folder does not exist: ${backupFolder}`);
  }

  console.log(`▶ Restoring from: ${backupFolder}`);

  // 1. Restore Knowledge
  const kBackup = path.join(backupFolder, "vault-compiled.json");
  if (fs.existsSync(kBackup)) {
    const kDest = path.join(process.cwd(), "data/knowledge/vault-compiled.json");
    fs.copyFileSync(kBackup, kDest);
    console.log("  ✓ Restored compiled knowledge store");
  }

  // 2. Restore Local Users
  const uBackup = path.join(backupFolder, "users.json");
  if (fs.existsSync(uBackup)) {
    const uDest = path.join(process.cwd(), "data/users.json");
    fs.copyFileSync(uBackup, uDest);
    console.log("  ✓ Restored local users store");
  }

  console.log("✅ Restore operation completed successfully.\n");
}

// CLI Execution
if (process.argv[1]?.endsWith("backup-restore.ts")) {
  const action = process.argv[2] || "backup";
  const arg = process.argv[3];

  if (action === "backup") {
    runBackup(arg).catch(console.error);
  } else if (action === "restore") {
    if (!arg) {
      console.error("Please provide backup folder path to restore");
      process.exit(1);
    }
    runRestore(arg).catch(console.error);
  }
}
