import { NextRequest, NextResponse } from "next/server";
import { getUserStore } from "@/lib/auth/user-store";
import { getAuthenticatedSessionAsync } from "@/lib/auth/api";

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthenticatedSessionAsync(req);
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
    console.error("[Auth Me Error]", err);
    return NextResponse.json({ success: false, error: "Lỗi xác thực" }, { status: 500 });
  }
}
