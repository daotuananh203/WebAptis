import * as React from "react";
import Link from "next/link";
import { AlertCircle, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Badge } from "../ui/badge";
import { WeakAreaIndicator } from "@/lib/progress/types";

export interface WeakAreaSummaryProps {
  weakAreas: WeakAreaIndicator[];
}

export function WeakAreaSummary({ weakAreas }: WeakAreaSummaryProps) {
  if (weakAreas.length === 0) {
    return (
      <Card className="border-slate-200 shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>Kỹ năng cần chú ý</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Đánh giá tổng quát từ các bài đã làm
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-slate-600">
            Tuyệt vời! Hiện chưa phát hiện điểm yếu nào đáng lo ngại. Tất cả các phần đã luyện đều đạt phong độ tốt.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200 shadow-xs">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <span>Kỹ năng cần cải thiện</span>
          </CardTitle>
          <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
            {weakAreas.length} phần cần chú ý
          </Badge>
        </div>
        <CardDescription className="text-xs">
          Các phần có độ chính xác dưới mức mục tiêu B2 (70%)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2.5">
          {weakAreas.map((area, idx) => (
            <div
              key={`${area.skill}_${area.partIdentifier || idx}`}
              className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-100/60 transition-colors"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-xs text-slate-900 capitalize">
                    {area.skill} {area.partIdentifier ? `(${area.partIdentifier})` : ""}
                  </span>
                  <Badge
                    variant={area.urgency === "critical" ? "destructive" : "warning"}
                    className="text-[9px] px-1.5 py-0"
                  >
                    {area.urgency === "critical" ? "Cần ôn gấp" : "Cần rèn thêm"}
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-400">
                  Độ chính xác: <strong className="text-slate-800 font-semibold">{area.averagePercentage}%</strong> ({area.attemptCount} bài)
                </p>
              </div>

              <Link
                href={`/practice?skill=${area.skill}${
                  area.partIdentifier ? `&part=${area.partIdentifier}` : ""
                }`}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
              >
                <span>Luyện ngay</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
