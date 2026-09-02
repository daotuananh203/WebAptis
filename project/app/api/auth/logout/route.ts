import { NextResponse } from "next/server";
import { getSessionCookieOptions, verifySessionToken } from "@/lib/auth/session";
import { AUTH_COOKIE_NAME } from "@/lib/auth/types";
import { revokeSession } from "@/lib/auth/api";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  await revokeSession(token ? verifySessionToken(token) : null);
  const cookieOpts = getSessionCookieOptions(true);
  const response = NextResponse.json({ success: true });

  response.cookies.set(cookieOpts.name, "", {
    httpOnly: cookieOpts.httpOnly,
    secure: cookieOpts.secure,
    sameSite: cookieOpts.sameSite,
    path: cookieOpts.path,
    maxAge: 0,
  });

  return response;
}
