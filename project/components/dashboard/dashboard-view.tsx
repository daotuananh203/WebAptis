"use client";

import * as React from "react";
import Link from "next/link";
import {
  Compass,
  Moon,
  ArrowRight,
  Sparkles,
  BookOpen,
  Headphones,
  PenTool,
  Mic,
  BookA,
  GraduationCap,
} from "lucide-react";
import { StreakHeatmap } from "./streak-heatmap";
import { TwelveWeekHeatmapSummary, DailyStreakSummary, OverallLearningStatistics } from "@/lib/progress/types";
import { RecommendationEngineResult } from "@/lib/recommendations/types";
import { UserProfile } from "@/lib/auth/types";
import { Badge } from "../ui/badge";
import { RecentAttempts } from "./recent-attempts";
import { ProgressAttemptRecord } from "@/lib/progress/types";
import { EXAM_CATALOG_SUMMARY } from "@/lib/exam/catalog-summary";

export interface DashboardViewProps {
  user: UserProfile | null;
  streak: DailyStreakSummary;
  stats: OverallLearningStatistics;
  heatmap: TwelveWeekHeatmapSummary;
  recommendations: RecommendationEngineResult;
  attempts: ProgressAttemptRecord[];
}

export function DashboardView({
  user,
  streak,
  stats,
  heatmap,
  recommendations,
  attempts,
}: DashboardViewProps) {
  const displayName = user?.name ?? "bạn";
  const todayFormatted = new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "numeric",
    year: "numeric",
  }).format(new Date());

  const currentHour = new Date().getHours();
  const greetingText =
    currentHour >= 18 || currentHour < 5
      ? "Chào buổi tối"
      : currentHour >= 12
      ? "Chào buổi chiều"
      : "Chào buổi sáng";

  const primaryRec = recommendations?.primaryRecommendation;

  return (
    <div className="space-y-6">
      {/* 1. Greeting Header */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Chào, {displayName}.
        </h1>
        <p className="text-xs sm:text-sm text-slate-300">
          {todayFormatted.charAt(0).toUpperCase() + todayFormatted.slice(1)} — Học viên Aptis General B2
        </p>
      </div>

      {/* 2. START HERE BANNER (Full-width) */}
      <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-[#12161a] to-[#121215] p-5 sm:p-6 shadow-lg shadow-emerald-950/20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 shadow-xs shadow-emerald-500/30">
              <Compass className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">
                  BẮT ĐẦU TẠI ĐÂY
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-extrabold text-white">
                Mới học Aptis? Xem lộ trình bắt đầu nhanh
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                Làm quen với format 5 kỹ năng, chiến thuật phân bổ thời gian đạt chuẩn B2 và làm bài thi thử đầu tiên.
              </p>
            </div>
          </div>

          <Link
            href="/coach?topic=guide"
            className="shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <span>Xem hướng dẫn</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* 3. 3-CARDS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* CARD 1: Lời chào buổi tối / Motivational Greeting Card */}
        <div className="rounded-2xl border border-[#22222a] bg-gradient-to-br from-[#121820] via-[#121418] to-[#0f1b16] p-5 sm:p-6 flex flex-col justify-between space-y-4 shadow-sm">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="font-semibold text-slate-400">
                {new Intl.DateTimeFormat("vi-VN", { day: "numeric", month: "long", year: "numeric" }).format(new Date())}
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Moon className="h-4 w-4" />
              </div>
            </div>

            <div>
              <h3 className="text-base font-extrabold text-white">
                {greetingText}, {displayName}
              </h3>
              <p className="text-xs text-slate-300 italic mt-2 leading-relaxed bg-white/5 p-3 rounded-xl border border-white/5">
                &ldquo;Mỗi giờ luyện tập nghiêm túc là một bước tiến gần hơn tới chứng chỉ Aptis B2.&rdquo;
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-[#1e1e26]">
            <Link
              href="/practice"
              className="flex items-center justify-between text-xs font-bold text-emerald-300 hover:text-emerald-300 transition-colors group"
            >
              <span>Review đề gần đây — Phân tích và chữa đề</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* CARD 2: Hành trình đều đặn (GitHub-style Streak Heatmap) */}
        <StreakHeatmap heatmap={heatmap} currentStreak={streak.currentStreak} />
      </div>

      {/* 4. SKILL OVERVIEW & AI RECOMMENDATION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Skill Quick Access Grid */}
        <div className="lg:col-span-2 rounded-2xl border border-[#22222a] bg-[#121215] p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-emerald-300" />
              <span>Thư viện 5 kỹ năng Aptis B2 ({EXAM_CATALOG_SUMMARY.testCount} bộ đề)</span>
            </h3>
            <Link href="/practice" className="text-xs font-bold text-emerald-300 hover:underline">
              Tất cả {EXAM_CATALOG_SUMMARY.testCount} đề →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { name: "Nghe (Listening)", skill: "listening", icon: Headphones, count: EXAM_CATALOG_SUMMARY.skillCounts.listening, color: "text-emerald-300 bg-emerald-500/10 border-emerald-500/20" },
              { name: "Đọc (Reading)", skill: "reading", icon: BookOpen, count: EXAM_CATALOG_SUMMARY.skillCounts.reading, color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
              { name: "Viết (Writing)", skill: "writing", icon: PenTool, count: EXAM_CATALOG_SUMMARY.skillCounts.writing, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
              { name: "Nói (Speaking)", skill: "speaking", icon: Mic, count: EXAM_CATALOG_SUMMARY.skillCounts.speaking, color: "text-rose-400 bg-rose-500/10 border-rose-500/20" },
              { name: "Ngữ pháp & Từ vựng", skill: "grammarVocabulary", icon: BookA, count: EXAM_CATALOG_SUMMARY.skillCounts.grammarVocabulary, color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
              { name: "Thi thử Mock Test", skill: "mockTest", icon: GraduationCap, count: `${EXAM_CATALOG_SUMMARY.testCount} đề full`, color: "text-teal-400 bg-teal-500/10 border-teal-500/20", href: "/mock-test" },
            ].map((item) => {
              const Icon = item.icon;
              const linkHref = item.href || `/practice?skill=${item.skill}`;

              return (
                <Link
                  key={item.name}
                  href={linkHref}
                  className="p-3 rounded-xl border border-[#22222a] bg-[#16161d] hover:border-emerald-500/40 hover:bg-[#1a1a24] transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg border ${item.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block group-hover:text-emerald-300 transition-colors">
                        {item.name}
                      </span>
                      <span className="text-[10px] text-slate-300">
                        {item.count}
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-emerald-300 group-hover:translate-x-0.5 transition-all" />
                </Link>
              );
            })}
          </div>
        </div>

        {/* AI Coach Suggestion Card */}
        <div className="lg:col-span-1 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-[#12161a] to-[#121215] p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
              <Sparkles className="h-3.5 w-3.5" /> Gợi ý từ Cố vấn AI
            </span>
            <Badge variant="secondary" className="text-[9px] bg-emerald-500/15 text-emerald-300 border-emerald-500/30">
              B2 Strategy
            </Badge>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-extrabold text-white">
              {primaryRec ? primaryRec.title : "Luyện đề Aptis B2 chuẩn"}
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              {primaryRec ? primaryRec.reason : "Bắt đầu với bài thi thử hoặc luyện từng kỹ năng để Cố vấn AI phân tích điểm mạnh và điểm yếu của bạn."}
            </p>
          </div>

          <Link
            href={
              primaryRec
                ? primaryRec.targetMode === "mock-test"
                  ? "/mock-test"
                  : `/practice?skill=${primaryRec.skill}`
                : "/practice"
            }
            className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <span>Bắt đầu ôn tập ngay</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* 5. COMPLETE HISTORY (server-synchronised, user-scoped) */}
      <div id="history" className="scroll-mt-6">
        <RecentAttempts attempts={attempts} showAll />
      </div>

      {/* 6. TOAST NOTIFICATION (Cập nhật gần đây) */}
      <div className="rounded-xl border border-[#22222a] bg-[#141419] p-3.5 flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span>
            <strong className="text-white">Cập nhật gần đây:</strong> {EXAM_CATALOG_SUMMARY.testCount} bộ đề thi thử Aptis B2 đã được xuất bản trong thư viện.
          </span>
        </div>
        <Link href="/mock-test" className="text-xs font-bold text-emerald-300 hover:underline shrink-0 ml-2">
          Xem đề thi →
        </Link>
      </div>
    </div>
  );
}
