import { NextRequest, NextResponse } from "next/server";
import { getProgressStore } from "@/lib/db/progress-store";
import { isDatabaseConfigured } from "@/lib/db/client";
import { getAuthenticatedSessionAsync, unauthorizedResponse } from "@/lib/auth/api";
import { validateProgressAttempt } from "@/lib/progress/validation";

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthenticatedSessionAsync(req);
    if (!session) return unauthorizedResponse();

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
    console.error("[Progress GET Error]", err);
    return NextResponse.json({ success: false, error: "Lỗi truy vấn tiến độ học tập" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthenticatedSessionAsync(req);
    if (!session) return unauthorizedResponse();

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: "JSON payload không hợp lệ" }, { status: 400 });
    }
    const candidates: unknown[] = Array.isArray(body) ? body : [body];
    const records = candidates.map(validateProgressAttempt);

    if (records.length === 0 || records.some((item) => !item.success)) {
      return NextResponse.json(
        { success: false, error: "Dữ liệu bài làm không hợp lệ" },
        { status: 400 }
      );
    }

    const validRecords = records.filter(
      (item): item is Extract<typeof item, { success: true }> => item.success,
    ).map((item) => item.data);

    if (isDatabaseConfigured()) {
      const store = getProgressStore();
      for (const rec of validRecords) {
        const saved = await store.saveAttempt(session.userId, rec);
        if (!saved) {
          return NextResponse.json(
            { success: false, error: "Progress record đã thuộc về user khác" },
            { status: 409 },
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: { syncedCount: validRecords.length },
    });
  } catch (err) {
    console.error("[Progress POST Error]", err);
    return NextResponse.json({ success: false, error: "Lỗi lưu tiến độ học tập" }, { status: 500 });
  }
}
