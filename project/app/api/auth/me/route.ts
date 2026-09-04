import { NextRequest, NextResponse } from "next/server";
import { getUserStore } from "@/lib/auth/user-store";
import { getAuthenticatedSessionAsync } from "@/lib/auth/api";
import { getSessionCookieOptions } from "@/lib/auth/session";

function expiredSessionResponse(error: string) {
  const response = NextResponse.json(
    { success: false, error },
    { status: 401, headers: { "cache-control": "no-store" } },
  );
  const cookie = getSessionCookieOptions(true);
  response.cookies.set(cookie.name, "", {
    httpOnly: cookie.httpOnly,
    secure: cookie.secure,
    sameSite: cookie.sameSite,
    path: cookie.path,
    maxAge: 0,
  });
  return response;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthenticatedSessionAsync(req);
    if (!session) {
      return expiredSessionResponse("Phiên đăng nhập đã hết hạn hoặc không hợp lệ");
    }

    const store = getUserStore();
    const user = await store.findUserById(session.userId);

    if (!user) {
      return expiredSessionResponse("Người dùng không tồn tại");
    }

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (err) {
    console.error("[Auth Me Error]", err);
    return NextResponse.json({ success: false, error: "Lỗi xác thực" }, { status: 500 });
  }
}
