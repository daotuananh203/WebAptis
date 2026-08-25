import * as React from "react";
import { Flame, Calendar, Trophy } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { DailyStreakSummary } from "@/lib/progress/types";

export interface StreakBannerProps {
  streak: DailyStreakSummary;
}

export function StreakBanner({ streak }: StreakBannerProps) {
  return (
    <Card className="border-amber-200/80 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent shadow-xs">
      <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-md shadow-amber-500/20">
            <Flame className="h-6 w-6 fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 leading-none">
                Chuỗi {streak.currentStreak} ngày học
              </h2>
              {streak.isActiveToday ? (
                <Badge variant="success" className="text-[10px] px-1.5 py-0">
                  Hôm nay đã học
                </Badge>
              ) : (
                <Badge variant="warning" className="text-[10px] px-1.5 py-0">
                  Chưa luyện hôm nay
                </Badge>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-600">
              {streak.isActiveToday
                ? "Tuyệt vời! Bạn đã hoàn thành mục tiêu học tập ngày hôm nay."
                : "Luyện ít nhất 1 bài ngắn hôm nay để duy trì chuỗi học tập!"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 border-t sm:border-t-0 sm:border-l border-amber-200/60 pt-3 sm:pt-0 sm:pl-5 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Trophy className="h-4 w-4 text-amber-600" />
            <span>
              Kỷ lục: <strong className="text-slate-900 font-semibold">{streak.longestStreak} ngày</strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Calendar className="h-4 w-4 text-slate-400" />
            <span>
              Tổng cộng: <strong className="text-slate-900 font-semibold">{streak.totalActiveDays} ngày</strong>
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
