import { NextRequest, NextResponse } from "next/server";
import { LoginInputSchema } from "@/lib/auth/types";
import { getUserStore } from "@/lib/auth/user-store";
import { createSessionToken, getSessionCookieOptions } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = LoginInputSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Thông tin đăng nhập không hợp lệ";
      return NextResponse.json({ success: false, error: firstError }, { status: 400 });
    }

    const store = getUserStore();
    const user = await store.authenticateUser(parsed.data.email, parsed.data.password);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Email hoặc mật khẩu không chính xác." },
        { status: 401 }
      );
    }

    // Create session token and set cookie
    const token = createSessionToken(user);
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
    const message = err instanceof Error ? err.message : "Đăng nhập thất bại";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
