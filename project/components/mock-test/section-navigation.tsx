"use client";

import * as React from "react";
import { Check, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { ExamComponentSkill } from "@/lib/progress/types";
import { MOCK_TEST_SECTIONS } from "@/lib/storage/types";

export interface SectionNavigationProps {
  currentSectionIndex: number;
  completedSkills: Set<ExamComponentSkill>;
  className?: string;
}

const SECTION_LABELS: Record<ExamComponentSkill, string> = {
  grammarVocabulary: "Grammar & Vocab",
  reading: "Reading",
  listening: "Listening",
  writing: "Writing",
  speaking: "Speaking",
};

export function SectionNavigation({
  currentSectionIndex,
  completedSkills,
  className,
}: SectionNavigationProps) {
  return (
    <div className={cn("flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-1 scrollbar-none", className)}>
      {MOCK_TEST_SECTIONS.map((skill, idx) => {
        const isCompleted = completedSkills.has(skill);
        const isActive = idx === currentSectionIndex;
        const isLocked = !isCompleted && !isActive;

        return (
          <div
            key={skill}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 border",
              isActive
                ? "border-emerald-500 bg-emerald-500/15 text-emerald-300 shadow-sm ring-1 ring-emerald-500/30"
                : isCompleted
                ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                : "border-[#22222a] bg-[#141419] text-slate-400 opacity-60"
            )}
          >
            <span
              className={cn(
                "flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold",
                isActive
                  ? "bg-emerald-700 text-white font-black"
                  : isCompleted
                  ? "bg-emerald-700 text-white"
                  : "bg-[#22222c] text-slate-400"
              )}
            >
              {isCompleted ? <Check className="h-2.5 w-2.5" /> : idx + 1}
            </span>
            <span className="truncate max-w-[90px] sm:max-w-none">
              {SECTION_LABELS[skill]}
            </span>
            {isLocked && <Lock className="h-3 w-3 text-slate-600 shrink-0" />}
          </div>
        );
      })}
    </div>
  );
}
