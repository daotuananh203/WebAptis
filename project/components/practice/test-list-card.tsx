"use client";

import * as React from "react";
import { Clock, Layers, Sparkles, CheckCircle2, Star, Ticket, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ExamComponentSkill } from "@/lib/progress/types";

export interface TestListCardProps {
  skillType?: ExamComponentSkill | "general";
  level: "B2" | "C1" | string;
  isFeatured?: boolean;
  hasAttempt?: boolean;
  durationMinutes: number;
  partsCount: number;
  gradingType: "key" | "ai";
  title: string;
  description: string;
  tags?: string[];
  onViewDetails: () => void;
}

export function TestListCard({
  skillType = "general",
  level = "B2",
  isFeatured = false,
  hasAttempt = false,
  durationMinutes,
  partsCount,
  gradingType,
  title,
  description,
  tags,
  onViewDetails,
}: TestListCardProps) {
  return (
    <div className="group rounded-2xl border border-[#22222a] bg-[#121215] p-5 sm:p-6 flex flex-col justify-between transition-all duration-200 hover:border-emerald-500/40 hover:bg-[#15151c] hover:shadow-lg hover:shadow-emerald-950/10">
      <div className="space-y-3.5">
        {/* ROW 1 — BADGES */}
        <div className="flex flex-wrap items-center gap-1.5 min-h-[24px]">
          {/* Skill Tag Badge */}
          {skillType === "speaking" ? (
            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 tracking-wider">
              SPEAKING
            </span>
          ) : skillType === "writing" ? (
            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 tracking-wider">
              WRITING
            </span>
          ) : skillType === "reading" ? (
            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30 tracking-wider">
              READING
            </span>
          ) : skillType === "listening" ? (
            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 tracking-wider">
              LISTENING
            </span>
          ) : skillType === "grammarVocabulary" ? (
            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30 tracking-wider">
              GRAMMAR & VOCAB
            </span>
          ) : (
            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 tracking-wider">
              APTIS
            </span>
          )}

          {/* Level Badge */}
          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-white/5 text-slate-200 border border-white/15">
            {level}
          </span>

          {/* Featured Badge */}
          {isFeatured && (
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
              <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
              <span>Trọng điểm tháng</span>
            </span>
          )}
        </div>

        {/* ROW 1.5 — Attempted Badge (Ticket style from mock) */}
        {hasAttempt && (
          <div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300 border border-slate-700/60 inline-flex items-center gap-1.5">
              <Ticket className="h-3 w-3 text-slate-400" />
              <span>Đã có lượt làm bài</span>
            </span>
          </div>
        )}

        {/* ROW 2 — TITLE */}
        <h3 className="text-base font-bold text-white tracking-tight group-hover:text-emerald-300 transition-colors line-clamp-2 leading-snug">
          {title}
        </h3>

        {/* ROW 3 — DESCRIPTION */}
        <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
          {description}
        </p>

        {/* ROW 4 — DIVIDER */}
        <div className="border-t border-[#1e1e26] my-1" />

        {/* ROW 5 — METADATA */}
        <div className="flex flex-wrap items-center gap-3.5 text-xs text-slate-300">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            <span>{durationMinutes} phút</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-slate-400" />
            <span>{partsCount} phần</span>
          </div>

          <div className="flex items-center gap-1.5">
            {gradingType === "ai" ? (
              <>
                <Sparkles className="h-3.5 w-3.5 text-emerald-300" />
                <span className="text-emerald-300 font-medium">AI chấm</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-slate-400" />
                <span>Đáp án</span>
              </>
            )}
          </div>
        </div>

        {/* ROW 6 — SPEAKING TAGS */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {tags.map((tag, idx) => (
              <span
                key={idx}
                className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[#181822] text-slate-400 border border-[#262634]"
              >
                #{tag.replace(/^#/, "")}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ROW 7 — ACTION BUTTON */}
      <div className="pt-4 mt-auto">
        <Button
          onClick={onViewDetails}
          className="w-full bg-emerald-700 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <span>Xem chi tiết</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
