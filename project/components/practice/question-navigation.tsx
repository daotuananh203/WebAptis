"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface QuestionNavigationProps {
  totalQuestions: number;
  currentIndex: number;
  answeredIndices: number[];
  onSelectIndex: (index: number) => void;
  className?: string;
}

export function QuestionNavigation({
  totalQuestions,
  currentIndex,
  answeredIndices,
  onSelectIndex,
  className,
}: QuestionNavigationProps) {
  const answeredSet = new Set(answeredIndices);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1">
        <span className="text-white font-bold">Bảng câu hỏi</span>
        <span>
          Đã làm {answeredSet.size}/{totalQuestions}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
        {Array.from({ length: totalQuestions }, (_, idx) => {
          const isCurrent = idx === currentIndex;
          const isAnswered = answeredSet.has(idx);

          return (
            <button
              key={idx}
              onClick={() => onSelectIndex(idx)}
              className={cn(
                "h-8 w-8 rounded-lg text-xs font-bold transition-all cursor-pointer border flex items-center justify-center",
                isCurrent
                  ? "border-emerald-500 bg-emerald-700 text-white shadow-md shadow-emerald-500/25 ring-2 ring-emerald-500/30 font-black"
                  : isAnswered
                  ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300 font-bold"
                  : "border-[#262632] bg-[#16161d] text-slate-300 hover:border-slate-600 hover:text-white"
              )}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}
