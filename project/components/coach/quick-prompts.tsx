"use client";

import * as React from "react";
import { Sparkles, ArrowRight } from "lucide-react";
import { AICoachContext } from "@/lib/recommendations/types";

export interface QuickPromptsProps {
  context?: AICoachContext | null;
  onSelectPrompt: (promptText: string) => void;
  disabled?: boolean;
}

export function QuickPrompts({
  context,
  onSelectPrompt,
  disabled,
}: QuickPromptsProps) {
  const weakestSkill = context?.overallStats?.weakestSkill;
  const primaryRec = context?.recommendations?.[0];

  const prompts = [
    "Hôm nay mình nên học gì để đạt B2?",
    weakestSkill
      ? `Làm thế nào để cải thiện điểm ${weakestSkill}?`
      : "Phần thi nào đang là điểm yếu nhất của mình?",
    primaryRec
      ? `Giải thích giúp mình bài luyện: "${primaryRec.title}"`
      : "Mẹo phân bổ thời gian bài thi Aptis B2?",
    "Cách viết email trang trọng đạt điểm cao ở Part 4?",
  ];

  return (
    <div className="space-y-2 px-4 sm:px-6 py-2 border-t border-[#1e1e26] bg-[#101014]/60">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
        <Sparkles className="h-3.5 w-3.5 text-emerald-300" />
        <span>Gợi ý câu hỏi nhanh:</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {prompts.map((p, idx) => (
          <button
            key={idx}
            disabled={disabled}
            onClick={() => onSelectPrompt(p)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#262632] bg-[#16161d] hover:bg-[#1f1f28] hover:border-emerald-500/40 text-xs font-medium text-slate-300 hover:text-white transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none text-left"
          >
            <span>{p}</span>
            <ArrowRight className="h-3 w-3 text-slate-400 group-hover:text-emerald-300" />
          </button>
        ))}
      </div>
    </div>
  );
}
