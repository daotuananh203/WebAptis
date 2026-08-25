"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import { ExamHeader } from "./exam-header";
import { SubmitConfirmation } from "./submit-confirmation";
import { QuestionRenderer } from "../practice/question-renderer";
import { QuestionNavigation } from "../practice/question-navigation";
import {
  completeMockTestSection,
  createMockTestSession,
  loadActiveMockTestSession,
  submitFullMockTest,
  updateMockTestAnswer,
  updateMockTestSectionTimer,
} from "@/lib/storage/session";
import { saveProgressAttempt } from "@/lib/storage/storage";
import {
  MOCK_TEST_SECTIONS,
  MockTestSessionState,
  UserAnswerValue,
} from "@/lib/storage/types";
import { ExamComponentSkill, ProgressAttemptRecord } from "@/lib/progress/types";
import { useAuth } from "@/lib/hooks/use-auth";
import { cn } from "@/lib/utils";

export interface ExamShellProps {
  testId: string;
}

export interface ResolvedSectionPart {
  partIndex: number;
  partNumber: number;
  partIdentifier: string;
  tabLabel: string;
  fullTitle: string;
  data: any;
  totalItems: number;
}

export function resolveSectionParts(
  fullTestData: any,
  skill: ExamComponentSkill
): ResolvedSectionPart[] {
  if (!fullTestData) return [];

  if (skill === "grammarVocabulary") {
    const parts: ResolvedSectionPart[] = [];
    if (fullTestData.grammarVocabulary?.grammar) {
      parts.push({
        partIndex: 0,
        partNumber: 1,
        partIdentifier: "grammar",
        tabLabel: "Phần 1: Ngữ pháp",
        fullTitle: "Ngữ pháp (25 câu trắc nghiệm)",
        data: fullTestData.grammarVocabulary.grammar,
        totalItems: fullTestData.grammarVocabulary.grammar.questions?.length || 25,
      });
    }
    if (fullTestData.grammarVocabulary?.vocabulary) {
      parts.push({
        partIndex: parts.length,
        partNumber: 2,
        partIdentifier: "vocabulary",
        tabLabel: "Phần 2: Từ vựng",
        fullTitle: "Từ vựng học thuật (25 câu / 5 nhóm)",
        data: fullTestData.grammarVocabulary.vocabulary,
        totalItems: fullTestData.grammarVocabulary.vocabulary.sets?.length || 5,
      });
    }
    return parts;
  }

  const skillData = fullTestData[skill];
  if (!skillData || !Array.isArray(skillData.parts)) return [];

  const PART_LABELS: Record<string, Record<number, { tab: string; title: string }>> = {
    reading: {
      1: { tab: "Part 1: Điền từ", title: "Điền từ vào đoạn văn (5 ô trống)" },
      2: { tab: "Part 2: Sắp xếp câu", title: "Sắp xếp trật tự câu mạch lạc" },
      3: { tab: "Part 3: Ghép ý kiến", title: "Ghép ý kiến 4 người (7 nhận định)" },
      4: { tab: "Part 4: Ghép tiêu đề", title: "Ghép tiêu đề cho 7 đoạn văn" },
    },
    listening: {
      1: { tab: "Part 1: Hội thoại ngắn", title: "Nghe hội thoại nhận biết thông tin" },
      2: { tab: "Part 2: Nối ý kiến", title: "Nối ý kiến người nói" },
      3: { tab: "Part 3: Thảo luận", title: "Nghe thảo luận quan điểm" },
      4: { tab: "Part 4: Bài giảng", title: "Bài giảng & Thuyết trình độc thoại" },
    },
    writing: {
      1: { tab: "Part 1: Điền form", title: "Điền biểu mẫu (5 câu trả lời ngắn 1-5 từ)" },
      2: { tab: "Part 2: Viết ngắn", title: "Viết đoạn văn ngắn câu lạc bộ (20-30 từ)" },
      3: { tab: "Part 3: Chat phòng", title: "Trả lời 3 tin nhắn trong phòng chat (30-40 từ/câu)" },
      4: { tab: "Part 4: Viết email", title: "Viết 2 email (email thân mật & email trang trọng)" },
    },
    speaking: {
      1: { tab: "Part 1: Hỏi đáp cá nhân", title: "Trả lời 3 câu hỏi thông tin cá nhân (30s/câu)" },
      2: { tab: "Part 2: Miêu tả ảnh", title: "Miêu tả 1 bức ảnh và trả lời 2 câu hỏi mở rộng (45s/câu)" },
      3: { tab: "Part 3: So sánh ảnh", title: "So sánh 2 bức ảnh và trả lời 2 câu hỏi suy luận (45s/câu)" },
      4: { tab: "Part 4: Thuyết trình", title: "Chuẩn bị 1 phút và thuyết trình 2 phút theo chủ đề" },
    },
  };

  return skillData.parts.map((p: any, idx: number) => {
    const pNum = p.partNumber || idx + 1;
    const defaults = PART_LABELS[skill]?.[pNum] || {
      tab: `Part ${pNum}`,
      title: p.title || p.taskType || `Phần ${pNum}`,
    };

    return {
      partIndex: idx,
      partNumber: pNum,
      partIdentifier: `part${pNum}`,
      tabLabel: defaults.tab,
      fullTitle: p.title || defaults.title,
      data: p,
      totalItems: 1,
    };
  });
}

export function ExamShell({ testId }: ExamShellProps) {
  const router = useRouter();
  const { user } = useAuth();

  const [isLoading, setIsLoading] = React.useState(true);
  const [fullTestData, setFullTestData] = React.useState<any>(null);
  const [session, setSession] = React.useState<MockTestSessionState | null>(null);
  const [currentPartIndex, setCurrentPartIndex] = React.useState(0);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = React.useState(false);
  const [isProcessingGrading, setIsProcessingGrading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // 1. Fetch public test dataset and load/init mock test session
  React.useEffect(() => {
    async function init() {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/tests/${testId}`);
        const json = await res.json();
        if (!json.success || !json.data) {
          throw new Error("Failed to load test dataset");
        }
        setFullTestData(json.data);

        // Load existing session or create fresh one
        let active = loadActiveMockTestSession(user?.id);
        if (!active || active.testId !== testId || active.isSubmitted) {
          active = createMockTestSession(testId, user?.id);
        }
        setSession(active);
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : "Error loading mock test");
      } finally {
        setIsLoading(false);
      }
    }

    init();
  }, [testId, user?.id]);

  // Reset partIndex and question index when section advances
  React.useEffect(() => {
    setCurrentPartIndex(0);
    setCurrentIndex(0);
  }, [session?.currentSectionIndex]);

  // Auto-pause all audio instances when section or part changes
  React.useEffect(() => {
    if (typeof document !== "undefined") {
      const allAudios = document.querySelectorAll("audio");
      allAudios.forEach((a) => {
        if (!a.paused) {
          a.pause();
        }
      });
    }
  }, [session?.currentSectionIndex, currentPartIndex]);

  if (isLoading || !session || !fullTestData) {
    return (
      <div className="min-h-screen bg-[#0d0d0f] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-300" />
        <p className="text-xs font-bold text-slate-300">Đang chuẩn bị đề thi phòng thi thật...</p>
      </div>
    );
  }

  const currentSkill = MOCK_TEST_SECTIONS[session.currentSectionIndex];
  const currentSection = session.sections[currentSkill];
  const answers = currentSection.answers;

  const isFinalSection = session.currentSectionIndex === MOCK_TEST_SECTIONS.length - 1;
  const completedSkills = new Set(
    Object.entries(session.sections)
      .filter(([_, sec]) => sec.isCompleted)
      .map(([sk]) => sk as ExamComponentSkill)
  );

  // Dynamically resolve actual parts from dataset
  const resolvedParts = resolveSectionParts(fullTestData, currentSkill);
  const activePart = resolvedParts[currentPartIndex] || resolvedParts[0] || null;
  const activePartData = activePart?.data || null;
  const partIdentifier = activePart?.partIdentifier || "part1";
  const totalItems = activePart?.totalItems || 1;

  // Answer change handler
  const handleAnswerChange = (questionId: string, val: UserAnswerValue) => {
    const updated = updateMockTestAnswer(currentSkill, questionId, val, user?.id);
    if (updated) setSession(updated);
  };

  // Timer tick handler
  const handleTimerTick = (remainingSec: number) => {
    updateMockTestSectionTimer(currentSkill, remainingSec, user?.id);
  };

  // Submit/Complete current section and transition
  const handleProceedSection = async () => {
    try {
      setIsSubmitModalOpen(false);
      setIsProcessingGrading(true);
      setErrorMsg(null);

      // Deterministic grading only for GV, Reading, and Listening
      let scoreResult: any = { rawScore: 0, maxRawScore: 50, percentage: 0 };

      if (currentSkill === "grammarVocabulary" || currentSkill === "reading" || currentSkill === "listening") {
        const res = await fetch("/api/grade/deterministic", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            testId,
            skill: currentSkill,
            answers,
          }),
        });
        const json = await res.json();
        if (json.success && json.data) {
          scoreResult = {
            rawScore: json.data.rawScore,
            maxRawScore: json.data.maxRawScore,
            percentage: json.data.percentage,
            scaledScore: Math.round((json.data.rawScore / (json.data.maxRawScore || 1)) * 50),
          };
        }
      } else {
        // Writing & Speaking: preserve submission record and mark section completed safely
        scoreResult = {
          rawScore: 0,
          maxRawScore: 50,
          percentage: 0,
          scaledScore: 0,
          status: "completed",
        };
      }

      // Complete section in session
      const updated = completeMockTestSection(currentSkill, scoreResult, user?.id);

      if (isFinalSection) {
        // Finalize entire mock exam
        const finalized = submitFullMockTest(user?.id);

        // Save progress attempt records for each section
        if (finalized) {
          Object.values(finalized.sections).forEach((sec) => {
            if (sec.scoreResult) {
              const rec: ProgressAttemptRecord = {
                id: `mock_${finalized.sessionId}_${sec.skill}`,
                testId,
                mode: "mock-test",
                skill: sec.skill,
                rawScore: sec.scoreResult.rawScore || sec.scoreResult.scaledScore || 0,
                maxRawScore: sec.scoreResult.maxRawScore || 50,
                percentage: sec.scoreResult.percentage || 0,
                estimatedBand: sec.scoreResult.estimatedBand,
                completedAt: finalized.completedAt || new Date().toISOString(),
                disclaimer: "PRACTICE ESTIMATE — NOT AN OFFICIAL BRITISH COUNCIL SCORE",
              };
              saveProgressAttempt(rec, user?.id);
            }
          });
        }

        router.push(`/mock-test/results/${session.sessionId}`);
        return;
      }

      if (updated) {
        setSession(updated);
        setCurrentPartIndex(0);
        setCurrentIndex(0);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Section transition error");
    } finally {
      setIsProcessingGrading(false);
    }
  };

  const answeredCount = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-[#0d0d0f] text-slate-100 flex flex-col antialiased selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* 1. Exam Header */}
      <ExamHeader
        testId={testId}
        currentSkill={currentSkill}
        currentSectionIndex={session.currentSectionIndex}
        remainingTimeSeconds={currentSection.remainingTimeSeconds}
        completedSkills={completedSkills}
        isFinalSection={isFinalSection}
        onTimeExpired={handleProceedSection}
        onTimerTick={handleTimerTick}
        onRequestSubmit={() => setIsSubmitModalOpen(true)}
      />

      {/* 2. Main Question Workspace */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {errorMsg && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {isProcessingGrading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-emerald-300" />
            <p className="text-sm font-bold text-slate-300">
              {isFinalSection ? "Đang hoàn tất bài thi thử và tổng hợp báo cáo..." : "Đang chấm điểm phần thi..."}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Intra-Section Part Switcher Tabs */}
            {resolvedParts.length > 1 && (
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl border border-[#22222a] bg-[#121215]">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2">
                    Các phần thi:
                  </span>
                  {resolvedParts.map((part) => {
                    const isActive = currentPartIndex === part.partIndex;
                    return (
                      <button
                        key={part.partIdentifier}
                        type="button"
                        onClick={() => {
                          setCurrentPartIndex(part.partIndex);
                          setCurrentIndex(0);
                        }}
                        className={cn(
                          "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                          isActive
                            ? "bg-emerald-700 text-white shadow-md shadow-emerald-500/20"
                            : "bg-[#181822] text-slate-300 hover:text-white hover:bg-[#20202d] border border-[#242432]"
                        )}
                      >
                        <span>{part.tabLabel}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={currentPartIndex === 0}
                    onClick={() => {
                      setCurrentPartIndex((prev) => Math.max(0, prev - 1));
                      setCurrentIndex(0);
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#181822] text-slate-300 border border-[#242432] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#20202d] transition-all cursor-pointer"
                  >
                    ← Phần trước
                  </button>
                  <button
                    type="button"
                    disabled={currentPartIndex === resolvedParts.length - 1}
                    onClick={() => {
                      setCurrentPartIndex((prev) => Math.min(resolvedParts.length - 1, prev + 1));
                      setCurrentIndex(0);
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#181822] text-slate-300 border border-[#242432] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#20202d] transition-all cursor-pointer"
                  >
                    Phần tiếp →
                  </button>
                </div>
              </div>
            )}

            {/* Question Workspace with optional item navigation */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
              <div className={cn("space-y-6", totalItems > 1 ? "lg:col-span-3" : "lg:col-span-4")}>
                <QuestionRenderer
                  skill={currentSkill}
                  partIdentifier={partIdentifier}
                  partData={activePartData}
                  currentIndex={currentIndex}
                  answers={answers}
                  onAnswerChange={handleAnswerChange}
                />
              </div>

              {totalItems > 1 && (
                <div className="lg:col-span-1 border border-[#22222a] rounded-2xl p-4 bg-[#121215] shadow-sm">
                  <QuestionNavigation
                    totalQuestions={totalItems}
                    currentIndex={currentIndex}
                    answeredIndices={Object.keys(answers).map((_, i) => i)}
                    onSelectIndex={(idx) => setCurrentIndex(idx)}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* 3. Confirmation Dialog */}
      <SubmitConfirmation
        isOpen={isSubmitModalOpen}
        isFinalSection={isFinalSection}
        sectionTitle={currentSkill}
        totalQuestions={totalItems}
        answeredCount={answeredCount}
        onConfirm={handleProceedSection}
        onCancel={() => setIsSubmitModalOpen(false)}
      />
    </div>
  );
}
