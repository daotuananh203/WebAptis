/**
 * PostgreSQL Database Client (Neon Serverless / Managed PostgreSQL)
 * Supports serverless connection pooling and explicit production failure boundaries.
 */

import pg from "pg";

const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;

let globalPool: pg.Pool | null = null;

export function getDatabasePool(): pg.Pool {
  if (globalPool) return globalPool;

  if (!DATABASE_URL) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "CRITICAL ERROR: DATABASE_URL or POSTGRES_URL is not configured in production environment."
      );
    }
    throw new Error(
      "DATABASE_URL is not configured. Set DATABASE_URL in .env.local or environment variables."
    );
  }

  globalPool = new Pool({
    connectionString: DATABASE_URL,
    ssl:
      DATABASE_URL.includes("localhost") || DATABASE_URL.includes("127.0.0.1")
        ? false
        : { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
  });

  return globalPool;
}

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL || process.env.POSTGRES_URL);
}

/**
 * Execute a parameterized query against PostgreSQL.
 */
export async function query<T = any>(
  sqlText: string,
  params: any[] = []
): Promise<T[]> {
  const pool = getDatabasePool();
  try {
    const res = await pool.query(sqlText, params);
    return res.rows as T[];
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[PostgreSQL Query Error]: ${message}`, { sqlText, params });
    throw err;
  }
}

/**
 * Execute a parameterized query and return single row or null.
 */
export async function queryOne<T = any>(
  sqlText: string,
  params: any[] = []
): Promise<T | null> {
  const rows = await query<T>(sqlText, params);
  return rows[0] || null;
}
