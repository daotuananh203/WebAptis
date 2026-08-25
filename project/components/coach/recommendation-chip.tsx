"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Target, Clock } from "lucide-react";
import { StudyRecommendation } from "@/lib/recommendations/types";

export interface RecommendationChipProps {
  recommendation: StudyRecommendation;
}

export function RecommendationChip({ recommendation }: RecommendationChipProps) {
  const targetHref =
    recommendation.targetMode === "mock-test"
      ? "/mock-test"
      : `/practice?skill=${recommendation.skill}${
          recommendation.partIdentifier ? `&part=${recommendation.partIdentifier}` : ""
        }`;

  return (
    <div className="mt-3 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 via-[#14181f] to-[#121215] p-4 shadow-sm space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-emerald-300 text-xs font-bold">
          <Target className="h-3.5 w-3.5 text-emerald-300" />
          <span>Bài luyện được gợi ý</span>
        </div>
        <span
          className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-md border ${
            recommendation.priority === "critical"
              ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
              : recommendation.priority === "high"
              ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
              : "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
          }`}
        >
          {recommendation.priority === "critical"
            ? "Ưu tiên cao"
            : recommendation.priority === "high"
            ? "Nên làm sớm"
            : "Đề xuất"}
        </span>
      </div>

      <div>
        <h4 className="text-xs font-bold text-white leading-snug">
          {recommendation.title}
        </h4>
        <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
          {recommendation.suggestedAction}
        </p>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-[#1e1e26]">
        <span className="text-[10px] text-slate-400 flex items-center gap-1">
          <Clock className="h-3 w-3" /> ~{recommendation.estimatedMinutes} phút
        </span>
        <Link
          href={targetHref}
          className="flex items-center gap-1 text-xs font-bold text-emerald-300 hover:text-emerald-300 transition-colors"
        >
          <span>Luyện ngay</span>
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
