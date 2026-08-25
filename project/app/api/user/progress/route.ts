import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth/types";
import { verifySessionToken } from "@/lib/auth/session";
import { getProgressStore } from "@/lib/db/progress-store";
import { isDatabaseConfigured } from "@/lib/db/client";
import { ProgressAttemptRecord } from "@/lib/progress/types";

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
        { success: false, error: "Phiên đăng nhập không hợp lệ" },
        { status: 401 }
      );
    }

    // If PostgreSQL is not configured (e.g. offline dev), return empty array gracefully
    if (!isDatabaseConfigured()) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    const store = getProgressStore();
    const attempts = await store.getAttemptsByUser(session.userId);

    return NextResponse.json({
      success: true,
      data: attempts,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Lỗi truy vấn tiến độ học tập";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
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
        { success: false, error: "Phiên đăng nhập không hợp lệ" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const records: ProgressAttemptRecord[] = Array.isArray(body)
      ? body
      : body && body.id
      ? [body]
      : [];

    if (records.length === 0) {
      return NextResponse.json(
        { success: false, error: "Dữ liệu bài làm không hợp lệ" },
        { status: 400 }
      );
    }

    if (isDatabaseConfigured()) {
      const store = getProgressStore();
      for (const rec of records) {
        await store.saveAttempt(session.userId, rec);
      }
    }

    return NextResponse.json({
      success: true,
      data: { syncedCount: records.length },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Lỗi lưu tiến độ học tập";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
