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
import { loadProgressHistory } from "@/lib/storage";
import { ProgressAttemptRecord } from "@/lib/progress/types";
import {
  createAttemptFromSpeakingResult,
  createAttemptFromWritingResult,
} from "@/lib/progress/history";
import { generateRecommendations } from "@/lib/recommendations";
import { StudyRecommendation } from "@/lib/recommendations/types";
import { formatTestDisplayName } from "@/lib/exam/test-catalog";
import { getSpeakingTopicDisplayTitle } from "@/lib/speaking/topic-title";

export interface PracticeShellProps {
  skill: string;
  partIdentifier: string;
  testId?: string;
  /** When true, Speaking is loaded from the independent canonical bank. */
  practiceBank?: boolean;
  practiceItemId?: string;
}

function resolvePracticePartNumber(skill: string, partIdentifier: string): number {
  if (skill === "grammarVocabulary") {
    return partIdentifier === "vocabulary" ? 2 : 1;
  }
  return parseInt(partIdentifier.replace("part", ""), 10) || 1;
}

export function PracticeShell({
  skill,
  partIdentifier,
  testId = "aptis-b2-01",
  practiceBank = false,
  practiceItemId,
}: PracticeShellProps) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const {
    isHydrated,
    hydratedUserId,
    session,
    initSession,
    setAnswer,
    setNavigation,
    setTimeRemaining,
    submitSession,
  } = usePracticeSession(user?.id);
  const requestedPartNumber = resolvePracticePartNumber(skill, partIdentifier);
  const isSpeakingBank = skill === "speaking" && practiceBank;
  const sessionTestId = isSpeakingBank ? "speaking-practice-bank" : testId;

  const [isLoading, setIsLoading] = React.useState(true);
  const [partData, setPartData] = React.useState<any>(null);
  const [activePracticeItemId, setActivePracticeItemId] = React.useState<string | undefined>(practiceItemId);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const submitInFlightRef = React.useRef(false);

  // Result state
  const [resultRecord, setResultRecord] = React.useState<ProgressAttemptRecord | null>(null);
  const [aiFeedback, setAiFeedback] = React.useState<any>(null);
  const [nextRecommendation, setNextRecommendation] = React.useState<StudyRecommendation | null>(null);

  // A route change starts a new result context.  The completed result itself
  // is restored below only when the persisted session matches this route.
  React.useEffect(() => {
    setResultRecord(null);
    setAiFeedback(null);
    setNextRecommendation(null);
    setPartData(null);
    setCurrentIndex(0);
    setActivePracticeItemId(practiceItemId);
  }, [testId, skill, partIdentifier, practiceItemId, isSpeakingBank]);

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
        if (isSpeakingBank) {
          const query = new URLSearchParams({ part: String(requestedPartNumber) });
          if (practiceItemId) query.set("itemId", practiceItemId);
          const res = await fetch(`/api/speaking/practice-bank?${query.toString()}`);
          const json = await res.json();
          if (!json.success || !json.data?.item) throw new Error(json.error || "Failed to load Speaking Practice bank item");
          const item = json.data.item;
          const itemId = item.questionId || item.topicId;
          setActivePracticeItemId(itemId);
          const questions = "questionId" in item
            ? [{ id: item.questionId, prompt: item.question }]
            : item.prompts.map((prompt: string, index: number) => ({ id: `${item.topicId}-q${index + 1}`, prompt }));
          const bankPartData: any = {
            id: itemId,
            topic: item.title ? getSpeakingTopicDisplayTitle(item) : item.title,
            instructions: requestedPartNumber === 2
              ? "Describe the picture and answer the two follow-up questions. You have 45 seconds for each response."
              : requestedPartNumber === 3
              ? "Compare the two pictures and answer the two follow-up questions. You have 45 seconds for each response."
              : requestedPartNumber === 4
              ? "Speak for two minutes on the topic. You have one minute to prepare."
              : "Answer the personal information question clearly and naturally.",
            questions,
            source: item.source,
            sourceEvidence: item.sourceEvidence,
            availability: item.availability,
          };
          if (requestedPartNumber === 2) bankPartData.imageUrl = item.image;
          if (requestedPartNumber === 3) {
            bankPartData.images = {
              image1Url: item.imageA,
              image1Alt: "Image A",
              image2Url: item.imageB,
              image2Alt: "Image B",
            };
          }
          setPartData(bankPartData);
          return;
        }
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

        if (!dataToSet) {
          throw new Error(`Không tìm thấy nội dung ${skill} ${partIdentifier} cho bộ đề này`);
        }
        setPartData(dataToSet);
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : "Error loading practice data");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [testId, skill, partIdentifier, isSpeakingBank, requestedPartNumber, practiceItemId]);

  // 2. Initialize or resume session
  React.useEffect(() => {
    if (isHydrated && !isAuthLoading && hydratedUserId === user?.id) {
      const sessionMatchesRoute = Boolean(
        session &&
        session.testId === sessionTestId &&
        (!isSpeakingBank || session.practiceItemId === activePracticeItemId) &&
        session.skill === skill &&
        session.currentPartNumber === requestedPartNumber,
      );
      if (!sessionMatchesRoute) {
        initSession({
          testId: sessionTestId,
          practiceItemId: isSpeakingBank ? activePracticeItemId : undefined,
          mode: "practice",
          skill: skill as any,
          currentPartNumber: requestedPartNumber,
          remainingTimeSeconds: 600,
        });
      }
    }
  }, [isHydrated, isAuthLoading, hydratedUserId, user?.id, session, initSession, sessionTestId, skill, requestedPartNumber, isSpeakingBank, activePracticeItemId]);

  // Restore the exact result/AI feedback after a browser refresh.  Only a
  // submitted session for the current test/skill/part is eligible.
  React.useEffect(() => {
    const sessionMatchesRoute = Boolean(
      session &&
      session.testId === sessionTestId &&
      (!isSpeakingBank || session.practiceItemId === activePracticeItemId) &&
      session.skill === skill &&
      session.currentPartNumber === requestedPartNumber,
    );
    if (!isHydrated || !sessionMatchesRoute || !session?.isSubmitted || !session.resultRecord) return;

    setResultRecord(session.resultRecord);
    setAiFeedback(session.aiFeedback ?? null);
    const allHistory = loadProgressHistory(user?.id);
    setNextRecommendation(generateRecommendations(allHistory).primaryRecommendation);
  }, [isHydrated, session, sessionTestId, skill, requestedPartNumber, user?.id, isSpeakingBank, activePracticeItemId]);

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
  if (isSpeakingBank) {
    totalItems = partData?.questions?.length || 1;
  }

  const questionIdForIndex = React.useCallback((index: number): string | undefined => {
    if (isSpeakingBank && Array.isArray(partData?.questions)) {
      return partData.questions[index]?.id;
    }
    if (skill === "grammarVocabulary" && partIdentifier === "grammar") {
      return partData?.questions?.[index]?.id;
    }
    if (skill === "grammarVocabulary" && partIdentifier === "vocabulary") {
      return partData?.sets?.[index]?.id;
    }
    return partData?.id;
  }, [isSpeakingBank, partData, skill, partIdentifier]);

  const moveToIndex = React.useCallback((index: number) => {
    const boundedIndex = Math.max(0, Math.min(totalItems - 1, index));
    setCurrentIndex(boundedIndex);
    setNavigation(requestedPartNumber, questionIdForIndex(boundedIndex));
  }, [questionIdForIndex, requestedPartNumber, setNavigation, totalItems]);

  // Restore the exact question/set after a refresh.  The stored ID is the
  // canonical identifier, so this remains correct if the rendered order
  // changes without silently jumping back to question 1.
  React.useEffect(() => {
    if (!partData || !session || session.isSubmitted) return;
    const storedId = session.currentQuestionId;
    if (!storedId) return;
    const restoredIndex = Array.from({ length: totalItems }, (_, index) => index)
      .find((index) => questionIdForIndex(index) === storedId);
    if (restoredIndex !== undefined && restoredIndex !== currentIndex) {
      setCurrentIndex(restoredIndex);
    }
  }, [partData, session, session?.currentQuestionId, questionIdForIndex, totalItems, currentIndex]);

  // Answered indices
  const answeredIndices: number[] = [];
  if (skill === "grammarVocabulary" && partIdentifier === "grammar" && partData?.questions) {
    partData.questions.forEach((q: any, idx: number) => {
      if (answers[q.id]) answeredIndices.push(idx);
    });
  }
  if (skill === "grammarVocabulary" && partIdentifier === "vocabulary" && partData?.sets) {
    partData.sets.forEach((set: any, idx: number) => {
      const complete = Array.isArray(set.items) && set.items.length > 0 && set.items.every((item: any) => {
        const value = answers[item.id];
        return value !== undefined && value !== null && String(value).trim().length > 0;
      });
      if (complete) answeredIndices.push(idx);
    });
  }
  if (isSpeakingBank && partData?.questions) {
    partData.questions.forEach((q: any, idx: number) => {
      if (answers[q.id]) answeredIndices.push(idx);
    });
  }

  // 3. Handle Submit & Grading
  const handleSubmit = async () => {
    // React state updates are asynchronous; the ref closes the small window
    // where two rapid clicks could otherwise create two Gemini requests.
    if (submitInFlightRef.current || session?.isSubmitted) return;
    submitInFlightRef.current = true;
    try {
      if (isAuthLoading || !isHydrated) {
        throw new Error("Đang xác thực tài khoản, vui lòng chờ một chút rồi nộp bài.");
      }
      if (!user?.id) {
        throw new Error("Phiên đăng nhập không còn hợp lệ. Vui lòng đăng nhập lại trước khi nộp bài.");
      }
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
          // A session has one logical submission.  A stable id makes a
          // repeated POST/retry an upsert instead of a second history row.
          id: session?.sessionId
            ? `practice_${session.sessionId}`
            : `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
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
        if (Object.keys(userResponses).length === 0) {
          throw new Error("Vui lòng nhập bài viết trước khi nộp để AI chấm.");
        }
        const firstKey = Object.keys(userResponses)[0] || (partData?.id as string | undefined);
        const submissionText = Object.values(userResponses).join("\n\n");

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

        // The AI API returns the established overallScore/maxOverallScore
        // contract.  Use the shared mapper so the score displayed, persisted,
        // and synced to the dashboard cannot diverge from the examiner result.
        record = createAttemptFromWritingResult({
          result: evalResult,
          mode: "practice",
          durationSeconds: 600 - (session?.remainingTimeSeconds || 600),
        });
        if (session?.sessionId) record.id = `practice_${session.sessionId}`;
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
            const allowedMimeTypes = ["audio/webm", "audio/mp4", "audio/wav", "audio/ogg", "audio/mpeg", "audio/x-m4a", "audio/aac"];
            if (!allowedMimeTypes.includes(detectedMime)) {
              throw new Error("Định dạng ghi âm không được hỗ trợ. Vui lòng thử lại bằng trình duyệt Chromium.");
            }
            mimeType = detectedMime as any;
            rawBase64 = match[2];
          } else {
            throw new Error("Bản ghi âm bị hỏng hoặc không đúng định dạng.");
          }
        }

        const durationAnswer = answers[`${audioAnswerKey}__duration`];
        const durationSeconds = typeof durationAnswer === "number" && Number.isFinite(durationAnswer)
          ? durationAnswer
          : undefined;

        const partNum = parseInt(partIdentifier.replace("part", ""), 10) || 1;

        // Resolve the same task whose recording was collected by the renderer.
        let dynamicTaskId: string = `${testId}_s${partNum}_q1`;
        if (partData) {
          if (isSpeakingBank && currentQuestion && typeof currentQuestion === "object" && currentQuestion.id) {
            dynamicTaskId = currentQuestion.id;
          } else if (partData.id) {
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
            testId: sessionTestId,
            practiceItemId: isSpeakingBank ? activePracticeItemId : undefined,
            partNumber: partNum,
            taskId: dynamicTaskId,
            audioBase64: rawBase64,
            mimeType,
            durationSeconds,
          }),
        });

        const json = await res.json();
        if (!json.success) throw new Error(json.error || "Speaking grading failed");

        gradingResultData = json.data;
        const evalResult = json.data;

        // Keep Speaking result persistence on the same API contract as the
        // displayed AI feedback.  In particular, the service never returns a
        // legacy `finalScore` field.
        record = createAttemptFromSpeakingResult({
          result: evalResult,
          mode: "practice",
          durationSeconds: 600 - (session?.remainingTimeSeconds || 600),
        });
      } else {
        throw new Error(`Unsupported skill: ${skill}`);
      }

      // Persist the exact result in the completed session before syncing to
      // the server.  This keeps refresh/reopen behavior idempotent.
      submitSession(record, gradingResultData);

      if (user?.id) {
        const progressResponse = await fetch("/api/user/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(record),
        });
        if (!progressResponse.ok) {
          throw new Error("Không thể lưu kết quả vào lịch sử. Vui lòng thử lại.");
        }
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
      submitInFlightRef.current = false;
    }
  };

  const handleTimerTick = React.useCallback((remainingSeconds: number) => {
    setTimeRemaining(remainingSeconds);
  }, [setTimeRemaining]);

  const handleTimeExpired = React.useCallback(() => {
    void handleSubmit();
  }, [handleSubmit]);

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
          initSession({
            testId: sessionTestId,
            practiceItemId: isSpeakingBank ? activePracticeItemId : undefined,
            mode: "practice",
            skill: skill as any,
            currentPartNumber: requestedPartNumber,
            remainingTimeSeconds: 600,
          });
        }}
      />
    );
  }

  // 5. Loading State
  if (isLoading || !partData) {
    if (!isLoading && errorMsg) {
      return (
        <div className="max-w-xl mx-auto py-20 text-center space-y-3">
          <AlertCircle className="h-8 w-8 mx-auto text-rose-400" />
          <h3 className="text-base font-bold text-white">Không tải được nội dung bài luyện</h3>
          <p className="text-xs text-slate-300">{errorMsg}</p>
          <button type="button" onClick={() => window.location.reload()} className="px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-bold">Thử lại</button>
        </div>
      );
    }
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
            {isSpeakingBank ? `Speaking Practice Bank${activePracticeItemId ? ` • ${activePracticeItemId}` : ""}` : `${formatTestDisplayName(testId)} • ${skill}`} • {partIdentifier}
          </Badge>
          <PracticeTimer
            initialSeconds={session?.remainingTimeSeconds ?? 600}
            deadlineAt={session?.deadlineAt}
            onTick={handleTimerTick}
            onTimeExpired={handleTimeExpired}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={isSubmitting || isAuthLoading || !isHydrated}
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

      {isSpeakingBank && partData?.availability === "source-limited" && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
          {partData?.sourceEvidence?.sourceRelationshipStatus === "NO_IMAGE_OR_UNRESOLVED_SOURCE_PLACEMENT"
            ? "Nguồn hiện không có embedded Image A/B cho topic này. Topic được giữ source-limited; không ghép ảnh khác topic và không dùng placeholder."
            : "Topic này có prompt nguồn nhưng asset hình chưa đủ/không materialize được. Không dùng placeholder; hãy chọn topic khác nếu cần luyện với hình."}
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
                onClick={() => moveToIndex(currentIndex - 1)}
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
                onClick={() => moveToIndex(currentIndex + 1)}
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
              onSelectIndex={moveToIndex}
            />
          </div>
        )}
      </div>
    </div>
  );
}
