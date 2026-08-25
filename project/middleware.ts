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

function validateSessionCookie(token?: string): boolean {
  if (!token || typeof token !== "string") return false;

  try {
    const parts = token.split(".");
    if (parts.length !== 2) return false;

    const [payloadB64] = parts;
    // Edge-safe base64url decode
    const base64 = payloadB64.replace(/-/g, "+").replace(/_/g, "/");
    const jsonStr = atob(base64);
    const data = JSON.parse(jsonStr);

    const now = Math.floor(Date.now() / 1000);
    if (!data.userId || !data.expiresAt || data.expiresAt < now) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Check session cookie
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  const isAuthenticated = validateSessionCookie(token);

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
