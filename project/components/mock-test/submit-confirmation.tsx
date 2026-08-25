"use client";

import * as React from "react";
import { AlertCircle, CheckCircle2, ArrowRight, X } from "lucide-react";

export interface SubmitConfirmationProps {
  isOpen: boolean;
  isFinalSection: boolean;
  sectionTitle: string;
  totalQuestions: number;
  answeredCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function SubmitConfirmation({
  isOpen,
  isFinalSection,
  sectionTitle,
  totalQuestions,
  answeredCount,
  onConfirm,
  onCancel,
}: SubmitConfirmationProps) {
  if (!isOpen) return null;

  const unansweredCount = Math.max(0, totalQuestions - answeredCount);
  const hasUnanswered = unansweredCount > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl bg-[#121215] p-6 shadow-2xl space-y-5 border border-[#242430]">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                hasUnanswered
                  ? "bg-amber-500/15 border border-amber-500/30 text-amber-400"
                  : "bg-emerald-500/15 border border-emerald-500/30 text-emerald-300"
              }`}
            >
              {hasUnanswered ? (
                <AlertCircle className="h-5 w-5" />
              ) : (
                <CheckCircle2 className="h-5 w-5" />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isFinalSection ? "Xác nhận nộp bài toàn bộ" : `Hoàn thành ${sectionTitle}`}
              </h3>
              <p className="text-xs text-slate-300">
                Xác nhận chuyển phần / kết thúc bài thi
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            aria-label="Đóng hộp thoại"
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="rounded-xl border border-[#22222a] bg-[#16161d] p-4 space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-300">
            <span>Tiến độ phần hiện tại:</span>
            <span className="font-bold text-white">
              {answeredCount} / {totalQuestions} câu đã làm
            </span>
          </div>

          {hasUnanswered ? (
            <div className="pt-2 border-t border-[#22222a] text-amber-400">
              ⚠️ Bạn còn <strong>{unansweredCount}</strong> câu chưa trả lời. Khi chuyển sang phần thi tiếp theo, bạn sẽ <strong>không thể quay lại</strong> phần thi này.
            </div>
          ) : (
            <div className="pt-2 border-t border-[#22222a] text-emerald-300 font-medium">
              ✓ Bạn đã hoàn thành đầy đủ tất cả câu hỏi trong phần này.
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
          >
            Tiếp tục làm bài
          </button>
          <button
            onClick={onConfirm}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-700 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <span>{isFinalSection ? "Nộp bài và xem điểm" : "Chuyển phần tiếp theo"}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
