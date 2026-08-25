import * as React from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, Clock, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { RecommendationEngineResult } from "@/lib/recommendations/types";

export interface RecommendationCardProps {
  recommendations: RecommendationEngineResult;
}

export function RecommendationCard({ recommendations }: RecommendationCardProps) {
  const primary = recommendations.primaryRecommendation;
  const secondaryList = recommendations.secondaryRecommendations;

  if (!primary) return null;

  return (
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50/80 via-indigo-50/30 to-white shadow-xs">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-blue-700 font-bold text-xs">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <span>GỢI Ý HỌC TẬP TỪ CỐ VẤN AI</span>
          </div>
          <Badge
            variant={
              primary.priority === "critical"
                ? "destructive"
                : primary.priority === "high"
                ? "warning"
                : "default"
            }
            className="text-[10px] uppercase font-bold"
          >
            {primary.priority === "critical"
              ? "Ưu tiên cao"
              : primary.priority === "high"
              ? "Nên làm sớm"
              : "Đề xuất"}
          </Badge>
        </div>
        <CardTitle className="text-base sm:text-lg font-bold text-slate-900 mt-1">
          {primary.title}
        </CardTitle>
        <CardDescription className="text-xs text-slate-600">
          {primary.reason}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Suggested Action Box */}
        <div className="rounded-lg bg-white p-3.5 border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900">
              <Target className="h-3.5 w-3.5 text-blue-600" />
              <span>Nội dung bài luyện</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">{primary.suggestedAction}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Clock className="h-3 w-3" /> ~{primary.estimatedMinutes} phút
            </span>
            <Link
              href={
                primary.targetMode === "mock-test"
                  ? "/mock-test"
                  : `/practice?skill=${primary.skill}${
                      primary.partIdentifier ? `&part=${primary.partIdentifier}` : ""
                    }`
              }
            >
              <Button size="sm" className="gap-1 shadow-xs font-semibold text-xs">
                <span>Bắt đầu ngay</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Secondary Recommendations List */}
        {secondaryList.length > 0 && (
          <div className="border-t border-blue-100/80 pt-3">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Các bài luyện tiếp theo
            </p>
            <div className="space-y-1.5">
              {secondaryList.slice(0, 2).map((sec) => (
                <div
                  key={sec.id}
                  className="flex items-center justify-between text-xs py-1.5 px-2 rounded-md hover:bg-white/60 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[9px] px-1 py-0 uppercase">
                      {sec.skill}
                    </Badge>
                    <span className="font-medium text-slate-800">{sec.title}</span>
                  </div>
                  <span className="text-[11px] text-slate-400">~{sec.estimatedMinutes}p</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
