"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { ExamResult } from "@/components/mock-test/exam-result";
import { loadActiveMockTestSession, loadCompletedMockTestSession } from "@/lib/storage/session";
import { MockTestSessionState } from "@/lib/storage/types";

import { useAuth } from "@/lib/hooks/use-auth";
import { formatTestDisplayName } from "@/lib/exam/test-catalog";

export default function MockTestResultPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  const { user, isLoading: isAuthLoading } = useAuth();

  const [session, setSession] = React.useState<MockTestSessionState | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (isAuthLoading) return;
    const loaded = loadCompletedMockTestSession(sessionId, user?.id) || loadActiveMockTestSession(user?.id);
    if (loaded && (loaded.sessionId === sessionId || loaded.isSubmitted)) {
      setSession(loaded);
    }
    setIsLoading(false);
  }, [sessionId, user?.id, isAuthLoading]);

  if (isLoading) {
    return (
      <AppShell>
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-300" />
          <p className="text-xs font-bold text-slate-300">Đang tải báo cáo điểm...</p>
        </div>
      </AppShell>
    );
  }

  if (!session) {
    return (
      <AppShell
        breadcrumbs={[
          { label: "Thi thử Mock Test", href: "/mock-test" },
          { label: "Không tìm thấy kết quả" },
        ]}
      >
        <div className="py-20 text-center space-y-3">
          <h3 className="text-base font-bold text-white">Không tìm thấy bài thi</h3>
          <p className="text-xs text-slate-300">
            Không tìm thấy phiên làm bài thi thử nào trùng khớp với mã {sessionId}.
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      breadcrumbs={[
        { label: "Thi thử Mock Test", href: "/mock-test" },
        { label: `Báo cáo điểm: ${formatTestDisplayName(session.testId)}` },
      ]}
      headerTitle="Báo cáo kết quả bài thi thử"
      headerDescription="Xem chi tiết điểm số 5 kỹ năng, ước lượng chuẩn CEFR và đánh giá từ Cố vấn AI."
    >
      <ExamResult session={session} />
    </AppShell>
  );
}
