"use client";

import * as React from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  LayoutDashboard,
  RotateCcw,
  BookA,
  BookOpen,
  Headphones,
  PenTool,
  Mic,
  Award,
} from "lucide-react";
import { MockTestSessionState } from "@/lib/storage/types";
import { ExamComponentSkill } from "@/lib/progress/types";

export interface ExamResultProps {
  session: MockTestSessionState;
}

const SKILL_ICONS: Record<ExamComponentSkill, any> = {
  grammarVocabulary: BookA,
  reading: BookOpen,
  listening: Headphones,
  writing: PenTool,
  speaking: Mic,
};

const SKILL_TITLES: Record<ExamComponentSkill, string> = {
  grammarVocabulary: "Grammar & Vocabulary",
  reading: "Reading",
  listening: "Listening",
  writing: "Writing",
  speaking: "Speaking",
};

export function ExamResult({ session }: ExamResultProps) {
  const sections = Object.values(session.sections);

  // Calculate consolidated metrics
  let totalScore = 0;
  let maxScore = 0;
  let totalPctSum = 0;
  let completedCount = 0;

  sections.forEach((sec) => {
    if (sec.scoreResult) {
      const s = sec.scoreResult;
      totalScore += s.rawScore || s.scaledScore || 0;
      maxScore += s.maxRawScore || 50;
      totalPctSum += s.percentage || Math.round(((s.scaledScore || 0) / 50) * 100);
      completedCount++;
    }
  });

  const overallPercentage =
    completedCount > 0 ? Math.round(totalPctSum / completedCount) : 0;
  const overallBand =
    overallPercentage >= 85
      ? "C"
      : overallPercentage >= 70
      ? "B2"
      : overallPercentage >= 50
      ? "B1"
      : "A2";

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8 px-4">
      {/* 1. Master Overall Score Card */}
      <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/60 via-[#12161a] to-[#121215] text-white shadow-xl overflow-hidden relative p-6 sm:p-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10 text-center sm:text-left">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="bg-white/10 text-slate-300 font-bold text-xs px-2.5 py-0.5 rounded-full border border-white/10">
                KẾT QUẢ THI THỬ
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold px-2.5 py-0.5 rounded-full">
                Ước tính CEFR: {overallBand}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Báo cáo năng lực Aptis ESOL B2
            </h1>
            <p className="text-xs text-slate-300 leading-relaxed">
              Hoàn thành 5 kỹ năng vào ngày {new Date(session.completedAt || session.lastSavedAt).toLocaleDateString("vi-VN")}.
            </p>
          </div>

          <div className="text-center sm:text-right border-t sm:border-t-0 sm:border-l border-[#242430] pt-4 sm:pt-0 sm:pl-8 shrink-0">
            <span className="text-5xl font-black block leading-none text-emerald-300">
              {overallPercentage}%
            </span>
            <span className="text-xs font-bold text-slate-400 mt-1.5 block">
              Trình độ tương đương: Band {overallBand}
            </span>
          </div>
        </div>
      </div>

      {/* 2. 5-Skill Individual Breakdown */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-white">
            Kết quả chi tiết từng kỹ năng
          </h2>
          <span className="text-xs text-slate-300 font-medium">Thang điểm 50 chuẩn</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {sections.map((sec) => {
            const Icon = SKILL_ICONS[sec.skill];
            const scoreData = sec.scoreResult || {};
            const pct =
              scoreData.percentage ??
              Math.round(((scoreData.scaledScore || scoreData.rawScore || 0) / (scoreData.maxRawScore || 50)) * 100);
            const isSkillPassed = pct >= 70;

            return (
              <div
                key={sec.skill}
                className="rounded-2xl border border-[#22222a] bg-[#121215] p-4 flex flex-col justify-between space-y-3 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold">
                    <Icon className="h-4 w-4" />
                  </div>
                  <span
                    className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
                      isSkillPassed
                        ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                        : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                    }`}
                  >
                    {pct}%
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-xs text-white leading-tight">
                    {SKILL_TITLES[sec.skill]}
                  </h3>
                  <span className="text-[10px] text-slate-300">
                    {scoreData.rawScore || scoreData.scaledScore || 0}/{scoreData.maxRawScore || 50} điểm
                  </span>
                </div>

                <div className="w-full bg-[#1e1e28] rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      isSkillPassed ? "bg-emerald-500" : "bg-amber-500"
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. AI Qualitative Feedback & Coaching Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-[#22222a] bg-[#121215] p-5 space-y-3 shadow-sm">
          <div className="flex items-center gap-2 border-b border-[#1e1e26] pb-3">
            <Sparkles className="h-4 w-4 text-emerald-300" />
            <h3 className="text-sm font-bold text-white">Đánh giá phần Writing & Speaking</h3>
          </div>
          <div className="space-y-3 text-xs text-slate-300">
            <div className="p-3 bg-[#16161d] rounded-xl border border-[#262632] space-y-1">
              <strong className="text-white block">Văn phong và ngữ pháp bài viết:</strong>
              <p>Phân biệt tốt văn phong thân mật (chat/email bạn bè) và trang trọng (thư kiến nghị).</p>
            </div>
            <div className="p-3 bg-[#16161d] rounded-xl border border-[#262632] space-y-1">
              <strong className="text-white block">Độ trôi chảy và cấu trúc bài nói:</strong>
              <p>Cấu trúc câu trả lời mạch lạc, sử dụng tốt các từ nối và triển khai ý rõ ràng qua 4 phần.</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 via-[#12161a] to-[#121215] p-5 space-y-3 shadow-sm flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 border-b border-[#1e1e26] pb-3">
              <Award className="h-4 w-4 text-emerald-300" />
              <h3 className="text-sm font-bold text-white">Kế hoạch củng cố B2 tiếp theo</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Hãy tập trung luyện các bài tập ngắn cho những phần có điểm số chưa cao để đạt chuẩn vững B2 (trên 70%).
            </p>
          </div>

          <Link
            href="/practice"
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <span>Luyện các phần còn yếu</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* 4. Action Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-[#1e1e26]">
        <Link
          href="/mock-test"
          className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#22222a] bg-[#16161d] hover:bg-[#1c1c26] text-slate-300 text-xs font-bold transition-colors"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Làm lại bài thi thử</span>
        </Link>

        <Link
          href="/dashboard"
          className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all"
        >
          <LayoutDashboard className="h-4 w-4" />
          <span>Về Trang tổng quan</span>
        </Link>
      </div>
    </div>
  );
}
