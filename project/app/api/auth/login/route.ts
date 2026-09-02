import { NextRequest, NextResponse } from "next/server";
import { LoginInputSchema } from "@/lib/auth/types";
import { getUserStore } from "@/lib/auth/user-store";
import { createSessionToken, getSessionCookieOptions } from "@/lib/auth/session";
import { persistSession } from "@/lib/auth/api";
import { clearAuthFailures, consumeAuthFailure, getClientIp, isAuthRateLimited } from "@/lib/security/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = LoginInputSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Thông tin đăng nhập không hợp lệ";
      return NextResponse.json({ success: false, error: firstError }, { status: 400 });
    }

    const clientIp = getClientIp(req);
    const rateKey = `${clientIp}:${parsed.data.email}`;
    const ipRateKey = `${clientIp}:__all__`;
    const limited = isAuthRateLimited(rateKey) || isAuthRateLimited(ipRateKey);
    if (limited) {
      return NextResponse.json(
        { success: false, error: "Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau." },
        { status: 429, headers: { "Retry-After": String(limited) } },
      );
    }

    const store = getUserStore();
    const user = await store.authenticateUser(parsed.data.email, parsed.data.password);

    if (!user) {
      const accountRetryAfter = consumeAuthFailure(rateKey);
      const ipRetryAfter = consumeAuthFailure(ipRateKey);
      const retryAfter = accountRetryAfter || ipRetryAfter;
      if (retryAfter) {
        return NextResponse.json(
          { success: false, error: "Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau." },
          { status: 429, headers: { "Retry-After": String(retryAfter) } },
        );
      }
      return NextResponse.json(
        { success: false, error: "Email hoặc mật khẩu không chính xác." },
        { status: 401 }
      );
    }

    clearAuthFailures(rateKey);

    // Create session token and set cookie
    const token = createSessionToken(user);
    const session = (await import("@/lib/auth/session")).verifySessionToken(token);
    if (!session) throw new Error("Unable to create session");
    await persistSession(session);
    const cookieOpts = getSessionCookieOptions();

    const response = NextResponse.json({
      success: true,
      data: user,
    });

    response.cookies.set(cookieOpts.name, token, {
      httpOnly: cookieOpts.httpOnly,
      secure: cookieOpts.secure,
      sameSite: cookieOpts.sameSite,
      path: cookieOpts.path,
      maxAge: cookieOpts.maxAge,
    });

    return response;
  } catch (err) {
    console.error("[Auth Login Error]", err);
    return NextResponse.json({ success: false, error: "Đăng nhập thất bại" }, { status: 500 });
  }
}
