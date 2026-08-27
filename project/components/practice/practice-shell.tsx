"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Send,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { PracticeTimer } from "./practice-timer";
import { QuestionNavigation } from "./question-navigation";
import { QuestionRenderer } from "./question-renderer";
import { PracticeResult } from "./practice-result";
import { usePracticeSession } from "@/lib/hooks/use-practice-session";
import { useAuth } from "@/lib/hooks/use-auth";
import { loadProgressHistory, saveProgressAttempt } from "@/lib/storage";
import { ProgressAttemptRecord } from "@/lib/progress/types";
import { generateRecommendations } from "@/lib/recommendations";
import { StudyRecommendation } from "@/lib/recommendations/types";
import { formatTestDisplayName } from "@/lib/exam/test-catalog";

export interface PracticeShellProps {
  skill: string;
  partIdentifier: string;
  testId?: string;
}

export function PracticeShell({
  skill,
  partIdentifier,
  testId = "aptis-b2-01",
}: PracticeShellProps) {
  const { user } = useAuth();
  const { isHydrated, session, initSession, setAnswer } = usePracticeSession(user?.id);

  const [isLoading, setIsLoading] = React.useState(true);
  const [partData, setPartData] = React.useState<any>(null);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // Result state
  const [resultRecord, setResultRecord] = React.useState<ProgressAttemptRecord | null>(null);
  const [aiFeedback, setAiFeedback] = React.useState<any>(null);
  const [nextRecommendation, setNextRecommendation] = React.useState<StudyRecommendation | null>(null);

  // 0. Auto-pause all audio instances on navigation
  React.useEffect(() => {
    if (typeof document !== "undefined") {
      const allAudios = document.querySelectorAll("audio");
      allAudios.forEach((a) => {
        if (!a.paused) {
          a.pause();
        }
      });
    }
  }, [testId, skill, partIdentifier]);

  // 1. Fetch public dataset on mount
  React.useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/tests/${testId}`);
        const json = await res.json();
        if (!json.success || !json.data) {
          throw new Error("Failed to load test dataset");
        }

        const fullTest = json.data;
        let dataToSet = null;

        if (skill === "grammarVocabulary") {
          dataToSet =
            partIdentifier === "grammar"
              ? fullTest.grammarVocabulary.grammar
              : fullTest.grammarVocabulary.vocabulary;
        } else if (skill === "reading") {
          const partNum = parseInt(partIdentifier.replace("part", ""), 10) || 1;
          dataToSet = fullTest.reading.parts.find((p: any) => p.partNumber === partNum);
        } else if (skill === "listening") {
          const partNum = parseInt(partIdentifier.replace("part", ""), 10) || 1;
          dataToSet = fullTest.listening.parts.find((p: any) => p.partNumber === partNum);
        } else if (skill === "writing") {
          const partNum = parseInt(partIdentifier.replace("part", ""), 10) || 1;
          dataToSet = fullTest.writing?.parts?.find((p: any) => p.partNumber === partNum) || fullTest.writing?.parts?.[0];
        } else if (skill === "speaking") {
          const partNum = parseInt(partIdentifier.replace("part", ""), 10) || 1;
          dataToSet = fullTest.speaking?.parts?.find((p: any) => p.partNumber === partNum) || fullTest.speaking?.parts?.[0];
        }

        setPartData(dataToSet);
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : "Error loading practice data");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [testId, skill, partIdentifier]);

  // 2. Initialize or resume session
  React.useEffect(() => {
    if (isHydrated) {
      if (!session || session.testId !== testId || session.skill !== skill) {
        initSession({
          testId,
          mode: "practice",
          skill: skill as any,
          currentPartNumber: 1,
          remainingTimeSeconds: 600,
        });
      }
    }
  }, [isHydrated, session, initSession, testId, skill]);

  const answers = session?.answers || {};

  // Calculate total items
  let totalItems = 1;
  if (skill === "grammarVocabulary") {
    if (partIdentifier === "grammar") {
      totalItems = partData?.questions?.length || 25;
    } else {
      totalItems = partData?.sets?.length || 5;
    }
  }

  // Answered indices
  const answeredIndices: number[] = [];
  if (skill === "grammarVocabulary" && partIdentifier === "grammar" && partData?.questions) {
    partData.questions.forEach((q: any, idx: number) => {
      if (answers[q.id]) answeredIndices.push(idx);
    });
  }

  // 3. Handle Submit & Grading
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      let record: ProgressAttemptRecord;
      let gradingResultData: any = null;

      if (skill === "grammarVocabulary" || skill === "reading" || skill === "listening") {
        const res = await fetch("/api/grade/deterministic", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            testId,
            skill,
            partIdentifier,
            answers,
          }),
        });

        const json = await res.json();
        if (!json.success) throw new Error(json.error || "Grading failed");

        gradingResultData = json.data;
        const result = json.data;

        record = {
          id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          testId,
          mode: "practice",
          skill: skill as any,
          partIdentifier,
          completedAt: new Date().toISOString(),
          durationSeconds: 600 - (session?.remainingTimeSeconds || 600),
          rawScore: result.rawScore,
          maxRawScore: result.maxRawScore,
          percentage: result.percentage,
          disclaimer: "PRACTICE ESTIMATE — NOT AN OFFICIAL BRITISH COUNCIL SCORE",
        };
      } else if (skill === "writing") {
        const userResponses: Record<string, string> = {};
        for (const [k, v] of Object.entries(answers)) {
          if (typeof v === "string" && v.trim().length > 0) {
            userResponses[k] = v.trim();
          }
        }

        const partNum = parseInt(partIdentifier.replace("part", ""), 10) || 1;
        const firstKey = Object.keys(userResponses)[0] || (partData?.id as string | undefined);
        const submissionText =
          Object.values(userResponses).join("\n\n") || "No response provided";

        const res = await fetch("/api/grade/writing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            testId,
            partNumber: partNum,
            taskId: firstKey,
            submissionText,
            userResponses: Object.keys(userResponses).length > 0 ? userResponses : undefined,
          }),
        });

        const json = await res.json();
        if (!json.success) throw new Error(json.error || "Writing grading failed");

        gradingResultData = json.data;
        const evalResult = json.data;

        record = {
          id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          testId,
          mode: "practice",
          skill: "writing",
          partIdentifier,
          completedAt: new Date().toISOString(),
          durationSeconds: 600 - (session?.remainingTimeSeconds || 600),
          rawScore: evalResult.finalScore,
          maxRawScore: 50,
          percentage: (evalResult.finalScore / 50) * 100,
          disclaimer: "PRACTICE ESTIMATE — NOT AN OFFICIAL BRITISH COUNCIL SCORE",
        };
      } else if (skill === "speaking") {
        const currentQuestion = Array.isArray(partData?.questions)
          ? partData.questions[currentIndex]
          : null;
        const audioAnswerKey =
          currentQuestion && typeof currentQuestion === "object" && currentQuestion.id
            ? `${currentQuestion.id}__speaking_audio`
            : "speaking_audio";
        const audioData = answers[audioAnswerKey] as string | undefined;
        if (!audioData || !audioData.startsWith("data:audio/")) {
          throw new Error("Vui lòng ghi âm câu trả lời trước khi nộp bài.");
        }

        let mimeType: "audio/webm" | "audio/mp4" | "audio/wav" | "audio/ogg" | "audio/mpeg" | "audio/x-m4a" | "audio/aac" = "audio/webm";
        let rawBase64 = audioData;

        if (audioData.startsWith("data:")) {
          const match = audioData.match(/^data:([^;]+);base64,(.+)$/);
          if (match) {
            const detectedMime = match[1];
            if (
              ["audio/webm", "audio/mp4", "audio/wav", "audio/ogg", "audio/mpeg", "audio/x-m4a", "audio/aac"].includes(
                detectedMime
              )
            ) {
              mimeType = detectedMime as any;
            }
            rawBase64 = match[2];
          }
        }

        const partNum = parseInt(partIdentifier.replace("part", ""), 10) || 1;

        // Resolve the same task whose recording was collected by the renderer.
        let dynamicTaskId: string = `${testId}_s${partNum}_q1`;
        if (partData) {
          if (partData.id) {
            dynamicTaskId = partData.id;
          } else if (currentQuestion && typeof currentQuestion === "object" && currentQuestion.id) {
            dynamicTaskId = currentQuestion.id;
          } else if (Array.isArray(partData.questions) && partData.questions.length > 0) {
            const firstQuestion = partData.questions[0];
            if (typeof firstQuestion === "object" && firstQuestion !== null && firstQuestion.id) {
              dynamicTaskId = firstQuestion.id;
            }
          }
        }

        const res = await fetch("/api/grade/speaking", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            testId,
            partNumber: partNum,
            taskId: dynamicTaskId,
            audioBase64: rawBase64,
            mimeType,
          }),
        });

        const json = await res.json();
        if (!json.success) throw new Error(json.error || "Speaking grading failed");

        gradingResultData = json.data;
        const evalResult = json.data;

        record = {
          id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          testId,
          mode: "practice",
          skill: "speaking",
          partIdentifier,
          completedAt: new Date().toISOString(),
          durationSeconds: 600 - (session?.remainingTimeSeconds || 600),
          rawScore: evalResult.finalScore,
          maxRawScore: 50,
          percentage: (evalResult.finalScore / 50) * 100,
          disclaimer: "PRACTICE ESTIMATE — NOT AN OFFICIAL BRITISH COUNCIL SCORE",
        };
      } else {
        throw new Error(`Unsupported skill: ${skill}`);
      }

      // Save attempt & sync
      saveProgressAttempt(record, user?.id);

      if (user?.id) {
        fetch("/api/user/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(record),
        }).catch((e) => console.error("Cloud progress sync error:", e));
      }

      const allHistory = loadProgressHistory(user?.id);
      const recs = generateRecommendations(allHistory);

      setResultRecord(record);
      setAiFeedback(gradingResultData);
      setNextRecommendation(recs.primaryRecommendation);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Submission error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Render Result View
  if (resultRecord) {
    return (
      <PracticeResult
        record={resultRecord}
        aiFeedback={aiFeedback}
        recommendation={nextRecommendation}
        onRetry={() => {
          setResultRecord(null);
          setAiFeedback(null);
          setCurrentIndex(0);
        }}
      />
    );
  }

  // 5. Loading State
  if (isLoading || !partData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-300" />
        <p className="text-xs font-bold text-slate-300">Đang tải nội dung câu hỏi...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-[#1e1e26] pb-3 sm:pb-4">
        <Link
          href="/practice"
          className="flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white transition-colors h-9 px-2.5 rounded-xl hover:bg-white/5"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Thoát</span>
        </Link>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[11px] font-bold px-2.5 py-1 bg-emerald-500/15 text-emerald-300 border-emerald-500/30">
            {formatTestDisplayName(testId)} • {skill} • {partIdentifier}
          </Badge>
          <PracticeTimer initialSeconds={600} />
        </div>

        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex items-center gap-1.5 font-bold shadow-md bg-emerald-700 hover:bg-emerald-700 text-white text-xs h-9 px-4 rounded-xl cursor-pointer transition-all disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Đang chấm...</span>
            </>
          ) : (
            <>
              <Send className="h-3.5 w-3.5" />
              <span>Nộp bài</span>
            </>
          )}
        </button>
      </div>

      {errorMsg && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 items-start">
        {/* Main Question Area */}
        <div className="lg:col-span-3 space-y-4 sm:space-y-6">
          <QuestionRenderer
            skill={skill}
            partIdentifier={partIdentifier}
            partData={partData}
            currentIndex={currentIndex}
            answers={answers}
            onAnswerChange={(qId, val) => setAnswer(qId, val)}
          />

          {/* Navigation Controls */}
          {totalItems > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-[#1e1e26] gap-2">
              <button
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                className="flex items-center gap-1 text-xs h-9 px-3.5 rounded-xl border border-[#22222a] bg-[#16161d] text-slate-300 hover:text-white hover:bg-[#1a1a24] disabled:opacity-40 transition-colors cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Câu trước</span>
                <span className="sm:hidden">Trước</span>
              </button>

              <span className="text-xs text-slate-300 font-bold px-3 py-1 bg-[#16161d] border border-[#22222a] rounded-xl">
                {currentIndex + 1} / {totalItems}
              </span>

              <button
                disabled={currentIndex === totalItems - 1}
                onClick={() => setCurrentIndex((prev) => Math.min(totalItems - 1, prev + 1))}
                className="flex items-center gap-1 text-xs h-9 px-3.5 rounded-xl border border-[#22222a] bg-[#16161d] text-slate-300 hover:text-white hover:bg-[#1a1a24] disabled:opacity-40 transition-colors cursor-pointer"
              >
                <span className="hidden sm:inline">Câu sau</span>
                <span className="sm:hidden">Sau</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Question Palette */}
        {totalItems > 1 && (
          <div className="lg:col-span-1 border border-[#22222a] rounded-2xl p-4 bg-[#121215] shadow-sm">
            <QuestionNavigation
              totalQuestions={totalItems}
              currentIndex={currentIndex}
              answeredIndices={answeredIndices}
              onSelectIndex={(idx) => setCurrentIndex(idx)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
