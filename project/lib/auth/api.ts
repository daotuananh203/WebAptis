import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, AuthSession } from "./types";
import { verifySessionToken } from "./session";

/** Return the cryptographically verified session attached to an API request. */
export function getAuthenticatedSession(req: NextRequest): AuthSession | null {
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  return token ? verifySessionToken(token) : null;
}

export function unauthorizedResponse(): NextResponse {
  return NextResponse.json(
    { success: false, error: "Authentication required" },
    { status: 401 },
  );
}
