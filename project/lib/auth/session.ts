/**
 * Session Token Signing, Verification & Cookie Helpers
 * Uses HMAC-SHA256 signatures for tamper-proof session cookies.
 */

import crypto from "crypto";
import { AuthSession, AUTH_COOKIE_NAME, SESSION_MAX_AGE_SECONDS, UserRecord } from "./types";

const AUTH_SECRET =
  process.env.AUTH_SECRET ||
  process.env.SESSION_SECRET ||
  "aptis_b2_production_secret_key_change_in_env_2026";

/**
 * Sign a payload string with HMAC-SHA256.
 */
function signPayload(payloadB64: string): string {
  return crypto
    .createHmac("sha256", AUTH_SECRET)
    .update(payloadB64)
    .digest("base64url");
}

/**
 * Create a signed session token string for a user.
 */
export function createSessionToken(user: Pick<UserRecord, "id" | "email" | "name" | "role">): string {
  const now = Math.floor(Date.now() / 1000);
  const session: AuthSession = {
    sessionId: crypto.randomUUID(),
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: now,
    expiresAt: now + SESSION_MAX_AGE_SECONDS,
  };

  const payloadB64 = Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
  const signature = signPayload(payloadB64);
  return `${payloadB64}.${signature}`;
}

/**
 * Verify and decode a session token string.
 * Returns AuthSession if valid and unexpired, or null otherwise.
 */
export function verifySessionToken(token: string): AuthSession | null {
  if (!token || typeof token !== "string") return null;

  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [payloadB64, signature] = parts;
  if (!payloadB64 || !signature) return null;

  const expectedSignature = signPayload(payloadB64);
  const sigBuffer = Buffer.from(signature, "utf8");
  const expectedSigBuffer = Buffer.from(expectedSignature, "utf8");

  if (sigBuffer.length !== expectedSigBuffer.length) {
    return null;
  }

  if (!crypto.timingSafeEqual(sigBuffer, expectedSigBuffer)) {
    return null;
  }

  try {
    const rawJson = Buffer.from(payloadB64, "base64url").toString("utf8");
    const session = JSON.parse(rawJson) as AuthSession;

    const now = Math.floor(Date.now() / 1000);
    if (!session.expiresAt || session.expiresAt < now) {
      return null; // Expired
    }

    if (!session.userId || !session.email) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

/**
 * Build standard Set-Cookie header parameters for session cookie.
 */
export function getSessionCookieOptions(isLogout = false) {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    name: AUTH_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax" as const,
    path: "/",
    maxAge: isLogout ? 0 : SESSION_MAX_AGE_SECONDS,
  };
}
