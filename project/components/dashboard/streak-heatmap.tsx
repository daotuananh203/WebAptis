"use client";

import * as React from "react";
import Link from "next/link";
import { Calendar, Flame, ArrowRight } from "lucide-react";
import { TwelveWeekHeatmapSummary, HeatmapIntensity } from "@/lib/progress/types";

export interface StreakHeatmapProps {
  heatmap: TwelveWeekHeatmapSummary;
  currentStreak: number;
}

const HEATMAP_COLORS: Record<HeatmapIntensity, string> = {
  0: "bg-[#1c1c24] border-[#262632] hover:border-slate-500",
  1: "bg-emerald-950/60 border-emerald-800/60 hover:border-emerald-600",
  2: "bg-emerald-700/70 border-emerald-600 hover:border-emerald-400",
  3: "bg-emerald-500 border-emerald-400 hover:border-emerald-300",
  4: "bg-teal-400 border-teal-300 hover:border-white shadow-xs shadow-teal-400/50",
};

export function StreakHeatmap({ heatmap, currentStreak }: StreakHeatmapProps) {
  const [onlyActive, setOnlyActive] = React.useState(false);
  const hasAnyData = heatmap.totalActivities > 0;

  return (
    <div className="rounded-2xl border border-[#22222a] bg-[#121215] p-5 sm:p-6 flex flex-col justify-between space-y-4 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
            <Calendar className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white leading-tight">
              Hành trình đều đặn
            </h3>
            <span className="text-[11px] text-slate-300">
              3 tháng gần nhất
            </span>
          </div>
        </div>

        {/* Big Streak Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-extrabold text-xs">
          <Flame className="h-4 w-4 fill-emerald-500 text-emerald-500 animate-pulse" />
          <span>{currentStreak} ngày streak</span>
        </div>
      </div>

      {/* Main Heatmap Grid or Empty State */}
      {!hasAnyData ? (
        <div className="py-6 px-4 rounded-xl border border-dashed border-[#22222c] bg-[#0d0d0f]/50 text-center space-y-2">
          <p className="text-xs text-slate-300">
            Chưa có dữ liệu làm bài trong 3 tháng qua.
          </p>
          <Link
            href="/practice"
            className="inline-flex items-center gap-1 text-xs font-bold text-emerald-300 hover:text-emerald-300"
          >
            <span>Hoàn thành bài đầu tiên ngay</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="overflow-x-auto pb-1 scrollbar-none">
            <div className="inline-grid grid-rows-7 grid-flow-col gap-1.5 min-w-[300px]">
              {heatmap.days.map((day) => {
                const isFiltered = onlyActive && day.intensity === 0;
                return (
                  <div
                    key={day.date}
                    title={`${day.date}: ${day.activityCount} bài (${day.totalMinutes} phút)`}
                    className={`h-3 w-3 rounded-xs border transition-all cursor-pointer ${
                      isFiltered
                        ? "opacity-20 bg-[#16161d] border-transparent"
                        : HEATMAP_COLORS[day.intensity]
                    }`}
                  />
                );
              })}
            </div>
          </div>

          {/* Footer Controls & Legend */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#1e1e26] text-[11px] text-slate-300">
            {/* Filter Toggle */}
            <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
              <input
                type="checkbox"
                checked={onlyActive}
                onChange={(e) => setOnlyActive(e.target.checked)}
                className="rounded border-[#2a2a35] bg-[#16161d] text-emerald-500 focus:ring-emerald-500 h-3.5 w-3.5 accent-emerald-500"
              />
              <span>Có hoạt động</span>
            </label>

            {/* Intensity Legend */}
            <div className="flex items-center gap-1.5">
              <span>Nhạt</span>
              <div className="flex items-center gap-1">
                <span className={`h-2.5 w-2.5 rounded-xs border ${HEATMAP_COLORS[0]}`} />
                <span className={`h-2.5 w-2.5 rounded-xs border ${HEATMAP_COLORS[1]}`} />
                <span className={`h-2.5 w-2.5 rounded-xs border ${HEATMAP_COLORS[2]}`} />
                <span className={`h-2.5 w-2.5 rounded-xs border ${HEATMAP_COLORS[3]}`} />
                <span className={`h-2.5 w-2.5 rounded-xs border ${HEATMAP_COLORS[4]}`} />
              </div>
              <span>Đậm</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
