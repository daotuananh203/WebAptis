import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth/types";
import { verifySessionToken } from "@/lib/auth/session";
import { getUserStore } from "@/lib/auth/user-store";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Chưa đăng nhập" },
        { status: 401 }
      );
    }

    const session = verifySessionToken(token);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Phiên đăng nhập đã hết hạn hoặc không hợp lệ" },
        { status: 401 }
      );
    }

    const store = getUserStore();
    const user = await store.findUserById(session.userId);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Người dùng không tồn tại" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Lỗi xác thực";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
