import * as React from "react";
import { TwelveWeekHeatmapSummary, HeatmapIntensity } from "@/lib/progress/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Clock, Activity } from "lucide-react";

export interface ActivityHeatmapProps {
  heatmap: TwelveWeekHeatmapSummary;
}

const INTENSITY_COLORS: Record<HeatmapIntensity, string> = {
  0: "bg-slate-100 hover:bg-slate-200 border-slate-200/50",
  1: "bg-blue-200 hover:bg-blue-300 border-blue-300",
  2: "bg-blue-400 hover:bg-blue-500 border-blue-500",
  3: "bg-blue-600 hover:bg-blue-700 border-blue-700",
  4: "bg-indigo-700 hover:bg-indigo-800 border-indigo-800",
};

export function ActivityHeatmap({ heatmap }: ActivityHeatmapProps) {
  return (
    <Card className="border-slate-200 shadow-xs max-w-full overflow-hidden">
      <CardHeader className="pb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        <div>
          <CardTitle className="text-sm sm:text-base font-bold text-slate-900">
            Lịch sử học tập 12 tuần
          </CardTitle>
          <CardDescription className="text-xs">
            {heatmap.startDate} đến {heatmap.endDate} (84 ngày)
          </CardDescription>
        </div>
        <div className="flex items-center gap-3 sm:gap-4 text-xs text-slate-600 font-medium">
          <div className="flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-blue-600 shrink-0" />
            <span>{heatmap.totalActivities} lượt làm bài</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-blue-600 shrink-0" />
            <span>{heatmap.totalStudyMinutes} phút</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Heatmap Grid (7 rows for days of week, 12 cols for weeks) */}
        <div className="overflow-x-auto pb-2 -mx-2 px-2 touch-pan-x">
          <div className="inline-grid grid-rows-7 grid-flow-col gap-1.5 min-w-[320px] sm:min-w-0">
            {heatmap.days.map((day) => (
              <div
                key={day.date}
                title={`${day.date}: ${day.activityCount} bài (${day.totalMinutes} phút)`}
                className={`h-3.5 w-3.5 rounded-xs border transition-colors cursor-pointer active:scale-125 touch-manipulation ${
                  INTENSITY_COLORS[day.intensity]
                }`}
              />
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 pt-2">
          <span>Ít hoạt động</span>
          <div className="flex items-center gap-1">
            <div className={`h-2.5 w-2.5 rounded-xs border ${INTENSITY_COLORS[0]}`} />
            <div className={`h-2.5 w-2.5 rounded-xs border ${INTENSITY_COLORS[1]}`} />
            <div className={`h-2.5 w-2.5 rounded-xs border ${INTENSITY_COLORS[2]}`} />
            <div className={`h-2.5 w-2.5 rounded-xs border ${INTENSITY_COLORS[3]}`} />
            <div className={`h-2.5 w-2.5 rounded-xs border ${INTENSITY_COLORS[4]}`} />
          </div>
          <span>Chăm chỉ</span>
        </div>
      </CardContent>
    </Card>
  );
}
