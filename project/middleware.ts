import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth/types";

const PROTECTED_ROUTES = [
  "/dashboard",
  "/practice",
  "/mock-test",
  "/coach",
  "/results",
];

const AUTH_PAGES = ["/login", "/register"];

function base64UrlToBytes(value: string): Uint8Array | null {
  try {
    const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const binary = atob(padded);
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  } catch {
    return null;
  }
}

async function validateSessionCookie(token?: string): Promise<boolean> {
  if (!token || typeof token !== "string") return false;

  try {
    const parts = token.split(".");
    if (parts.length !== 2) return false;

    const [payloadB64, signatureB64] = parts;
    const payloadBytes = base64UrlToBytes(payloadB64);
    const signatureBytes = base64UrlToBytes(signatureB64);
    const authSecret = process.env.AUTH_SECRET || process.env.SESSION_SECRET;
    if (!payloadBytes || !signatureBytes || !authSecret) return false;

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(authSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
    const validSignature = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes,
      new TextEncoder().encode(payloadB64),
    );
    if (!validSignature) return false;

    const jsonStr = new TextDecoder().decode(payloadBytes);
    const data = JSON.parse(jsonStr);

    const now = Math.floor(Date.now() / 1000);
    if (!data.userId || !data.expiresAt || data.expiresAt <= now) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Check session cookie
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  const isAuthenticated = await validateSessionCookie(token);

  // 1. If user is authenticated and visits /login or /register, redirect to /dashboard
  if (isAuthenticated && AUTH_PAGES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    const dashboardUrl = new URL("/dashboard", req.url);
    return NextResponse.redirect(dashboardUrl);
  }

  // 2. If user is NOT authenticated and visits a protected route, redirect to /login
  const isProtected = PROTECTED_ROUTES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (!isAuthenticated && isProtected) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api routes
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt
     */
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
