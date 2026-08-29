"use client";

import * as React from "react";
import Link from "next/link";
import {
  Ticket,
  Lightbulb,
  Clock,
  Layers,
  Sparkles,
  LucideIcon,
} from "lucide-react";
import { PracticeModeCard, PracticeBadgeType } from "./practice-mode-card";
import { ExamComponentSkill } from "@/lib/progress/types";
import { Badge } from "../ui/badge";
import { ALL_EXAM_TEST_CATALOG } from "@/lib/exam/test-catalog";
import canonicalSpeakingBank from "@/data/speaking/canonical-speaking-practice-bank.json";

export interface PracticeModeDef {
  badge: PracticeBadgeType;
  tag: string;
  icon: LucideIcon;
  title: string;
  description: string;
  locked?: boolean;
  href?: string;
  buttonLabel?: string;
  onSelect?: () => void;
}

export interface PartOptionDef {
  partIdentifier: string;
  name: string;
  officialTiming: string;
  itemCount: string;
  description: string;
  href: string;
  badge?: string;
}

export interface SkillPracticeLandingPageProps {
  skillName: string;
  skillKey: ExamComponentSkill;
  icon: LucideIcon;
  accent?: string;
  modeCount: number;
  modes: PracticeModeDef[];
  parts: PartOptionDef[];
  tests?: Array<{
    testId: string;
    label: string;
    hasListeningAudio?: boolean;
  }>;
}

export function SkillPracticeLandingPage({
  skillName,
  skillKey,
  icon: SkillIcon,
  modeCount,
  modes,
  parts,
  tests = ALL_EXAM_TEST_CATALOG,
}: SkillPracticeLandingPageProps) {
  const partsSectionRef = React.useRef<HTMLDivElement>(null);

  const scrollToParts = () => {
    partsSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Enhance modes if onSelect not provided for "Theo part"
  const enhancedModes = modes.map((m) => {
    if (m.badge === "ĐỀ XUẤT" && !m.onSelect && !m.href) {
      return { ...m, onSelect: scrollToParts };
    }
    return m;
  });

  return (
    <div className="space-y-8">
      {/* 1. Skill Banner */}
      <div className="rounded-2xl border border-emerald-500/25 bg-gradient-to-r from-emerald-950/60 via-[#12161a] to-[#121215] p-6 sm:p-8 text-white shadow-lg shadow-emerald-950/20">
        <div className="max-w-2xl space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">
              LUYỆN APTIS
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 shadow-md shadow-emerald-500/20">
              <SkillIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Luyện {skillName}
              </h1>
              <p className="text-xs text-slate-300">
                Chọn cách bạn muốn luyện · tiến độ được lưu tự động
              </p>
            </div>
          </div>
        </div>
      </div>



      {/* 3. Section Header & Mode Cards Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white">
              Chọn cách luyện
            </h2>
            <p className="text-xs text-slate-300">
              {modeCount} chế độ · click để bắt đầu
            </p>
          </div>
        </div>

        <div className={`grid grid-cols-1 sm:grid-cols-2 ${modeCount > 2 ? "lg:grid-cols-4" : "lg:grid-cols-2"} gap-4`}>
          {enhancedModes.map((mode, idx) => (
            <PracticeModeCard key={idx} {...mode} />
          ))}
        </div>
      </div>

      {/* 4. Interactive Part -> Test Selection (272 items) */}
      <div ref={partsSectionRef} className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Layers className="h-4 w-4 text-emerald-300" />
              <span>Luyện theo từng Part: {skillName}</span>
            </h2>
            <p className="text-xs text-slate-300">
              {skillKey === "speaking" ? "Practice Bank độc lập — không phụ thuộc mock-test assignment" : `${tests.length} bộ đề nguồn có sẵn cho mỗi phần thi`}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5">
          {parts.map((part) => (
            <div
              key={part.partIdentifier}
              className="rounded-2xl border border-[#22222a] bg-[#121215] p-5 sm:p-6 space-y-4 shadow-sm"
            >
              {/* Part Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1e1e26] pb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-bold text-emerald-300 bg-emerald-500/10 px-2.5 py-0.5 rounded-md border border-emerald-500/20">
                      {part.itemCount}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs text-slate-300">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{part.officialTiming}</span>
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-white">
                    {part.name}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed mt-0.5">
                    {part.description}
                  </p>
                </div>

                {part.badge && (
                  <Badge variant="secondary" className="text-[10px] px-2 py-0.5 bg-emerald-500/15 text-emerald-300 border-emerald-500/30 font-semibold">
                    <Sparkles className="h-3 w-3 mr-1" />
                    {part.badge}
                  </Badge>
                )}
              </div>

              {/* 16 Tests Grid for this part */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-300 block">
                  {skillKey === "speaking" ? "Chọn câu hỏi / topic nguồn:" : "Chọn bộ đề ôn luyện:"}
                </span>
                {skillKey === "speaking" ? (() => {
                  const bankPart = (canonicalSpeakingBank as any).parts[`part${part.partIdentifier.replace("part", "")}`];
                  const bankItems = bankPart?.questions || bankPart?.topics || [];
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {bankItems.map((item: any, index: number) => {
                        const itemId = item.questionId || item.topicId;
                        const label = item.question || item.title || `Topic ${index + 1}`;
                        const available = item.availability !== "source-limited";
                        return (
                          <Link
                            key={itemId}
                            href={`${part.href}&itemId=${encodeURIComponent(itemId)}`}
                            className={`group p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${available ? "border-[#22222a] bg-[#16161d] hover:border-emerald-500/50 hover:bg-[#1a1a24]" : "border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20"}`}
                          >
                            <span className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors line-clamp-2">{index + 1}. {label}</span>
                            <span className={`text-[9px] ${available ? "text-slate-300" : "text-amber-300"}`}>{available ? "Source verified · Vào luyện" : "Source-limited · xem prompt"}</span>
                          </Link>
                        );
                      })}
                    </div>
                  );
                })() : (
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                    {tests.map((test) => {
                      const isMissingAudio = skillKey === "listening" && test.hasListeningAudio === false;
                      return (
                        <Link key={test.testId} href={`${part.href}?testId=${test.testId}`} className={`group p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${isMissingAudio ? "border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300" : "border-[#22222a] bg-[#16161d] hover:border-emerald-500/50 hover:bg-[#1a1a24] text-white"}`}>
                          <span className="text-xs font-bold group-hover:text-emerald-300 transition-colors">{test.label}</span>
                          <span className="text-[9px] text-slate-300 group-hover:text-emerald-300">{isMissingAudio ? "No Audio" : "Vào làm"}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Note Banner */}
      <div className="rounded-xl border border-[#22222a] bg-[#141419] p-4 flex items-start gap-3 text-xs text-slate-300">
        <Lightbulb className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-white block mb-0.5">Lưu ý về câu hỏi</strong>
          <span>{skillKey === "speaking" ? "Speaking Practice dùng canonical source bank độc lập; asset thiếu được đánh dấu source-limited, không dùng placeholder." : "Làm theo part sẽ không bị trùng câu; làm theo test có thể bị trùng câu."}</span>
        </div>
      </div>
    </div>
  );
}
