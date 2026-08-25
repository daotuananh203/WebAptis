"use client";

import * as React from "react";
import { Send } from "lucide-react";
import { ExamTimer } from "./exam-timer";
import { SectionNavigation } from "./section-navigation";
import { ExamComponentSkill } from "@/lib/progress/types";

export interface ExamHeaderProps {
  testId: string;
  currentSkill: ExamComponentSkill;
  currentSectionIndex: number;
  remainingTimeSeconds: number;
  completedSkills: Set<ExamComponentSkill>;
  isFinalSection: boolean;
  onTimeExpired: () => void;
  onTimerTick: (remainingSeconds: number) => void;
  onRequestSubmit: () => void;
}

const SKILL_TITLES: Record<ExamComponentSkill, string> = {
  grammarVocabulary: "Grammar & Vocabulary",
  reading: "Reading",
  listening: "Listening",
  writing: "Writing",
  speaking: "Speaking",
};

export function ExamHeader({
  testId,
  currentSkill,
  currentSectionIndex,
  remainingTimeSeconds,
  completedSkills,
  isFinalSection,
  onTimeExpired,
  onTimerTick,
  onRequestSubmit,
}: ExamHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-[#1e1e26] bg-[#101014]/95 backdrop-blur-md px-3 sm:px-6 py-2.5 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 sm:gap-3">
        {/* Top Row on Mobile: Brand, Title, Timer & Submit */}
        <div className="flex items-center justify-between gap-2 w-full lg:w-auto">
          {/* Left: Branding & Section Title */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 sm:h-8 w-7 sm:w-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white font-black text-xs sm:text-sm shadow-xs shrink-0">
              A
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-xs sm:text-sm font-extrabold text-white leading-none truncate max-w-[150px] sm:max-w-none">
                  {SKILL_TITLES[currentSkill]}
                </h1>
                <span className="text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/20 font-bold">
                  {currentSectionIndex + 1}/5
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-300 font-mono leading-none mt-0.5">
                {testId.replace("aptis-b2-", "Đề ")}
              </p>
            </div>
          </div>

          {/* Right on mobile / Center on desktop: Timer & Submit Button */}
          <div className="flex items-center gap-2">
            <ExamTimer
              initialSeconds={remainingTimeSeconds}
              onTimeExpired={onTimeExpired}
              onTick={onTimerTick}
            />

            <button
              onClick={onRequestSubmit}
              className="flex items-center gap-1 sm:gap-1.5 font-bold shadow-md bg-emerald-700 hover:bg-emerald-700 text-white text-xs h-8 sm:h-9 px-2.5 sm:px-3.5 rounded-xl transition-all cursor-pointer"
            >
              <Send className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span>{isFinalSection ? "Nộp bài thi" : "Xong phần này"}</span>
            </button>
          </div>
        </div>

        {/* Section Step Timeline Tracker */}
        <div className="w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0">
          <SectionNavigation
            currentSectionIndex={currentSectionIndex}
            completedSkills={completedSkills}
          />
        </div>
      </div>
    </header>
  );
}
