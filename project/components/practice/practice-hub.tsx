"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import {
  BookA,
  BookOpen,
  Headphones,
  PenTool,
  Mic,
  GraduationCap,
  Sparkles,
  LayoutGrid,
  ListOrdered,
} from "lucide-react";
import { SkillPracticeLandingPage, PracticeModeDef, PartOptionDef } from "./skill-practice-landing-page";
import { SkillTestListView, TestListItemData } from "./skill-test-list-view";
import { ExamComponentSkill } from "@/lib/progress/types";
import { cn } from "@/lib/utils";
import { SOURCE_BATCH_TEST_CATALOG, ALL_EXAM_TEST_CATALOG } from "@/lib/exam/test-catalog";

import writingDataRaw from "@/data/staging/writing/ts-writing-data.json";
import speakingDataRaw from "@/data/staging/google-drive/speaking/ts-speaking-data.json";
import canonicalSpeakingBank from "@/data/speaking/canonical-speaking-practice-bank.json";
import { getSpeakingTopicDisplayTitle } from "@/lib/speaking/topic-title";

export interface SkillCategoryCatalog {
  skill: ExamComponentSkill;
  title: string;
  viewTitle: string;
  viewDescription: string;
  icon: typeof BookA;
  modeCount: number;
  modes: PracticeModeDef[];
  parts: PartOptionDef[];
}

const SOURCE_BATCH_LIST_ITEMS = (
  skill: "listening" | "reading" | "writing" | "speaking" | "grammarVocabulary",
  durationMinutes: number,
  partsCount: number,
  gradingType: "key" | "ai",
  title: string,
  description: string,
  practicePart: string,
): TestListItemData[] => SOURCE_BATCH_TEST_CATALOG.map((entry) => ({
  testId: entry.testId,
  testNumber: entry.catalogNumber,
  level: "B2",
  isFeatured: false,
  hasAttempt: false,
  durationMinutes,
  partsCount,
  gradingType,
  title: `${entry.label} — ${title}`,
  description,
  tags: [skill, "Aptis-B2", "Source-2026-08"],
  practiceUrl: `/practice/${skill}/${practicePart}?testId=${entry.testId}`,
}));

export const LISTENING_TESTS_DATA: TestListItemData[] = [...Array.from({ length: 16 }, (_, i): TestListItemData => {
  const testNum = i + 1;
  const testId = `aptis-b2-${testNum.toString().padStart(2, "0")}`;
  const isMissing = testNum === 16;
  return {
    testId,
    testNumber: testNum,
    level: "B2",
    isFeatured: testNum <= 3,
    hasAttempt: false,
    durationMinutes: 40,
    partsCount: 4,
    gradingType: "key",
    title: `Đề ${testNum.toString().padStart(2, "0")} — Aptis Listening B2${isMissing ? " (Không audio gốc)" : ""}`,
    description: isMissing
      ? "Đề thi Listening số 16 (làm bài dựa trên câu hỏi và transcript, chưa có file MP3 gốc)."
      : `Luyện nghe trọn vẹn 4 phần Aptis B2 với audio MP3 liên tục chất lượng cao (>10MB).`,
    tags: ["Listening", `Test-${testNum.toString().padStart(2, "0")}`, "Full-4-Parts"],
    practiceUrl: `/practice/listening/part1?testId=${testId}`,
  };
}), ...SOURCE_BATCH_LIST_ITEMS("listening", 40, 4, "key", "Aptis Listening B2", "Bộ đề nguồn 4 kỹ năng gồm đầy đủ 4 phần Listening và audio được cắt từ master MP3 theo transcript.", "part1")];

export const READING_TESTS_DATA: TestListItemData[] = [...Array.from({ length: 16 }, (_, i): TestListItemData => {
  const testNum = i + 1;
  const testId = `aptis-b2-${testNum.toString().padStart(2, "0")}`;
  return {
    testId,
    testNumber: testNum,
    level: "B2",
    isFeatured: testNum <= 3,
    hasAttempt: false,
    durationMinutes: 35,
    partsCount: 4,
    gradingType: "key",
    title: `Đề ${testNum.toString().padStart(2, "0")} — Aptis Reading B2`,
    description: `Luyện tập 4 phần Đọc Aptis B2 (Điền từ đoạn ngắn, Sắp xếp câu, Ý kiến 4 người, Ghép tiêu đề).`,
    tags: ["Reading", `Test-${testNum.toString().padStart(2, "0")}`, "Full-4-Parts"],
    practiceUrl: `/practice/reading/part1?testId=${testId}`,
  };
}), ...SOURCE_BATCH_LIST_ITEMS("reading", 35, 4, "key", "Aptis Reading B2", "Bộ đề nguồn 4 kỹ năng gồm đầy đủ 4 phần Reading được trích xuất trực tiếp từ PDF.", "part1")];

export const WRITING_TESTS_DATA: TestListItemData[] = [...(writingDataRaw as any[]).map((item) => ({
  ...item,
  gradingType: item.gradingType as "key" | "ai",
})), ...SOURCE_BATCH_LIST_ITEMS("writing", 50, 4, "ai", "Aptis Writing B2", "Bộ đề nguồn 4 kỹ năng với 4 phần Writing trích xuất từ đề PDF và có chấm AI.", "part1")];

export const SPEAKING_TESTS_DATA: TestListItemData[] = [...(speakingDataRaw as any[]).map((item) => ({
  ...item,
  gradingType: item.gradingType as "key" | "ai",
})), ...SOURCE_BATCH_LIST_ITEMS("speaking", 12, 4, "ai", "Aptis Speaking B2", "Bộ đề nguồn 4 kỹ năng với prompt và hình ảnh được trích xuất trực tiếp từ PDF.", "part1")];

/** Source-bank cards for Practice; Mock Test retains its own test catalog. */
export const SPEAKING_PRACTICE_BANK_DATA: TestListItemData[] = (() => {
  const parts = (canonicalSpeakingBank as any).parts;
  const rows: TestListItemData[] = [];
  for (const partNumber of [1, 2, 3, 4]) {
    const part = parts[`part${partNumber}`];
    const items = part.questions || part.topics || [];
    items.forEach((item: any, index: number) => {
      const id = item.questionId || item.topicId;
      const title = item.question || (item.title ? getSpeakingTopicDisplayTitle(item) : undefined) || `Topic ${index + 1}`;
      rows.push({
        testId: id,
        testNumber: index + 1,
        level: "B2",
        isFeatured: index < 3,
        hasAttempt: false,
        durationMinutes: partNumber === 4 ? 3 : 1,
        partsCount: 1,
        gradingType: "ai",
        title: `Part ${partNumber} · ${title}`,
        description: `${item.source} · ${item.availability === "source-limited" ? "Source-limited asset" : "Source verified"}`,
        tags: ["Speaking", `Part-${partNumber}`, "Canonical-Source-Bank"],
        practiceUrl: `/practice/speaking/part${partNumber}?bank=canonical&itemId=${encodeURIComponent(id)}`,
      });
    });
  }
  return rows;
})();

export const GRAMMAR_TESTS_DATA: TestListItemData[] = [...Array.from({ length: 16 }, (_, i): TestListItemData => {
  const testNum = i + 1;
  const testId = `aptis-b2-${testNum.toString().padStart(2, "0")}`;
  return {
    testId,
    testNumber: testNum,
    level: "B2",
    isFeatured: testNum <= 3,
    hasAttempt: false,
    durationMinutes: 25,
    partsCount: 2,
    gradingType: "key",
    title: `Đề ${testNum.toString().padStart(2, "0")} — Ngữ pháp & Từ vựng B2`,
    description: `Luyện 25 câu trắc nghiệm Ngữ pháp và 25 câu Từ vựng học thuật Aptis B2.`,
    tags: ["Grammar", "Vocabulary", `Test-${testNum.toString().padStart(2, "0")}`],
    practiceUrl: `/practice/grammarVocabulary/grammar?testId=${testId}`,
  };
}), ...SOURCE_BATCH_LIST_ITEMS("grammarVocabulary", 25, 2, "key", "Aptis Grammar & Vocabulary B2", "Bộ đề nguồn 4 kỹ năng gồm 25 câu Grammar và 25 câu Vocabulary từ PDF.", "grammar")];

export const PRACTICE_SKILLS_CATALOG: SkillCategoryCatalog[] = [
  {
    skill: "listening",
    title: "Nghe (Listening)",
    viewTitle: "Đề Listening",
    viewDescription: "Luyện nghe trọn vẹn 4 phần với 15 file audio thực tế chất lượng cao và trình phát âm thanh liên tục.",
    icon: Headphones,
    modeCount: 3,
    modes: [
      {
        badge: "ĐỀ XUẤT",
        tag: "4 PART",
        icon: Headphones,
        title: "Luyện theo từng Part",
        description: "Luyện riêng từng phần từ Part 1 đến Part 4 với 23 bộ đề; audio chỉ phát khi asset nguồn đã được xác minh.",
        buttonLabel: "Đi tới bài test →",
      },
      {
        badge: "BÀI TEST",
        tag: "FULL TEST",
        icon: GraduationCap,
        title: "Full Listening Test",
        description: "Làm trọn vẹn 4 phần nghe trong 40 phút chuẩn định dạng Aptis B2.",
        href: "/mock-test",
        buttonLabel: "Vào làm full test →",
      },
      {
        badge: "MẸO",
        tag: "STRATEGY",
        icon: Sparkles,
        title: "Chiến thuật & Mẹo Nghe B2",
        description: "Bí quyết bắt keyword, tránh bẫy paraphrase và kỹ thuật nghe tối đa 2 lần.",
        href: "/coach?topic=listening",
        buttonLabel: "Xem mẹo & chiến thuật →",
      },
    ],
    parts: [
      {
        partIdentifier: "part1",
        name: "Part 1: Bắt thông tin chi tiết",
        officialTiming: "10 phút",
        itemCount: "13 câu hỏi",
        description: "Nghe các đoạn thoại ngắn để xác định thông tin thực tế cụ thể.",
        href: "/practice/listening/part1",
      },
      {
        partIdentifier: "part2",
        name: "Part 2: Ghép người nói",
        officialTiming: "10 phút",
        itemCount: "4 người nói",
        description: "Nghe 4 người chia sẻ về cùng chủ đề và ghép ý kiến tương ứng.",
        href: "/practice/listening/part2",
      },
      {
        partIdentifier: "part3",
        name: "Part 3: Thảo luận hai người",
        officialTiming: "10 phút",
        itemCount: "4 ý kiến",
        description: "Nghe đoạn hội thoại nam-nữ và xác định quan điểm của từng người.",
        href: "/practice/listening/part3",
      },
      {
        partIdentifier: "part4",
        name: "Part 4: Độc thoại bài giảng",
        officialTiming: "10 phút",
        itemCount: "4 câu hỏi",
        description: "Nghe bài nói chuyện dài và trả lời các câu hỏi suy luận thái độ.",
        href: "/practice/listening/part4",
      },
    ],
  },
  {
    skill: "reading",
    title: "Đọc (Reading)",
    viewTitle: "Đề Reading",
    viewDescription: "Đọc hiểu văn bản Aptis B2 với 23 bộ đề (Điền từ, Sắp xếp câu, Ghép ý kiến, Ghép tiêu đề đoạn văn).",
    icon: BookOpen,
    modeCount: 3,
    modes: [
      {
        badge: "ĐỀ XUẤT",
        tag: "4 PART",
        icon: BookOpen,
        title: "Luyện theo từng Part",
        description: "Luyện riêng từng phần từ Part 1 đến Part 4 với 23 bộ đề nguồn.",
        buttonLabel: "Đi tới bài test →",
      },
      {
        badge: "BÀI TEST",
        tag: "FULL TEST",
        icon: GraduationCap,
        title: "Full Reading Test",
        description: "Làm trọn vẹn 4 phần đọc trong 35 phút chuẩn định dạng Aptis B2.",
        href: "/mock-test",
        buttonLabel: "Vào làm full test →",
      },
      {
        badge: "MẸO",
        tag: "STRATEGY",
        icon: Sparkles,
        title: "Chiến thuật & Mẹo Đọc B2",
        description: "Kỹ thuật Skimming, Scanning, nối câu mạch lạc và ghép tiêu đề đoạn văn.",
        href: "/coach?topic=reading",
        buttonLabel: "Xem mẹo & chiến thuật →",
      },
    ],
    parts: [
      {
        partIdentifier: "part1",
        name: "Part 1: Hiểu văn bản ngắn (Điền từ)",
        officialTiming: "7 phút",
        itemCount: "5 câu hỏi",
        description: "Điền từ vào chỗ trống trong đoạn văn ngắn thân mật.",
        href: "/practice/reading/part1",
      },
      {
        partIdentifier: "part2",
        name: "Part 2: Sắp xếp câu thành đoạn văn",
        officialTiming: "8 phút",
        itemCount: "2 bài (6 câu/bài)",
        description: "Sắp xếp các câu xáo trộn thành một câu chuyện hoặc quy trình mạch lạc.",
        href: "/practice/reading/part2",
      },
      {
        partIdentifier: "part3",
        name: "Part 3: Đọc hiểu văn bản dài (Ý kiến 4 người)",
        officialTiming: "10 phút",
        itemCount: "7 câu hỏi",
        description: "Đọc ý kiến của 4 người về cùng một chủ đề và ghép nhận định.",
        href: "/practice/reading/part3",
      },
      {
        partIdentifier: "part4",
        name: "Part 4: Ghép tiêu đề đoạn văn",
        officialTiming: "10 phút",
        itemCount: "7 đoạn văn",
        description: "Đọc bài viết học thuật dài và chọn tiêu đề phù hợp nhất cho từng đoạn.",
        href: "/practice/reading/part4",
      },
    ],
  },
  {
    skill: "writing",
    title: "Viết (Writing)",
    viewTitle: "Đề Writing",
    viewDescription: "Viết bài theo đúng cấu trúc Aptis và nhận nhận xét chi tiết từ Giáo viên AI được tuỳ biến theo kinh nghiệm giảng dạy thực tế.",
    icon: PenTool,
    modeCount: 3,
    modes: [
      {
        badge: "ĐỀ XUẤT",
        tag: "4 PART",
        icon: PenTool,
        title: "Luyện đề Writing",
        description: `Danh sách ${ALL_EXAM_TEST_CATALOG.length} bộ đề Writing B2 chuẩn cấu trúc Aptis.`,
        buttonLabel: "Đi tới danh sách đề →",
      },
      {
        badge: "BÀI TEST",
        tag: "FULL TEST",
        icon: GraduationCap,
        title: "Full Writing Test",
        description: "Làm trọn vẹn bài viết 50 phút chuẩn định dạng Aptis B2.",
        href: "/mock-test",
        buttonLabel: "Vào làm full test →",
      },
      {
        badge: "MẸO",
        tag: "STRATEGY",
        icon: Sparkles,
        title: "Chiến thuật & Mẹo Viết B2",
        description: "Bí quyết chuyển đổi văn phong thân mật sang trang trọng trong Part 4.",
        href: "/coach?topic=writing",
        buttonLabel: "Xem mẹo & chiến thuật →",
      },
    ],
    parts: [
      {
        partIdentifier: "part1",
        name: "Part 1: Điền thông tin cá nhân",
        officialTiming: "3 phút",
        itemCount: "5 câu hỏi",
        description: "Điền câu trả lời ngắn từ 1 đến 5 từ vào mẫu đăng ký.",
        href: "/practice/writing/part1",
      },
      {
        partIdentifier: "part2",
        name: "Part 2: Viết biểu mẫu ngắn",
        officialTiming: "7 phút",
        itemCount: "1 câu hỏi",
        description: "Viết câu trả lời hoàn chỉnh từ 20 đến 30 từ.",
        href: "/practice/writing/part2",
      },
      {
        partIdentifier: "part3",
        name: "Part 3: Trả lời câu hỏi mạng xã hội",
        officialTiming: "10 phút",
        itemCount: "3 câu hỏi",
        description: "Viết 3 câu trả lời trong phòng chat, mỗi câu từ 30 đến 40 từ.",
        href: "/practice/writing/part3",
      },
      {
        partIdentifier: "part4",
        name: "Part 4: Viết email thân mật & trang trọng",
        officialTiming: "30 phút",
        itemCount: "2 email",
        description: "Email cho bạn bè (50 từ) và email cho ban quản trị (120-150 từ).",
        href: "/practice/writing/part4",
      },
    ],
  },
  {
    skill: "speaking",
    title: "Nói (Speaking)",
    viewTitle: "Đề Speaking",
    viewDescription: "Đề Speaking standalone 4 part: nghe câu hỏi, chuẩn bị và thu âm câu trả lời như trong phòng thi Aptis.",
    icon: Mic,
    modeCount: 3,
    modes: [
      {
        badge: "ĐỀ XUẤT",
        tag: "4 PART",
        icon: Mic,
        title: "Luyện đề Speaking",
        description: "Practice Bank độc lập gồm 31 câu Part 1, 34 topic Part 2, 39 topic Part 3 và 29 topic Part 4 từ source đã kiểm chứng.",
        buttonLabel: "Đi tới danh sách đề →",
      },
      {
        badge: "BÀI TEST",
        tag: "FULL TEST",
        icon: GraduationCap,
        title: "Full Speaking Test",
        description: "Làm trọn vẹn bài nói 12 phút với hệ thống ghi âm web.",
        href: "/mock-test",
        buttonLabel: "Vào làm full test →",
      },
      {
        badge: "MẸO",
        tag: "STRATEGY",
        icon: Sparkles,
        title: "Chiến thuật & Mẹo Nói B2",
        description: "Kỹ thuật mở rộng ý, miêu tả tranh Part 2 và so sánh 2 ảnh Part 3.",
        href: "/coach?topic=speaking",
        buttonLabel: "Xem mẹo & chiến thuật →",
      },
    ],
    parts: [
      {
        partIdentifier: "part1",
        name: "Part 1: Hỏi đáp cá nhân",
        officialTiming: "30s / câu",
        itemCount: "31 câu nguồn",
        description: "31 câu hỏi Part 1 canonical; không hiển thị 48 mock slots.",
        href: "/practice/speaking/part1?bank=canonical",
      },
      {
        partIdentifier: "part2",
        name: "Part 2: Miêu tả 1 bức ảnh",
        officialTiming: "45s / câu",
        itemCount: "34 topic nguồn",
        description: "Chọn topic độc lập, xem ảnh nguồn, miêu tả và trả lời follow-up.",
        href: "/practice/speaking/part2?bank=canonical",
      },
      {
        partIdentifier: "part3",
        name: "Part 3: So sánh 2 bức ảnh",
        officialTiming: "45s / câu",
        itemCount: "39 topic nguồn",
        description: "Chọn topic độc lập; chỉ topic có đủ asset mới được đánh dấu available.",
        href: "/practice/speaking/part3?bank=canonical",
      },
      {
        partIdentifier: "part4",
        name: "Part 4: Thuyết trình theo chủ đề",
        officialTiming: "Chuẩn bị 1p • Nói 2p",
        itemCount: "29 topic nguồn",
        description: "Nói liên tục trong 2 phút trả lời 3 câu hỏi về topic source.",
        href: "/practice/speaking/part4?bank=canonical",
      },
    ],
  },
  {
    skill: "grammarVocabulary",
    title: "Ngữ pháp & Từ vựng",
    viewTitle: "Đề Ngữ pháp & Từ vựng",
    viewDescription: "Luyện tập 25 câu trắc nghiệm ngữ pháp và 25 câu từ vựng học thuật chuẩn định dạng Aptis B2.",
    icon: BookA,
    modeCount: 2,
    modes: [
      {
        badge: "ĐỀ XUẤT",
        tag: "50 CÂU",
        icon: BookA,
        title: "Luyện theo phần (Grammar / Vocab)",
        description: "Luyện 25 câu ngữ pháp hoặc 25 câu từ vựng với 23 bộ đề nguồn.",
        buttonLabel: "Đi tới bài test →",
      },
      {
        badge: "MẸO",
        tag: "STRATEGY",
        icon: Sparkles,
        title: "Mẹo & Chuyên đề Ngữ pháp B2",
        description: "Tổng hợp 10 chủ điểm ngữ pháp trọng tâm Aptis B2 và từ vựng học thuật.",
        href: "/coach?topic=grammar",
        buttonLabel: "Xem mẹo & chiến thuật →",
      },
    ],
    parts: [
      {
        partIdentifier: "grammar",
        name: "Grammar (Trắc nghiệm ngữ pháp)",
        officialTiming: "12 phút",
        itemCount: "25 câu hỏi",
        description: "Luyện thì động từ, câu điều kiện, đảo ngữ, bị động và giới từ.",
        href: "/practice/grammarVocabulary/grammar",
      },
      {
        partIdentifier: "vocabulary",
        name: "Vocabulary (Từ vựng học thuật)",
        officialTiming: "13 phút",
        itemCount: "25 câu (5 nhóm)",
        description: "Từ đồng nghĩa, collocations, điền từ vào câu và nối định nghĩa.",
        href: "/practice/grammarVocabulary/vocabulary",
      },
    ],
  },
];

export function PracticeHub() {
  const searchParams = useSearchParams();
  const skillParam = searchParams.get("skill") as ExamComponentSkill | null;

  const [selectedSkill, setSelectedSkill] = React.useState<ExamComponentSkill>(
    skillParam && PRACTICE_SKILLS_CATALOG.some((c) => c.skill === skillParam)
      ? skillParam
      : "listening"
  );

  const [viewMode, setViewMode] = React.useState<"cards" | "parts">("cards");

  React.useEffect(() => {
    if (skillParam && PRACTICE_SKILLS_CATALOG.some((c) => c.skill === skillParam)) {
      setSelectedSkill(skillParam);
    }
  }, [skillParam]);

  const currentCategory =
    PRACTICE_SKILLS_CATALOG.find((c) => c.skill === selectedSkill) ??
    PRACTICE_SKILLS_CATALOG[0];

  const getTestsDataForSkill = (skill: ExamComponentSkill): TestListItemData[] => {
    switch (skill) {
      case "listening": return LISTENING_TESTS_DATA;
      case "reading": return READING_TESTS_DATA;
      case "writing": return WRITING_TESTS_DATA;
      case "speaking": return SPEAKING_PRACTICE_BANK_DATA;
      case "grammarVocabulary": return GRAMMAR_TESTS_DATA;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Skill Selector Tabs & View Mode Toggle */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-[#1e1e26] pb-4">
        {/* Skill Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {PRACTICE_SKILLS_CATALOG.map((cat) => {
            const Icon = cat.icon;
            const isSelected = cat.skill === selectedSkill;

            return (
              <button
                key={cat.skill}
                onClick={() => setSelectedSkill(cat.skill)}
                className={cn(
                  "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border",
                  isSelected
                    ? "bg-emerald-700 text-white border-emerald-500 shadow-md shadow-emerald-500/20"
                    : "bg-[#141419] text-slate-300 border-[#22222a] hover:bg-[#1a1a22] hover:text-white"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{cat.title}</span>
              </button>
            );
          })}
        </div>

        {/* View Mode Switcher: Cards vs Parts Drill */}
        <div className="flex items-center gap-1 bg-[#141419] p-1 rounded-xl border border-[#22222a] self-start sm:self-auto">
          <button
            onClick={() => setViewMode("cards")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
              viewMode === "cards"
                ? "bg-[#1e1e28] text-white shadow-xs"
                : "text-slate-400 hover:text-white"
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>Danh sách Bộ đề</span>
          </button>

          <button
            onClick={() => setViewMode("parts")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
              viewMode === "parts"
                ? "bg-[#1e1e28] text-white shadow-xs"
                : "text-slate-400 hover:text-white"
            )}
          >
            <ListOrdered className="h-3.5 w-3.5" />
            <span>Luyện theo Part</span>
          </button>
        </div>
      </div>

      {/* 2. Content Render: Card View (Default) vs Parts Drill */}
      {viewMode === "cards" ? (
        <SkillTestListView
          skill={selectedSkill}
          title={currentCategory.viewTitle}
          description={currentCategory.viewDescription}
          icon={currentCategory.icon}
          tests={getTestsDataForSkill(selectedSkill)}
        />
      ) : (
        <SkillPracticeLandingPage
          skillName={currentCategory.title}
          skillKey={currentCategory.skill}
          icon={currentCategory.icon}
          modeCount={currentCategory.modeCount}
          modes={currentCategory.modes}
          parts={currentCategory.parts}
          tests={ALL_EXAM_TEST_CATALOG.map((entry) => ({
            testId: entry.testId,
            label: entry.label,
            hasListeningAudio: entry.hasListeningAudio,
          }))}
        />
      )}
    </div>
  );
}
