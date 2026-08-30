/**
 * PostgreSQL Progress Repository
 * Server-side source of truth for user attempt records and practice history.
 * Enforces strict user data isolation via parameterized queries.
 */

import { ProgressAttemptRecord } from "../progress/types";
import { query, queryOne } from "./client";

function isMissingPracticeItemColumn(error: unknown): boolean {
  const candidate = error as { code?: string; message?: string } | null;
  return candidate?.code === "42703" || Boolean(candidate?.message?.includes("practice_item_id"));
}

// Vercel deployments do not execute the repository's SQL files automatically.
// If an older production database is missing the provenance column, upgrade it
// once, on demand, before persisting a record that needs practiceItemId.  The
// IF NOT EXISTS DDL is safe across concurrent serverless instances.
let practiceItemColumnMigration: Promise<void> | null = null;

async function ensurePracticeItemColumn(): Promise<void> {
  if (!practiceItemColumnMigration) {
    practiceItemColumnMigration = query(
      "ALTER TABLE progress_attempts ADD COLUMN IF NOT EXISTS practice_item_id VARCHAR(255)",
    )
      .then(() => undefined)
      .catch((error) => {
        practiceItemColumnMigration = null;
        throw error;
      });
  }
  return practiceItemColumnMigration;
}

export interface IProgressStore {
  saveAttempt(userId: string, record: ProgressAttemptRecord): Promise<boolean>;
  getAttemptsByUser(userId: string, limit?: number): Promise<ProgressAttemptRecord[]>;
  getAttemptsBySkill(userId: string, skill: string): Promise<ProgressAttemptRecord[]>;
  clearAttemptsByUser(userId: string): Promise<boolean>;
}

export class PostgresProgressStore implements IProgressStore {
  async saveAttempt(userId: string, record: ProgressAttemptRecord): Promise<boolean> {
    if (!userId || !record.id) {
      throw new Error("userId and record.id are required to persist progress attempt.");
    }

    const sql = `
      INSERT INTO progress_attempts (
        id, user_id, test_id, practice_item_id, mode, skill, part_identifier,
        raw_score, max_raw_score, percentage, estimated_band,
        duration_seconds, completed_at, disclaimer
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT (id) DO UPDATE SET
        raw_score = EXCLUDED.raw_score,
        max_raw_score = EXCLUDED.max_raw_score,
        percentage = EXCLUDED.percentage,
        estimated_band = EXCLUDED.estimated_band,
        duration_seconds = EXCLUDED.duration_seconds,
        completed_at = EXCLUDED.completed_at
      WHERE progress_attempts.user_id = EXCLUDED.user_id;
    `;

    const params = [
      record.id,
      userId,
      record.testId,
      record.practiceItemId || null,
      record.mode,
      record.skill,
      record.partIdentifier || null,
      record.rawScore,
      record.maxRawScore,
      record.percentage,
      record.estimatedBand || null,
      record.durationSeconds || 0,
      record.completedAt,
      record.disclaimer || "PRACTICE ESTIMATE — NOT AN OFFICIAL BRITISH COUNCIL SCORE",
    ];

    try {
      await query(sql, params);
    } catch (error) {
      // 001 was already deployed before Practice Bank provenance existed.
      // Upgrade an older production database on demand rather than silently
      // dropping practiceItemId from the persisted result.
      if (!isMissingPracticeItemColumn(error)) throw error;
      try {
        await ensurePracticeItemColumn();
        await query(sql, params);
        return true;
      } catch (migrationError) {
        // A record carrying practice provenance must fail closed if the
        // schema cannot be upgraded; silently storing it without the ID would
        // make History unable to identify the Practice item.
        if (record.practiceItemId) throw migrationError;
      }
      await query(
        `
          INSERT INTO progress_attempts (
            id, user_id, test_id, mode, skill, part_identifier,
            raw_score, max_raw_score, percentage, estimated_band,
            duration_seconds, completed_at, disclaimer
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          ON CONFLICT (id) DO UPDATE SET
            raw_score = EXCLUDED.raw_score,
            max_raw_score = EXCLUDED.max_raw_score,
            percentage = EXCLUDED.percentage,
            estimated_band = EXCLUDED.estimated_band,
            duration_seconds = EXCLUDED.duration_seconds,
            completed_at = EXCLUDED.completed_at
          WHERE progress_attempts.user_id = EXCLUDED.user_id;
        `,
        [
          record.id,
          userId,
          record.testId,
          record.mode,
          record.skill,
          record.partIdentifier || null,
          record.rawScore,
          record.maxRawScore,
          record.percentage,
          record.estimatedBand || null,
          record.durationSeconds || 0,
          record.completedAt,
          record.disclaimer || "PRACTICE ESTIMATE — NOT AN OFFICIAL BRITISH COUNCIL SCORE",
        ],
      );
    }
    return true;
  }

  async getAttemptsByUser(userId: string, limit: number = 500): Promise<ProgressAttemptRecord[]> {
    if (!userId) return [];

    const sql = `
      SELECT
        id,
        test_id AS "testId",
        practice_item_id AS "practiceItemId",
        mode,
        skill,
        part_identifier AS "partIdentifier",
        CAST(raw_score AS FLOAT) AS "rawScore",
        CAST(max_raw_score AS FLOAT) AS "maxRawScore",
        percentage,
        estimated_band AS "estimatedBand",
        duration_seconds AS "durationSeconds",
        completed_at AS "completedAt",
        disclaimer
      FROM progress_attempts
      WHERE user_id = $1
      ORDER BY completed_at ASC
      LIMIT $2;
    `;

    let rows: any[];
    try {
      rows = await query<any>(sql, [userId, limit]);
    } catch (error) {
      if (!isMissingPracticeItemColumn(error)) throw error;
      rows = await query<any>(
        `
          SELECT
            id,
            test_id AS "testId",
            mode,
            skill,
            part_identifier AS "partIdentifier",
            CAST(raw_score AS FLOAT) AS "rawScore",
            CAST(max_raw_score AS FLOAT) AS "maxRawScore",
            percentage,
            estimated_band AS "estimatedBand",
            duration_seconds AS "durationSeconds",
            completed_at AS "completedAt",
            disclaimer
          FROM progress_attempts
          WHERE user_id = $1
          ORDER BY completed_at ASC
          LIMIT $2;
        `,
        [userId, limit],
      );
    }
    return rows.map((r) => ({
      id: r.id,
      testId: r.testId,
      practiceItemId: r.practiceItemId || undefined,
      mode: r.mode,
      skill: r.skill,
      partIdentifier: r.partIdentifier || undefined,
      rawScore: Number(r.rawScore),
      maxRawScore: Number(r.maxRawScore),
      percentage: Number(r.percentage),
      estimatedBand: r.estimatedBand || undefined,
      durationSeconds: Number(r.durationSeconds) || 0,
      completedAt: new Date(r.completedAt).toISOString(),
      disclaimer: r.disclaimer || "PRACTICE ESTIMATE — NOT AN OFFICIAL BRITISH COUNCIL SCORE",
    }));
  }

  async getAttemptsBySkill(userId: string, skill: string): Promise<ProgressAttemptRecord[]> {
    if (!userId) return [];

    const sql = `
      SELECT
        id,
        test_id AS "testId",
        practice_item_id AS "practiceItemId",
        mode,
        skill,
        part_identifier AS "partIdentifier",
        CAST(raw_score AS FLOAT) AS "rawScore",
        CAST(max_raw_score AS FLOAT) AS "maxRawScore",
        percentage,
        estimated_band AS "estimatedBand",
        duration_seconds AS "durationSeconds",
        completed_at AS "completedAt",
        disclaimer
      FROM progress_attempts
      WHERE user_id = $1 AND skill = $2
      ORDER BY completed_at ASC;
    `;

    let rows: any[];
    try {
      rows = await query<any>(sql, [userId, skill]);
    } catch (error) {
      if (!isMissingPracticeItemColumn(error)) throw error;
      rows = await query<any>(
        `
          SELECT
            id,
            test_id AS "testId",
            mode,
            skill,
            part_identifier AS "partIdentifier",
            CAST(raw_score AS FLOAT) AS "rawScore",
            max_raw_score AS "maxRawScore",
            percentage,
            estimated_band AS "estimatedBand",
            duration_seconds AS "durationSeconds",
            completed_at AS "completedAt",
            disclaimer
          FROM progress_attempts
          WHERE user_id = $1 AND skill = $2
          ORDER BY completed_at ASC;
        `,
        [userId, skill],
      );
    }
    return rows.map((r) => ({
      id: r.id,
      testId: r.testId,
      practiceItemId: r.practiceItemId || undefined,
      mode: r.mode,
      skill: r.skill,
      partIdentifier: r.partIdentifier || undefined,
      rawScore: Number(r.rawScore),
      maxRawScore: Number(r.maxRawScore),
      percentage: Number(r.percentage),
      estimatedBand: r.estimatedBand || undefined,
      durationSeconds: Number(r.durationSeconds) || 0,
      completedAt: new Date(r.completedAt).toISOString(),
      disclaimer: r.disclaimer || "PRACTICE ESTIMATE — NOT AN OFFICIAL BRITISH COUNCIL SCORE",
    }));
  }

  async clearAttemptsByUser(userId: string): Promise<boolean> {
    if (!userId) return false;
    await query("DELETE FROM progress_attempts WHERE user_id = $1", [userId]);
    return true;
  }
}

// Singleton instance
let globalProgressStore: IProgressStore | null = null;

export function getProgressStore(): IProgressStore {
  if (!globalProgressStore) {
    globalProgressStore = new PostgresProgressStore();
  }
  return globalProgressStore;
}
