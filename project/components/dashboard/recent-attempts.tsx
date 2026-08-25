import * as React from "react";
import Link from "next/link";
import { History, BookOpen, GraduationCap, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Badge } from "../ui/badge";
import { EmptyState } from "../ui/empty-state";
import { ProgressAttemptRecord } from "@/lib/progress/types";

export interface RecentAttemptsProps {
  attempts: ProgressAttemptRecord[];
}

export function RecentAttempts({ attempts }: RecentAttemptsProps) {
  if (attempts.length === 0) {
    return (
      <Card className="border-slate-200 shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <History className="h-4 w-4 text-blue-600" />
            <span>Lịch sử làm bài gần đây</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Các bài luyện tập và thi thử mới nhất của bạn
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={BookOpen}
            title="Chưa có bài làm nào"
            description="Hãy bắt đầu với một bài luyện ngắn hoặc làm bài thi thử để theo dõi tiến độ."
            actionLabel="Bắt đầu luyện tập ngay"
            onAction={() => {
              if (typeof window !== "undefined") {
                window.location.href = "/practice?skill=grammarVocabulary";
              }
            }}
          />
        </CardContent>
      </Card>
    );
  }

  const sortedAttempts = [...attempts]
    .sort(
      (a, b) =>
        new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    )
    .slice(0, 5);

  return (
    <Card className="border-slate-200 shadow-xs">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <History className="h-4 w-4 text-blue-600" />
            <span>Lịch sử làm bài gần đây</span>
          </CardTitle>
          <CardDescription className="text-xs">
            5 bài làm gần nhất của bạn
          </CardDescription>
        </div>
        <Link href="/practice" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
          <span>Luyện thêm</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>

      <CardContent>
        <div className="divide-y divide-slate-100">
          {sortedAttempts.map((att) => {
            const isMock = att.mode === "mock-test";
            const dateStr = new Date(att.completedAt).toLocaleDateString("vi-VN", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={att.id}
                className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                      isMock
                        ? "bg-indigo-50 text-indigo-600"
                        : "bg-blue-50 text-blue-600"
                    }`}
                  >
                    {isMock ? (
                      <GraduationCap className="h-4 w-4" />
                    ) : (
                      <BookOpen className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 capitalize">
                        {att.skill} {att.partIdentifier ? `(${att.partIdentifier})` : ""}
                      </span>
                      <Badge variant="outline" className="text-[9px] px-1 py-0">
                        {isMock ? "Thi thử" : "Luyện tập"}
                      </Badge>
                      {att.estimatedBand && (
                        <Badge variant="secondary" className="text-[9px] px-1 py-0 font-bold bg-slate-100">
                          Band {att.estimatedBand}
                        </Badge>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400">{dateStr}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`text-sm font-bold block ${
                      att.percentage >= 75
                        ? "text-emerald-600"
                        : att.percentage >= 55
                        ? "text-blue-600"
                        : "text-amber-600"
                    }`}
                  >
                    {att.percentage}%
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {att.rawScore}/{att.maxRawScore} điểm
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
