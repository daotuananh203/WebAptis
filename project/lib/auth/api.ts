import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, AuthSession } from "./types";
import { markSessionRevoked, verifySessionToken } from "./session";
import { isDatabaseConfigured, query, queryOne } from "@/lib/db/client";

/** Return the cryptographically verified session attached to an API request. */
export function getAuthenticatedSession(req: NextRequest): AuthSession | null {
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  return token ? verifySessionToken(token) : null;
}

/** HMAC verification plus durable server-side session revocation check. */
export async function getAuthenticatedSessionAsync(req: NextRequest): Promise<AuthSession | null> {
  const session = getAuthenticatedSession(req);
  if (!session) return null;

  if (!isDatabaseConfigured()) {
    // The local production smoke harness opts into an in-memory user/session
    // store with E2E_MEMORY_ONLY.  A real production deployment without a
    // database must still fail closed and reject every protected request.
    const localMemoryAuthAllowed = process.env.E2E_MEMORY_ONLY === "true" || process.env.ALLOW_MEMORY_STORE === "true";
    return process.env.NODE_ENV === "production" && !localMemoryAuthAllowed ? null : session;
  }

  const active = await queryOne<{ id: string }>(
    `SELECT id FROM sessions
     WHERE id = $1 AND user_id = $2 AND expires_at > CURRENT_TIMESTAMP
     LIMIT 1`,
    [session.sessionId, session.userId],
  );
  return active ? session : null;
}

export async function persistSession(session: AuthSession): Promise<void> {
  if (!isDatabaseConfigured()) {
    const localMemoryAuthAllowed = process.env.E2E_MEMORY_ONLY === "true" || process.env.ALLOW_MEMORY_STORE === "true";
    if (process.env.NODE_ENV === "production" && !localMemoryAuthAllowed) {
      throw new Error("Session persistence is not configured");
    }
    return;
  }

  await query(
    `INSERT INTO sessions (id, user_id, expires_at)
     VALUES ($1, $2, to_timestamp($3))
     ON CONFLICT (id) DO NOTHING`,
    [session.sessionId, session.userId, session.expiresAt],
  );
}

export async function revokeSession(session: AuthSession | null): Promise<void> {
  if (!session) return;
  markSessionRevoked(session.sessionId);
  if (isDatabaseConfigured()) {
    await query(`DELETE FROM sessions WHERE id = $1 AND user_id = $2`, [session.sessionId, session.userId]);
  }
}

export function unauthorizedResponse(): NextResponse {
  return NextResponse.json(
    { success: false, error: "Authentication required" },
    { status: 401 },
  );
}
