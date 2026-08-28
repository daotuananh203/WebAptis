"use client";

import * as React from "react";
import { Sparkles, ShieldCheck } from "lucide-react";
import { AICoachContext } from "@/lib/recommendations/types";

export interface CoachEmptyStateProps {
  context?: AICoachContext | null;
}

export function CoachEmptyState({ context }: CoachEmptyStateProps) {
  const stats = context?.overallStats;
  const hasHistory = stats && stats.totalAttempts > 0;

  return (
    <div className="max-w-2xl mx-auto py-8 text-center space-y-6">
      {/* Icon & Welcome */}
      <div className="flex flex-col items-center space-y-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-400 text-white shadow-lg shadow-emerald-500/20">
          <Sparkles className="h-7 w-7" />
        </div>
        <div>
          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold text-xs px-2.5 py-0.5 rounded-full mb-2 inline-block">
            CỐ VẤN HỌC TẬP AI LEXI
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Chào bạn! Mình là Cố vấn AI Lexi
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto mt-1 leading-relaxed">
            Mình sẽ giúp bạn phân tích điểm mạnh, điểm yếu và giải đáp thắc mắc về 23 bộ đề thi Aptis B2.
          </p>
        </div>
      </div>

      {/* Verified Progress Snapshot Card */}
      {hasHistory ? (
        <div className="rounded-2xl border border-[#22222a] bg-[#121215] p-5 text-left space-y-3 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span>Hồ sơ năng lực học tập hiện tại</span>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">
              {stats.totalAttempts} bài đã làm
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-[#16161d] border border-[#262632] text-center">
              <span className="text-[10px] text-slate-400 font-bold block">ĐỘ CHÍNH XÁC</span>
              <strong className="text-sm text-white">{stats.overallAccuracyPercentage}%</strong>
            </div>
            <div className="p-3 rounded-xl bg-[#16161d] border border-[#262632] text-center">
              <span className="text-[10px] text-slate-400 font-bold block">THỜI GIAN HỌC</span>
              <strong className="text-sm text-white">{Math.round(stats.totalTimeSpentSeconds / 60)} phút</strong>
            </div>
            <div className="p-3 rounded-xl bg-[#16161d] border border-[#262632] text-center">
              <span className="text-[10px] text-slate-400 font-bold block">ĐIỂM MẠNH</span>
              <strong className="text-sm text-emerald-300 truncate block capitalize">
                {stats.strongestSkill || "—"}
              </strong>
            </div>
            <div className="p-3 rounded-xl bg-[#16161d] border border-[#262632] text-center">
              <span className="text-[10px] text-slate-400 font-bold block">CẦN CẢI THIỆN</span>
              <strong className="text-sm text-amber-400 truncate block capitalize">
                {stats.weakestSkill || "—"}
              </strong>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl border border-dashed border-[#22222c] bg-[#121215]/50 text-xs text-slate-300 max-w-md mx-auto">
          Chưa có bài luyện tập nào được ghi nhận. Hãy hỏi mình bất kỳ câu hỏi nào về cấu trúc đề thi hoặc chiến thuật làm bài Aptis B2!
        </div>
      )}

      {/* Trust & Provenance Badge */}
      <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-300">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
        <span>Kiến thức được trích xuất trực tiếp từ kho giáo trình Edulife Aptis B2</span>
      </div>
    </div>
  );
}
