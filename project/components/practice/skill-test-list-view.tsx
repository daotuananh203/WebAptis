"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LucideIcon, Search, Star, SlidersHorizontal } from "lucide-react";
import { TestListCard } from "./test-list-card";
import { ExamComponentSkill } from "@/lib/progress/types";

export interface TestListItemData {
  testId: string;
  testNumber: number;
  level: "B2" | "C1" | string;
  isFeatured?: boolean;
  hasAttempt?: boolean;
  durationMinutes: number;
  partsCount: number;
  gradingType: "key" | "ai";
  title: string;
  description: string;
  tags?: string[];
  practiceUrl: string;
}

export interface SkillTestListViewProps {
  skill: ExamComponentSkill;
  title: string;
  description: string;
  icon: LucideIcon;
  tests: TestListItemData[];
}

export function SkillTestListView({
  skill,
  title,
  description,
  icon: Icon,
  tests,
}: SkillTestListViewProps) {
  const router = useRouter();
  const [selectedLevel, setSelectedLevel] = React.useState<string>("all");
  const [isFeaturedOnly, setIsFeaturedOnly] = React.useState<boolean>(false);
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  // Filter items based on active filters
  const filteredTests = React.useMemo(() => {
    return tests.filter((item) => {
      // Level filter
      if (selectedLevel !== "all" && item.level.toLowerCase() !== selectedLevel.toLowerCase()) {
        return false;
      }
      // Featured filter
      if (isFeaturedOnly && !item.isFeatured) {
        return false;
      }
      // Search filter (Speaking or Writing)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesDesc = item.description.toLowerCase().includes(q);
        const matchesTags = item.tags?.some((t) => t.toLowerCase().includes(q)) ?? false;
        if (!matchesTitle && !matchesDesc && !matchesTags) {
          return false;
        }
      }
      return true;
    });
  }, [tests, selectedLevel, isFeaturedOnly, searchQuery]);

  return (
    <div className="space-y-6">
      {/* 1. HEADER (Refined matching reference image) */}
      <div className="rounded-2xl border border-[#22222a] bg-[#121215] p-6 sm:p-7">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0 shadow-sm">
            <Icon className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase block">
              {skill === "writing"
                ? "KỸ NĂNG WRITING"
                : skill === "speaking"
                ? "KỸ NĂNG SPEAKING"
                : skill === "reading"
                ? "KỸ NĂNG READING"
                : skill === "listening"
                ? "KỸ NĂNG LISTENING"
                : "GRAMMAR & VOCABULARY"}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {title}
            </h1>
            <p className="text-xs text-slate-300 leading-relaxed max-w-3xl pt-0.5">
              {description}
            </p>
          </div>
        </div>
      </div>

      {/* 2. FILTER BAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Input (For Speaking and Writing) */}
          {skill === "speaking" && (
            <div className="relative min-w-[220px] flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                aria-label="Tìm tên đề Speaking"
                placeholder="Tìm tên đề Speaking..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 h-9 text-xs bg-[#141419] border border-[#22222a] text-white rounded-xl focus:border-emerald-500 focus:outline-hidden w-full"
              />
            </div>
          )}

          {/* Level Dropdown */}
          <div className="relative">
            <div className="flex items-center gap-1.5 bg-[#141419] border border-[#22222a] rounded-xl px-3 py-2 text-xs font-semibold text-white">
              <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <select
                aria-label={skill === "writing" ? "Lọc loại đề" : "Lọc level"}
                value={selectedLevel}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedLevel(e.target.value)}
                className="bg-transparent text-xs font-semibold text-white outline-hidden cursor-pointer"
              >
                <option value="all" className="bg-[#141419] text-white">
                  {skill === "writing" ? "Tất cả loại đề" : "Tất cả level"}
                </option>
                <option value="b2" className="bg-[#141419] text-white">Aptis B2</option>
                <option value="c1" className="bg-[#141419] text-white">Aptis C1</option>
              </select>
            </div>
          </div>

          {/* Featured / Trọng điểm tháng Toggle */}
          <button
            type="button"
            aria-pressed={isFeaturedOnly}
            aria-label="Chỉ hiển thị đề trọng điểm tháng"
            onClick={() => setIsFeaturedOnly(!isFeaturedOnly)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              isFeaturedOnly
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                : "bg-[#141419] text-slate-400 border-[#22222a] hover:text-white"
            }`}
          >
            <Star className={`h-3.5 w-3.5 ${isFeaturedOnly ? "fill-amber-400 text-amber-400" : "text-slate-400"}`} />
            <span>Trọng điểm tháng</span>
          </button>
        </div>

        {/* Counter Text */}
        <div className="text-xs font-medium text-slate-300 self-end sm:self-center">
          Hiển thị <span className="text-white font-bold">{filteredTests.length}</span> / {tests.length} {skill === "writing" ? "đề viết" : skill === "speaking" ? "đề nói" : skill === "reading" ? "đề đọc" : skill === "listening" ? "đề nghe" : "bộ đề"}
        </div>
      </div>

      {/* 3. TEST CARDS GRID (3 Columns Desktop, responsive) */}
      {filteredTests.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {filteredTests.map((test) => (
            <TestListCard
              key={test.testId}
              skillType={skill}
              level={test.level}
              isFeatured={test.isFeatured}
              hasAttempt={test.hasAttempt}
              durationMinutes={test.durationMinutes}
              partsCount={test.partsCount}
              gradingType={test.gradingType}
              title={test.title}
              description={test.description}
              tags={test.tags}
              onViewDetails={() => router.push(test.practiceUrl)}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-[#22222a] bg-[#121215] p-12 text-center space-y-2">
          <p className="text-sm font-bold text-white">Không tìm thấy bộ đề phù hợp</p>
          <p className="text-xs text-slate-300">Vui lòng thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm.</p>
        </div>
      )}
    </div>
  );
}
