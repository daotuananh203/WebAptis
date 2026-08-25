"use client";

import * as React from "react";
import Link from "next/link";
import {
  Trophy,
  Sparkles,
  RotateCcw,
  ArrowRight,
  LayoutDashboard,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Mic,
  FileText,
  Volume2,
} from "lucide-react";
import { ProgressAttemptRecord } from "@/lib/progress/types";
import { StudyRecommendation } from "@/lib/recommendations/types";

export interface PracticeResultProps {
  record: ProgressAttemptRecord;
  aiFeedback?: any;
  recommendation?: StudyRecommendation | null;
  onRetry: () => void;
}

export function PracticeResult({
  record,
  aiFeedback,
  recommendation,
  onRetry,
}: PracticeResultProps) {
  const isPassed = record.percentage >= 70;
  const [showModelAnswer, setShowModelAnswer] = React.useState(false);

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-6">
      {/* 1. Score Summary Banner */}
      <div
        className={`rounded-2xl border p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left shadow-lg ${
          isPassed
            ? "border-emerald-500/40 bg-gradient-to-br from-emerald-950/60 via-[#12161a] to-[#121215] shadow-emerald-950/20"
            : "border-amber-500/40 bg-gradient-to-br from-amber-950/60 via-[#161412] to-[#121215] shadow-amber-950/20"
        }`}
      >
        <div className="flex flex-col sm:flex-row items-center gap-5">
          <div
            className={`flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-2xl ${
              isPassed
                ? "bg-emerald-700 text-white shadow-lg shadow-emerald-500/30"
                : "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30"
            }`}
          >
            <Trophy className="h-8 w-8 sm:h-10 sm:w-10" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span
                className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${
                  isPassed
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                    : "bg-amber-500/15 text-amber-400 border-amber-500/30"
                }`}
              >
                {isPassed ? "Đạt chuẩn B2" : "Cần luyện thêm"}
              </span>
              {record.estimatedBand && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/5 text-slate-300 border border-white/10">
                  Ước lượng CEFR: {record.estimatedBand}
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white capitalize">
              Kết quả: {record.skill} {record.partIdentifier ? `(${record.partIdentifier})` : ""}
            </h2>
            <p className="text-xs text-slate-300">
              Thời gian làm bài: {Math.round(record.durationSeconds || 0)} giây
            </p>
          </div>
        </div>

        <div className="text-center sm:text-right border-t sm:border-t-0 sm:border-l border-[#22222c] pt-4 sm:pt-0 sm:pl-8">
          <span
            className={`text-4xl font-black block leading-none ${
              isPassed ? "text-emerald-300" : "text-amber-400"
            }`}
          >
            {record.percentage}%
          </span>
          <span className="text-xs font-semibold text-slate-300 mt-1.5 block">
            {record.rawScore} / {record.maxRawScore} điểm
          </span>
        </div>
      </div>

      {/* 2. Detailed AI Examiner Evaluation (Writing & Speaking) */}
      {aiFeedback && (
        <div className="rounded-2xl border border-[#22222a] bg-[#121215] p-6 space-y-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#1e1e26] pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-300" />
              <span>Đánh giá chi tiết từ AI Examiner</span>
            </h3>
            <span className="text-[10px] text-amber-400 font-semibold px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-md">
              Ước tính AI (Không phải điểm BC chính thức)
            </span>
          </div>

          {/* Criteria Scores */}
          {Array.isArray(aiFeedback.criteria) && aiFeedback.criteria.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {aiFeedback.criteria.map((c: any, idx: number) => (
                <div key={idx} className="p-3 rounded-xl border border-[#22222a] bg-[#16161d] text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block truncate">
                    {c.name}
                  </span>
                  <span className="text-base font-extrabold text-emerald-300">
                    {c.score} / {c.maxScore || 5}
                  </span>
                  {c.feedback && (
                    <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{c.feedback}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Strengths & Areas for Improvement */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.isArray(aiFeedback.strengths) && aiFeedback.strengths.length > 0 && (
              <div className="rounded-xl bg-emerald-950/20 p-4 border border-emerald-500/20 space-y-2">
                <h4 className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Điểm mạnh nổi bật</span>
                </h4>
                <ul className="space-y-1 text-xs text-slate-300">
                  {aiFeedback.strengths.map((s: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-emerald-500">•</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {Array.isArray(aiFeedback.areasForImprovement) && aiFeedback.areasForImprovement.length > 0 && (
              <div className="rounded-xl bg-amber-950/20 p-4 border border-amber-500/20 space-y-2">
                <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>Điểm cần cải thiện</span>
                </h4>
                <ul className="space-y-1 text-xs text-slate-300">
                  {aiFeedback.areasForImprovement.map((a: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-amber-500">•</span>
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Grammar & Sentence Corrections */}
          {((Array.isArray(aiFeedback.grammarErrors) && aiFeedback.grammarErrors.length > 0) ||
            (Array.isArray(aiFeedback.spokenGrammarErrors) && aiFeedback.spokenGrammarErrors.length > 0)) && (
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-rose-400" />
                <span>Chữa lỗi câu & ngữ pháp chi tiết</span>
              </h4>
              <div className="space-y-2">
                {(aiFeedback.grammarErrors || aiFeedback.spokenGrammarErrors).map((err: any, idx: number) => (
                  <div key={idx} className="rounded-xl border border-rose-500/20 bg-[#16161d] p-3 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                        {err.errorCategory || "Lỗi Ngữ pháp"}
                      </span>
                    </div>
                    <p className="text-rose-300 line-through text-xs">
                      {err.originalSentence || err.spokenPhrase}
                    </p>
                    <p className="text-emerald-300 font-semibold text-xs">
                      ➔ {err.correctedSentence || err.correctedPhrase}
                    </p>
                    <p className="text-slate-400 text-[11px] mt-1">{err.explanation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pronunciation Advice */}
          {Array.isArray(aiFeedback.pronunciationFeedback) && aiFeedback.pronunciationFeedback.length > 0 && (
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Volume2 className="h-3.5 w-3.5 text-sky-400" />
                <span>Nhận xét phát âm & Ngữ điệu</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {aiFeedback.pronunciationFeedback.map((p: any, idx: number) => (
                  <div key={idx} className="rounded-xl border border-sky-500/20 bg-[#16161d] p-3 text-xs space-y-1">
                    <span className="font-bold text-sky-300 block">{p.soundOrWord}</span>
                    <p className="text-slate-300 text-[11px]">{p.issue}</p>
                    <p className="text-emerald-300 text-[11px]">{p.advice}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transcript Display */}
          {aiFeedback.transcript && (
            <div className="rounded-xl border border-[#262632] bg-[#16161d] p-4 space-y-1">
              <h4 className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                <Mic className="h-3.5 w-3.5 text-emerald-300" />
                <span>Bản ghi âm nhận diện (Speech-to-Text):</span>
              </h4>
              <p className="text-xs text-slate-300 italic font-mono bg-black/20 p-2.5 rounded-lg border border-white/5">
                "{aiFeedback.transcript}"
              </p>
            </div>
          )}

          {/* Improvement Plan */}
          {Array.isArray(aiFeedback.improvementPlan) && aiFeedback.improvementPlan.length > 0 && (
            <div className="rounded-xl bg-[#16161d] p-4 border border-emerald-500/20 space-y-2">
              <h4 className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Kế hoạch hành động 3 bước</span>
              </h4>
              <ol className="space-y-1 text-xs text-slate-300 list-decimal list-inside">
                {aiFeedback.improvementPlan.map((step: string, idx: number) => (
                  <li key={idx}>{step}</li>
                ))}
              </ol>
            </div>
          )}

          {/* Model Answer Toggle */}
          {aiFeedback.modelAnswer && (
            <div className="pt-2 border-t border-[#1e1e26]">
              <button
                onClick={() => setShowModelAnswer(!showModelAnswer)}
                className="text-xs font-bold text-emerald-300 hover:text-emerald-300 flex items-center gap-1.5 cursor-pointer"
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span>{showModelAnswer ? "Ẩn bài mẫu tham khảo" : "Xem bài mẫu đạt chuẩn B2/C1"}</span>
              </button>
              {showModelAnswer && (
                <div className="mt-3 p-4 rounded-xl bg-black/30 border border-emerald-500/20 text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-line">
                  {aiFeedback.modelAnswer}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 3. Updated AI Coach Next Step */}
      {recommendation && (
        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-[#12161a] to-[#121215] p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-300 text-xs font-bold">
              <Sparkles className="h-3.5 w-3.5" />
              <span>GỢI Ý BÀI LUYỆN TIẾP THEO</span>
            </div>
            <h4 className="text-sm font-bold text-white">{recommendation.title}</h4>
            <p className="text-xs text-slate-300">{recommendation.suggestedAction}</p>
          </div>
          <Link
            href={`/practice?skill=${recommendation.skill}${
              recommendation.partIdentifier ? `&part=${recommendation.partIdentifier}` : ""
            }`}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 whitespace-nowrap transition-all cursor-pointer"
          >
            <span>Tiếp tục luyện tập</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* 4. Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#1e1e26]">
        <button
          onClick={onRetry}
          className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#22222a] bg-[#16161d] hover:bg-[#1c1c26] text-slate-300 text-xs font-bold transition-colors cursor-pointer"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Làm lại bài này</span>
        </button>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link
            href="/practice"
            className="w-full sm:w-auto text-center px-4 py-2.5 rounded-xl border border-[#22222a] bg-[#16161d] hover:bg-[#1c1c26] text-slate-300 text-xs font-bold transition-colors"
          >
            Danh sách bài luyện
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
    </div>
  );
}
