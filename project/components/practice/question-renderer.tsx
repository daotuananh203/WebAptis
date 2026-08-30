"use client";

import * as React from "react";
import {
  Mic,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  Volume2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { countWords } from "@/lib/grading/word-counter";
import { UserAnswerValue } from "@/lib/storage/types";
import { cn } from "@/lib/utils";
import { SpeakingImage } from "./speaking-image";

export interface QuestionRendererProps {
  skill: string;
  partIdentifier: string;
  partData: any;
  currentIndex: number;
  answers: Record<string, UserAnswerValue>;
  onAnswerChange: (questionId: string, value: UserAnswerValue) => void;
}

export function QuestionRenderer({
  skill,
  partIdentifier,
  partData,
  currentIndex,
  answers,
  onAnswerChange,
}: QuestionRendererProps) {
  // ----------------------------------------------------
  // 1. GRAMMAR MULTIPLE CHOICE
  // ----------------------------------------------------
  if (skill === "grammarVocabulary" && partIdentifier === "grammar") {
    const question = partData.questions[currentIndex];
    if (!question) return null;

    const currentAns = answers[question.id] as string | undefined;

    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-[#22222a] bg-[#121215] p-5 sm:p-6 shadow-sm">
          <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider block mb-2">
            Câu hỏi {currentIndex + 1} / {partData.questions.length}
          </span>
          <p className="text-base sm:text-lg font-bold text-white leading-relaxed">
            {question.sentence}
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Chọn đáp án đúng:
          </p>
          <div className="grid grid-cols-1 gap-2.5">
            {question.options.map((option: string, optIdx: number) => {
              const isSelected = currentAns === option;
              return (
                <button
                  key={optIdx}
                  onClick={() => onAnswerChange(question.id, option)}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-xl border text-sm font-medium text-left transition-all cursor-pointer",
                    isSelected
                      ? "border-emerald-500 bg-emerald-500/15 text-emerald-300 font-bold ring-1 ring-emerald-500/40 shadow-xs"
                      : "border-[#22222a] bg-[#16161d] text-slate-200 hover:border-slate-600 hover:bg-[#1a1a24]"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-lg text-xs font-bold shrink-0",
                        isSelected
                          ? "bg-emerald-700 text-white font-black"
                          : "bg-[#22222c] text-slate-300"
                      )}
                    >
                      {String.fromCharCode(65 + optIdx)}
                    </span>
                    <span>{option}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // 2. VOCABULARY SETS
  // ----------------------------------------------------
  if (skill === "grammarVocabulary" && partIdentifier === "vocabulary") {
    const set = partData.sets[currentIndex];
    if (!set) return null;

    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-[#22222a] bg-[#121215] p-5 sm:p-6 shadow-sm space-y-2">
          <span className="text-xs font-bold text-emerald-300 bg-emerald-500/10 px-2.5 py-0.5 rounded-md border border-emerald-500/20 inline-block">
            Nhóm {currentIndex + 1} / {partData.sets.length}: {set.title}
          </span>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{set.instructions}</p>
        </div>

        <div className="space-y-4">
          {set.items.map((item: any, itemIdx: number) => {
            const currentSelected = answers[item.id] as string | undefined;

            return (
              <div
                key={item.id}
                className="p-4 sm:p-5 rounded-2xl border border-[#22222a] bg-[#121215] space-y-3 shadow-2xs"
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold">
                    {itemIdx + 1}
                  </span>
                  <p className="text-sm font-bold text-white">{item.targetWordOrPrompt || item.prompt || item.word}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {set.options.map((opt: any) => {
                    const isSelected = currentSelected === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => onAnswerChange(item.id, opt.id)}
                        className={cn(
                          "p-3 rounded-xl border text-xs font-medium text-left transition-all cursor-pointer",
                          isSelected
                            ? "border-emerald-500 bg-emerald-500/15 text-emerald-300 font-bold ring-1 ring-emerald-500/40"
                            : "border-[#22222a] bg-[#16161d] text-slate-300 hover:border-slate-600 hover:bg-[#1a1a24]"
                        )}
                      >
                        {opt.text}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // 3. READING (PARTS 1–4)
  // ----------------------------------------------------
  if (skill === "reading") {
    // Reading Part 1: Sentence completion
    if (partIdentifier === "part1") {
      const p1 = partData;
      return (
        <div className="space-y-6">
          <div className="rounded-2xl border border-[#22222a] bg-[#121215] p-5 sm:p-6 space-y-3">
            <h3 className="font-bold text-emerald-300 text-xs uppercase tracking-wider">{p1.instructions}</h3>
            <p className="text-sm text-slate-200 leading-relaxed italic whitespace-pre-line bg-[#16161d] p-4 rounded-xl border border-[#22222a]">
              {p1.textWithGaps || p1.passageText}
            </p>
          </div>

          <div className="space-y-4">
            {p1.gaps.map((gap: any, gapIdx: number) => {
              const currentAns = answers[gap.id] as string | undefined;

              return (
                <div key={gap.id} className="p-4 sm:p-5 rounded-2xl border border-[#22222a] bg-[#121215] space-y-2.5">
                  <span className="text-xs font-bold text-emerald-300">Vị trí [{gap.gapIndex || gapIdx + 1}]</span>
                  <div className="flex flex-wrap gap-2">
                    {gap.options.map((opt: string) => {
                      const isSelected = currentAns === opt;
                      return (
                        <button
                          key={opt}
                          onClick={() => onAnswerChange(gap.id, opt)}
                          className={cn(
                            "px-4 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer",
                            isSelected
                              ? "border-emerald-500 bg-emerald-700 text-white font-bold shadow-md shadow-emerald-500/20"
                              : "border-[#22222a] bg-[#16161d] text-slate-300 hover:border-slate-600 hover:bg-[#1a1a24]"
                          )}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // Reading Part 2: Text cohesion (Sentence ordering)
    if (partIdentifier === "part2") {
      const p2 = partData;
      const stories = p2.stories || [p2.story];

      return (
        <div className="space-y-8">
          <div className="rounded-2xl border border-[#22222a] bg-[#121215] p-5">
            <h3 className="font-bold text-emerald-300 text-xs uppercase tracking-wider">{p2.instructions}</h3>
          </div>

          {stories.map((story: any, storyIdx: number) => {
            const defaultOrder = story.sentencesToOrder.map((s: any) => s.id);
            const currentOrder = (answers[story.id] as string[]) || defaultOrder;

            const handleMove = (index: number, direction: "up" | "down") => {
              const nextOrder = [...currentOrder];
              const targetIdx = direction === "up" ? index - 1 : index + 1;
              if (targetIdx < 0 || targetIdx >= nextOrder.length) return;

              const temp = nextOrder[index];
              nextOrder[index] = nextOrder[targetIdx];
              nextOrder[targetIdx] = temp;

              onAnswerChange(story.id, nextOrder);
            };

            return (
              <div key={story.id} className="space-y-4 rounded-2xl border border-[#22222a] bg-[#121215] p-5 sm:p-6">
                <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-xs text-emerald-300 font-medium">
                  <strong>Câu mở đầu {stories.length > 1 ? `(Đoạn ${storyIdx + 1})` : ""}:</strong> {story.anchorSentence}
                </div>

                <div className="space-y-2.5">
                  <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Sắp xếp các câu theo thứ tự hợp lý:
                  </p>
                  {currentOrder.map((sentenceId: string, idx: number) => {
                    const sentenceObj = story.sentencesToOrder.find((s: any) => s.id === sentenceId);
                    if (!sentenceObj) return null;

                    return (
                      <div
                        key={sentenceId}
                        className="flex items-center justify-between p-3.5 rounded-xl border border-[#262632] bg-[#16161d] gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#22222c] text-emerald-300 text-xs font-bold">
                            {idx + 2}
                          </span>
                          <span className="text-xs text-slate-200 leading-relaxed font-medium">
                            {sentenceObj.text}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 rounded-lg bg-[#20202a] hover:bg-[#282836] text-slate-300 active:scale-95"
                            disabled={idx === 0}
                            onClick={() => handleMove(idx, "up")}
                            title="Di chuyển lên"
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 rounded-lg bg-[#20202a] hover:bg-[#282836] text-slate-300 active:scale-95"
                            disabled={idx === currentOrder.length - 1}
                            onClick={() => handleMove(idx, "down")}
                            title="Di chuyển xuống"
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    // Reading Part 3: Opinion matching
    if (partIdentifier === "part3") {
      const p3 = partData;
      return (
        <div className="space-y-6">
          <div className="rounded-2xl border border-[#22222a] bg-[#121215] p-5 sm:p-6 space-y-3">
            <h3 className="font-bold text-emerald-300 text-xs uppercase tracking-wider">{p3.instructions}</h3>
            {p3.topic && <p className="text-xs font-semibold text-emerald-300 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">{p3.topic}</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {p3.people.map((person: any) => (
                <div key={person.id} className="p-3 bg-[#16161d] rounded-xl border border-[#22222a] text-xs">
                  <strong className="text-emerald-300 block mb-1">{person.name}</strong>
                  <p className="text-slate-300 leading-relaxed">{person.biographyText}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {p3.statements.map((stmt: any, stmtIdx: number) => {
              const currentAns = answers[stmt.id] as string | undefined;

              return (
                <div key={stmt.id} className="p-4 rounded-2xl border border-[#22222a] bg-[#121215] space-y-2.5">
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-bold text-slate-400">#{stmtIdx + 1}</span>
                    <p className="text-xs font-semibold text-white">{stmt.statement || stmt.text}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {p3.people.map((p: any) => {
                      const isSelected = currentAns === p.id;
                      return (
                        <button
                          key={p.id}
                          onClick={() => onAnswerChange(stmt.id, p.id)}
                          className={cn(
                            "px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer",
                            isSelected
                              ? "border-emerald-500 bg-emerald-700 text-white shadow-xs font-bold"
                              : "border-[#22222a] bg-[#16161d] text-slate-300 hover:border-slate-600 hover:bg-[#1a1a24]"
                          )}
                        >
                          {p.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // Reading Part 4: Matching Headings
    if (partIdentifier === "part4") {
      const p4 = partData;
      return (
        <div className="space-y-6">
          <div className="rounded-2xl border border-[#22222a] bg-[#121215] p-5 sm:p-6 space-y-2">
            <h3 className="font-bold text-emerald-300 text-xs uppercase tracking-wider">{p4.instructions}</h3>
            <h4 className="font-extrabold text-white text-base">{p4.textTitle || p4.passageTitle}</h4>
          </div>

          <div className="space-y-4">
            {p4.paragraphs.map((para: any) => {
              const currentAns = answers[para.id] as string | undefined;

              return (
                <div key={para.id} className="p-5 rounded-2xl border border-[#22222a] bg-[#121215] space-y-3 shadow-2xs">
                  <span className="text-xs font-bold text-emerald-300 block">
                    Đoạn văn {para.paragraphIndex}
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed italic bg-[#16161d] p-3.5 rounded-xl border border-[#22222a]">{para.text}</p>
                  <div className="pt-2 border-t border-[#1e1e26]">
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1.5">
                      Chọn tiêu đề phù hợp:
                    </label>
                    <select
                      value={currentAns || ""}
                      onChange={(e) => onAnswerChange(para.id, e.target.value)}
                      className="w-full text-xs font-medium border border-[#262632] rounded-xl p-2.5 bg-[#16161d] text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="" className="bg-[#121215]">-- Chọn tiêu đề --</option>
                      {p4.headings.map((h: any) => (
                        <option key={h.id} value={h.id} className="bg-[#121215]">
                          {h.headingText || h.text}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
  }

  // ----------------------------------------------------
  // 4. LISTENING (PARTS 1–4)
  // ----------------------------------------------------
  if (skill === "listening") {
    // Audio assets were historically served for one year as immutable while
    // retaining stable paths.  Keep a release token in the browser URL so a
    // corrected segment can never resolve to bytes from that stale cache.
    const listeningAudioVersion = "20260826-contract-v1";
    const versionAudioUrl = (url: string, audio?: any) => {
      if (!url) return url;
      const separator = url.includes("?") ? "&" : "?";
      const version = audio?.sha256?.slice(0, 16) || audio?.cacheVersion || listeningAudioVersion;
      return `${url}${separator}v=${version}`;
    };
    const handleAudioPlay = (e: React.SyntheticEvent<HTMLAudioElement>) => {
      const currentTarget = e.currentTarget;
      if (typeof document !== "undefined") {
        const allAudios = document.querySelectorAll("audio");
        allAudios.forEach((audio) => {
          if (audio !== currentTarget && !audio.paused) {
            audio.pause();
          }
        });
      }
    };

    const partNum =
      partData.partNumber ||
      (partIdentifier ? parseInt(partIdentifier.replace("part", ""), 10) : 1) ||
      1;
    const isPartVerified = partData.audio?.status === "VERIFIED";
    const isPartUncertain = partData.audio?.status === "UNCERTAIN";
    const audioUrl =
      partData.audio?.url ||
      partData.audioUrl ||
      (partData.tasks && partData.tasks[0]?.audio?.url) ||
      "";
    const browserAudioUrl = versionAudioUrl(audioUrl, partData.audio);
    const isMissingAudio = partData.audio?.status === "missing" || !audioUrl;
    const hasQuestionLevelAudio =
      partIdentifier === "part1" &&
      partData.tasks &&
      partData.tasks.some((t: any) => t.audio?.status === "VERIFIED");
    const hasUnverifiedTasks =
      partIdentifier === "part1" &&
      partData.tasks &&
      partData.tasks.some((t: any) => t.audio?.status !== "VERIFIED");

    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-[#22222a] bg-[#121215] p-5 sm:p-6 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border-emerald-500/20">
              Phần thi Nghe • Aptis ESOL B2
            </Badge>
            {!isMissingAudio && (
              hasQuestionLevelAudio && !hasUnverifiedTasks ? (
                <span className="text-[11px] text-emerald-300 font-medium flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                  <Volume2 className="h-3.5 w-3.5 text-emerald-300" />
                  Audio Part 1 đã tách theo từng câu
                </span>
              ) : isPartVerified ? (
                <span className="text-[11px] text-emerald-300 font-medium flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                  <Volume2 className="h-3.5 w-3.5 text-emerald-300" />
                  Audio Part {partNum} (Đã tách phân đoạn)
                </span>
              ) : (
                <span className="text-[11px] text-amber-400 font-medium flex items-center gap-1.5 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20">
                  <Volume2 className="h-3.5 w-3.5 text-amber-400" />
                  {hasQuestionLevelAudio ? "Một số câu chưa có audio được xác minh" : "Audio chưa tách Part — Tua đến phần cần nghe"}
                </span>
              )
            )}
          </div>
          <h3 className="font-bold text-white text-sm leading-relaxed">{partData.instructions}</h3>

          {/* Top Audio Player (Shown for Parts 2, 3, 4, or unsegmented Part 1) */}
          {!isMissingAudio ? (
            (!hasQuestionLevelAudio || partIdentifier !== "part1") && (
              <div className="rounded-xl border border-[#262632] bg-[#16161d] p-4 space-y-2.5 mt-3 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center gap-2 text-xs text-emerald-300 font-bold">
                    <Volume2 className="h-4 w-4 text-emerald-300 shrink-0" />
                    <span>
                      {isPartVerified
                        ? `Audio Listening — Part ${partNum} (${
                            partIdentifier === "part2"
                              ? "Nối ý kiến người nói • Speaker A–D"
                              : partIdentifier === "part3"
                              ? "Hội thoại thảo luận • 2 Người nói"
                              : "Bài thuyết trình độc thoại • Monologue 1 & 2"
                          })`
                        : hasQuestionLevelAudio
                        ? "Bản thu âm toàn bộ Part 1"
                        : isPartUncertain
                        ? "Audio Part này có block chưa đủ bằng chứng alignment"
                        : "Bản thu âm Listening — File audio toàn bộ bài thi"}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {isPartVerified
                      ? "Âm thanh trọn vẹn của phần này"
                      : isPartUncertain
                      ? "Đang giữ nguyên trạng thái UNCERTAIN để không xác nhận quá mức"
                      : "Bạn có thể phát và tua đến phần cần nghe"}
                  </span>
                </div>
                <audio
                  key={browserAudioUrl}
                  controls
                  onPlay={handleAudioPlay}
                  src={browserAudioUrl}
                  className="w-full h-10 rounded-lg"
                  preload="metadata"
                />
              </div>
            )
          ) : (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-300 text-xs flex items-start gap-3 mt-3">
              <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold mb-1 text-sm text-amber-200">Thông báo: Chưa có audio bản nghe cho đề thi này</strong>
                <span className="text-amber-300/80 leading-relaxed">
                  Kho đề gốc không có file âm thanh MP3 cho Đề 16. Bạn có thể đọc câu hỏi và các phương án bên dưới để làm bài trực tiếp.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* PART 1 */}
        {partIdentifier === "part1" && (
          <div className="space-y-4">
            {partData.tasks.map((task: any, taskIdx: number) => {
              const currentAns = answers[task.id] as string | undefined;
              const qNum = task.questionNumber || taskIdx + 1;
              const taskAudioUrl = task.audio?.url;
              const browserTaskAudioUrl = versionAudioUrl(taskAudioUrl || "", task.audio);
              const isTaskVerified = task.audio?.status === "VERIFIED";

              return (
                <div key={task.id} className="p-5 rounded-2xl border border-[#22222a] bg-[#121215] space-y-4 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-300 bg-emerald-500/10 px-2.5 py-0.5 rounded-md border border-emerald-500/20">
                      Câu hỏi {qNum}
                    </span>
                    {isTaskVerified ? (
                      <span className="text-[11px] text-emerald-300 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        Audio {qNum} • {task.audio.duration}s
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-medium bg-[#1a1a24] px-2 py-0.5 rounded border border-[#2a2a38]">
                        Audio chưa xác minh
                      </span>
                    )}
                  </div>

                  {/* Question-level Audio Player */}
                  {isTaskVerified && taskAudioUrl ? (
                    <div className="rounded-xl border border-emerald-500/25 bg-[#16161f] p-3 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-emerald-300">
                        <div className="flex items-center gap-1.5">
                          <Volume2 className="h-4 w-4 text-emerald-300" />
                          <span>Audio — Câu hỏi {qNum}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-normal">Bản nghe riêng cho câu hỏi này</span>
                      </div>
                      <audio
                        key={browserTaskAudioUrl}
                        controls
                        onPlay={handleAudioPlay}
                        src={browserTaskAudioUrl}
                        className="w-full h-9 rounded"
                        preload="none"
                      />
                    </div>
                  ) : hasQuestionLevelAudio && !isMissingAudio ? (
                    <div className="rounded-xl border border-[#262632] bg-[#16161d] p-3 text-xs text-slate-400 flex items-center gap-2">
                      <Volume2 className="h-4 w-4 text-amber-400/80 shrink-0" />
                      <span className="text-[11px] text-slate-300">
                        Audio nguồn của câu này chưa chứng minh đủ nội dung nên tạm thời không phát.
                      </span>
                    </div>
                  ) : null}

                  <p className="text-sm font-bold text-white leading-relaxed">{task.questionText}</p>
                  
                  <div className="space-y-2.5 pt-1">
                    {task.options.map((opt: string, optIdx: number) => {
                      const letter = String.fromCharCode(65 + optIdx);
                      const isSelected = currentAns === opt;
                      return (
                        <button
                          key={optIdx}
                          onClick={() => onAnswerChange(task.id, opt)}
                          className={cn(
                            "w-full p-3.5 rounded-xl border text-xs font-medium text-left transition-all cursor-pointer flex items-start gap-3",
                            isSelected
                              ? "border-emerald-500 bg-emerald-500/15 text-emerald-300 font-bold ring-1 ring-emerald-500/40"
                              : "border-[#22222a] bg-[#16161d] text-slate-300 hover:border-slate-600 hover:bg-[#1a1a24]"
                          )}
                        >
                          <span
                            className={cn(
                              "h-5 w-5 rounded-full border flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 transition-colors",
                              isSelected
                                ? "border-emerald-500 bg-emerald-700 text-white"
                                : "border-slate-600 text-slate-400 bg-[#121215]"
                            )}
                          >
                            {letter}
                          </span>
                          <span className="leading-relaxed">{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* PART 2 */}
        {partIdentifier === "part2" && (
          <div className="space-y-4">
            {partData.topic && (
              <div className="text-xs font-semibold text-emerald-300 bg-emerald-500/10 p-3.5 rounded-xl border border-emerald-500/20">
                <strong className="text-emerald-300">Chủ đề thảo luận:</strong> {partData.topic}
              </div>
            )}

            <div className="space-y-4">
              {partData.speakers.map((spk: any) => {
                const currentAns = answers[spk.id] as string | undefined;
                const spkAudioUrl = spk.audio?.url;
                const isSpkVerified = spk.audio?.status === "VERIFIED";

                return (
                  <div key={spk.id} className="p-5 rounded-2xl border border-[#22222a] bg-[#121215] space-y-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-300">{spk.speakerLabel}</span>
                      <span className="text-[10px] text-slate-400 font-medium bg-[#1a1a24] px-2 py-0.5 rounded border border-[#2a2a38]">
                        Nghe theo Audio Part 2
                      </span>
                    </div>

                    <div className="space-y-2">
                      {partData.statementOptions.map((opt: any) => {
                        const isSelected = currentAns === opt.id;
                        return (
                          <button
                            key={opt.id}
                            onClick={() => onAnswerChange(spk.id, opt.id)}
                            className={cn(
                              "w-full p-3 rounded-xl border text-xs font-medium text-left transition-all cursor-pointer",
                              isSelected
                                ? "border-emerald-500 bg-emerald-500/15 text-emerald-300 font-bold ring-1 ring-emerald-500/40"
                                : "border-[#22222a] bg-[#16161d] text-slate-300 hover:border-slate-600 hover:bg-[#1a1a24]"
                            )}
                          >
                            {opt.text}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* PART 3 */}
        {partIdentifier === "part3" && (
          <div className="space-y-4">
            {partData.topic && (
              <div className="text-xs font-semibold text-emerald-300 bg-emerald-500/10 p-3.5 rounded-xl border border-emerald-500/20">
                <strong className="text-emerald-300">Chủ đề:</strong> {partData.topic}
              </div>
            )}

            {partData.statements.map((stmt: any, idx: number) => {
              const currentAns = answers[stmt.id] as string | undefined;

              return (
                <div key={stmt.id} className="p-5 rounded-2xl border border-[#22222a] bg-[#121215] space-y-3.5">
                  <p className="text-xs sm:text-sm font-semibold text-white leading-relaxed">
                    {idx + 1}. {stmt.statementText}
                  </p>
                  <div className="flex flex-wrap gap-2.5">
                    {stmt.options.map((opt: string) => {
                      const isSelected = currentAns === opt;
                      return (
                        <button
                          key={opt}
                          onClick={() => onAnswerChange(stmt.id, opt)}
                          className={cn(
                            "px-5 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer",
                            isSelected
                              ? "border-emerald-500 bg-emerald-700 text-white font-bold shadow-xs"
                              : "border-[#22222a] bg-[#16161d] text-slate-300 hover:border-slate-600 hover:bg-[#1a1a24]"
                          )}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* PART 4 */}
        {partIdentifier === "part4" && (
          <div className="space-y-6">
            {partData.monologues.map((mono: any, monoIdx: number) => {
              const monoAudioUrl = mono.audio?.url;
              const isMonoVerified = mono.audio?.status === "VERIFIED";

              return (
                <div key={mono.id} className="space-y-5 rounded-2xl border border-[#22222a] bg-[#121215] p-5 sm:p-6 shadow-2xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-xs font-bold text-emerald-300 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20 inline-block">
                      Bài nói {monoIdx + 1}: {mono.topic}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium bg-[#1a1a24] px-2 py-0.5 rounded border border-[#2a2a38]">
                      Nghe theo Audio Part 4
                    </span>
                  </div>

                  <div className="space-y-5">
                    {mono.questions.map((q: any) => {
                      const currentAns = answers[q.id] as string | undefined;

                      return (
                        <div key={q.id} className="p-4 sm:p-5 rounded-xl border border-[#262632] bg-[#16161d] space-y-3.5">
                          <p className="text-xs sm:text-sm font-semibold text-white leading-relaxed">{q.questionText}</p>
                          <div className="space-y-2.5">
                            {q.options.map((opt: string, optIdx: number) => {
                              const letter = String.fromCharCode(65 + optIdx);
                              const isSelected = currentAns === opt;
                              return (
                                <button
                                  key={optIdx}
                                  onClick={() => onAnswerChange(q.id, opt)}
                                  className={cn(
                                    "w-full p-3.5 rounded-xl border text-xs font-medium text-left transition-all cursor-pointer flex items-start gap-3",
                                    isSelected
                                      ? "border-emerald-500 bg-emerald-500/15 text-emerald-300 font-bold ring-1 ring-emerald-500/40"
                                      : "border-[#22222a] bg-[#121215] text-slate-300 hover:border-slate-600 hover:bg-[#181820]"
                                  )}
                                >
                                  <span
                                    className={cn(
                                      "h-5 w-5 rounded-full border flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5",
                                      isSelected
                                        ? "border-emerald-500 bg-emerald-700 text-white"
                                        : "border-slate-600 text-slate-400 bg-[#16161d]"
                                    )}
                                  >
                                    {letter}
                                  </span>
                                  <span className="leading-relaxed">{opt}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ----------------------------------------------------
  // 5. WRITING (PARTS 1–4)
  // ----------------------------------------------------
  if (skill === "writing") {
    // Part 1: Fill in a form (5 short questions)
    if (partIdentifier === "part1") {
      const promptList = partData.prompts || partData.questions || [];

      return (
        <div className="space-y-6">
          <div className="rounded-2xl border border-[#22222a] bg-[#121215] p-5 sm:p-6 space-y-2">
            <h3 className="font-bold text-white text-sm">{partData.instructions}</h3>
            {partData.clubContext && (
              <p className="text-xs text-slate-400">Câu lạc bộ: {partData.clubContext}</p>
            )}
            <p className="text-xs text-slate-300">Điền từ 1-5 từ cho mỗi câu trả lời ngắn.</p>
          </div>

          <div className="space-y-4">
            {promptList.map((q: any, idx: number) => {
              const qId = q.id || `w1_prompt_${idx + 1}`;
              const currentVal = (answers[qId] as string) || "";
              const qNum = q.questionNumber || idx + 1;
              const qText = q.question || q.prompt || "";

              return (
                <div key={qId} className="p-5 rounded-2xl border border-[#22222a] bg-[#121215] space-y-2.5 shadow-2xs">
                  <label className="text-xs font-bold text-slate-200 block">
                    {qNum}. {qText}
                  </label>
                  <input
                    type="text"
                    value={currentVal}
                    onChange={(e) => onAnswerChange(qId, e.target.value)}
                    placeholder="Nhập câu trả lời (1–5 từ)..."
                    className="w-full text-xs font-medium border border-[#262632] rounded-xl p-3 bg-[#16161d] text-white focus:outline-none focus:border-emerald-500 placeholder:text-slate-400"
                  />
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // Part 2: Short text (20–30 words)
    if (partIdentifier === "part2") {
      const part2Key = partData.id || "writing_part2";
      const textVal = (answers[part2Key] as string) || "";
      const wc = countWords(textVal);
      const minW = partData.wordGuidance?.projectValidationRule?.min ?? 20;
      const maxW = partData.wordGuidance?.projectValidationRule?.max ?? 30;
      const isWithin = wc >= minW && wc <= maxW;

      return (
        <div className="space-y-6">
          <div className="rounded-2xl border border-[#22222a] bg-[#121215] p-5 sm:p-6 space-y-2">
            <h3 className="font-bold text-white text-sm">{partData.instructions}</h3>
            {partData.clubContext && (
              <p className="text-xs text-slate-400">Câu lạc bộ: {partData.clubContext}</p>
            )}
          </div>

          <div className="p-5 sm:p-6 rounded-2xl border border-[#22222a] bg-[#121215] space-y-3.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-300">Đề bài:</span>
              <span
                className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded-md border",
                  isWithin
                    ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                    : "bg-[#1e1e26] text-slate-300 border-[#2a2a36]"
                )}
              >
                {wc} từ (Mục tiêu: {partData.wordGuidance?.officialGuidance || "20-30 words"})
              </span>
            </div>

            <p className="text-xs font-medium text-slate-300">{partData.prompt}</p>

            <textarea
              rows={5}
              value={textVal}
              onChange={(e) => onAnswerChange(part2Key, e.target.value)}
              placeholder="Viết câu trả lời của bạn tại đây..."
              className="w-full text-xs font-medium border border-[#262632] rounded-xl p-3.5 bg-[#16161d] text-white focus:outline-none focus:border-emerald-500 leading-relaxed placeholder:text-slate-400"
            />
          </div>
        </div>
      );
    }

    // Part 3: Social room responses (3 questions, 30–40 words each)
    if (partIdentifier === "part3") {
      return (
        <div className="space-y-6">
          <div className="rounded-2xl border border-[#22222a] bg-[#121215] p-5 sm:p-6 space-y-2">
            <h3 className="font-bold text-white text-sm">{partData.instructions}</h3>
            <p className="text-xs text-slate-400">Câu lạc bộ: {partData.clubContext}</p>
          </div>

          <div className="space-y-6">
            {partData.chatMessages.map((msg: any) => {
              const textVal = (answers[msg.id] as string) || "";
              const wc = countWords(textVal);
              const minW = msg.wordGuidance.projectValidationRule.min;
              const maxW = msg.wordGuidance.projectValidationRule.max;
              const isWithin = wc >= minW && wc <= maxW;

              return (
                <div key={msg.id} className="p-5 sm:p-6 rounded-2xl border border-[#22222a] bg-[#121215] space-y-3.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-[10px] font-bold">
                        {msg.senderName[0]}
                      </div>
                      <span className="text-xs font-bold text-white">{msg.senderName}</span>
                    </div>
                    <span
                      className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-md border",
                        isWithin
                          ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                          : "bg-[#1e1e26] text-slate-300 border-[#2a2a36]"
                      )}
                    >
                      {wc} từ (Mục tiêu: {msg.wordGuidance.officialGuidance})
                    </span>
                  </div>

                  <p className="text-xs font-medium text-slate-300 italic">"{msg.messageText}"</p>

                  <textarea
                    rows={4}
                    value={textVal}
                    onChange={(e) => onAnswerChange(msg.id, e.target.value)}
                    placeholder={`Phản hồi tin nhắn của ${msg.senderName}...`}
                    className="w-full text-xs font-medium border border-[#262632] rounded-xl p-3.5 bg-[#16161d] text-white focus:outline-none focus:border-emerald-500 leading-relaxed placeholder:text-slate-400"
                  />
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // Part 4: Two emails (Informal & Formal)
    if (partIdentifier === "part4") {
      return (
        <div className="space-y-6">
          <div className="rounded-2xl border border-[#22222a] bg-[#121215] p-5 sm:p-6 space-y-2">
            <h3 className="font-bold text-white text-sm">{partData.instructions}</h3>
            <div className="p-3.5 bg-[#16161d] rounded-xl border border-[#262632] text-xs text-slate-300 italic">
              <strong className="text-emerald-300">Thông báo:</strong> {partData.managerNotice}
            </div>
          </div>

          <div className="space-y-6">
            {partData.tasks.map((task: any) => {
              const textVal = (answers[task.id] as string) || "";
              const wc = countWords(textVal);
              const minW = task.wordGuidance.projectValidationRule.min;
              const maxW = task.wordGuidance.projectValidationRule.max;
              const isWithin = wc >= minW && wc <= maxW;

              return (
                <div key={task.id} className="p-5 sm:p-6 rounded-2xl border border-[#22222a] bg-[#121215] space-y-3.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">
                      {task.taskType === "informal-email" ? "Phần 4A: Email thân mật" : "Phần 4B: Email trang trọng"}
                    </span>
                    <span
                      className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-md border",
                        isWithin
                          ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                          : "bg-[#1e1e26] text-slate-300 border-[#2a2a36]"
                      )}
                    >
                      {wc} từ (Mục tiêu: {task.wordGuidance.officialGuidance})
                    </span>
                  </div>

                  <p className="text-xs font-medium text-slate-300">{task.prompt}</p>

                  <textarea
                    rows={task.taskType === "informal-email" ? 4 : 8}
                    value={textVal}
                    onChange={(e) => onAnswerChange(task.id, e.target.value)}
                    placeholder={`Soạn email ${task.taskType === "informal-email" ? "thân mật" : "trang trọng"} của bạn tại đây...`}
                    className="w-full text-xs font-medium border border-[#262632] rounded-xl p-3.5 bg-[#16161d] text-white focus:outline-none focus:border-emerald-500 leading-relaxed placeholder:text-slate-400"
                  />
                </div>
              );
            })}
          </div>
        </div>
      );
    }
  }

  // ----------------------------------------------------
  // 6. SPEAKING (PARTS 1–4) WITH REAL BROWSER MEDIARECORDER
  // ----------------------------------------------------
  if (skill === "speaking") {
    return (
      <SpeakingPracticeContainer
        partData={partData}
        partIdentifier={partIdentifier}
        currentIndex={currentIndex}
        answers={answers}
        onAnswerChange={onAnswerChange}
      />
    );
  }

  return <div className="text-xs text-slate-300">Đang chuẩn bị câu hỏi...</div>;
}

// ----------------------------------------------------
// SPEAKING PRACTICE CONTAINER & MEDIA RECORDER
// ----------------------------------------------------
function SpeakingPracticeContainer({
  partData,
  partIdentifier,
  currentIndex,
  answers,
  onAnswerChange,
}: {
  partData: any;
  partIdentifier: string;
  currentIndex: number;
  answers: Record<string, UserAnswerValue>;
  onAnswerChange: (questionId: string, value: UserAnswerValue) => void;
}) {
  const [isRecording, setIsRecording] = React.useState(false);
  const [recordingSeconds, setRecordingSeconds] = React.useState(0);
  const [audioBlobUrl, setAudioBlobUrl] = React.useState<string | null>(null);
  const [micError, setMicError] = React.useState<string | null>(null);

  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);
  const recordingStartedAtRef = React.useRef<number | null>(null);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  const currentQuestion = Array.isArray(partData.questions) ? partData.questions[currentIndex] : null;
  const audioAnswerKey =
    currentQuestion && typeof currentQuestion === "object" && currentQuestion.id
      ? `${currentQuestion.id}__speaking_audio`
      : "speaking_audio";
  const currentAudio = (answers[audioAnswerKey] as string) || "";
  const displayedAudioKeyRef = React.useRef(audioAnswerKey);

  // Moving to another Speaking prompt must not retain the previous prompt's
  // object URL in the recorder controls.  The saved recording remains under
  // its own answer key; only the browser preview is reset for the new prompt.
  React.useEffect(() => {
    if (displayedAudioKeyRef.current === audioAnswerKey) return;
    if (audioBlobUrl) URL.revokeObjectURL(audioBlobUrl);
    displayedAudioKeyRef.current = audioAnswerKey;
    setAudioBlobUrl(null);
    setRecordingSeconds(0);
    setMicError(null);
  }, [audioAnswerKey, audioBlobUrl]);

  const startRecording = async () => {
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const preferredMimeTypes = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"];
      const supportedMimeType = typeof MediaRecorder.isTypeSupported === "function"
        ? preferredMimeTypes.find((mime) => MediaRecorder.isTypeSupported(mime))
        : undefined;
      const mediaRecorder = supportedMimeType
        ? new MediaRecorder(stream, { mimeType: supportedMimeType })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      recordingStartedAtRef.current = Date.now();

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const elapsedSeconds = recordingStartedAtRef.current
          ? Math.max(0, (Date.now() - recordingStartedAtRef.current) / 1000)
          : recordingSeconds;
        recordingStartedAtRef.current = null;
        const recorderMimeType = (mediaRecorder.mimeType || "audio/webm").split(";", 1)[0];
        const audioBlob = new Blob(audioChunksRef.current, { type: recorderMimeType });
        const url = URL.createObjectURL(audioBlob);
        setAudioBlobUrl(url);

        // Convert to base64 for storage
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64data = reader.result as string;
          onAnswerChange(audioAnswerKey, base64data);
        };
        onAnswerChange(`${audioAnswerKey}__duration`, elapsedSeconds);

        // Stop all audio tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(200);
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error("Microphone access error:", err);
      setMicError(
        "Không thể truy cập Microphone. Vui lòng cấp quyền truy cập micro trong trình duyệt để thực hiện bài nói."
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const resetRecording = () => {
    if (audioBlobUrl) {
      URL.revokeObjectURL(audioBlobUrl);
    }
    setAudioBlobUrl(null);
    setRecordingSeconds(0);
    onAnswerChange(audioAnswerKey, "");
  };

  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioBlobUrl) URL.revokeObjectURL(audioBlobUrl);
    };
  }, [audioBlobUrl]);

  return (
    <div className="space-y-6">
      {/* Header & Instructions */}
      <div className="rounded-2xl border border-[#22222a] bg-[#121215] p-5 sm:p-6 space-y-3">
        <Badge variant="secondary" className="text-[10px] font-bold bg-rose-500/10 text-rose-400 border-rose-500/20">
          Phần thi Nói (Speaking)
        </Badge>
        <h3 className="font-bold text-white text-sm leading-relaxed">{partData.instructions}</h3>
      </div>

      {/* Speaking Topic Header (if available) */}
      {partData.topic && (
        <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/10 flex items-center gap-2.5">
          <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">Chủ đề:</span>
          <span className="text-sm font-extrabold text-white">{partData.topic}</span>
        </div>
      )}

      {/* Speaking Images Rendering for Part 2 & Part 3 */}
      {(() => {
        let singleImage: string | null = null;
        let dualImages: { img1: string; img2?: string; alt1?: string; alt2?: string } | null = null;

        if (typeof partData.images === "object" && partData.images !== null && !Array.isArray(partData.images)) {
          if (partData.images.image1Url || partData.images.image2Url) {
            dualImages = {
              img1: partData.images.image1Url,
              img2: partData.images.image2Url,
              alt1: partData.images.image1Alt || "Ảnh 1",
              alt2: partData.images.image2Alt || "Ảnh 2",
            };
          }
        } else if (Array.isArray(partData.images) && partData.images.length > 0) {
          if (partData.images.length >= 2) {
            dualImages = {
              img1: partData.images[0],
              img2: partData.images[1],
              alt1: "Ảnh so sánh 1",
              alt2: "Ảnh so sánh 2",
            };
          } else {
            singleImage = partData.images[0];
          }
        }

        if (!dualImages && !singleImage && partData.imageUrl) {
          singleImage = partData.imageUrl;
        }

        if (dualImages) {
          return (
            <div className="space-y-3">
              <span className="text-xs font-bold text-rose-400 block uppercase tracking-wider">
                Hình ảnh đề bài (So sánh 2 ảnh):
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dualImages.img1 && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-slate-400 block">
                      Ảnh 1: {dualImages.alt1}
                    </span>
                    <div className="relative rounded-2xl overflow-hidden border border-[#262632] bg-[#16161d] min-h-[220px] flex items-center justify-center">
                      <SpeakingImage
                        src={dualImages.img1}
                        alt={dualImages.alt1 || "Hình ảnh 1"}
                        label="Ảnh 1"
                      />
                    </div>
                  </div>
                )}
                {dualImages.img2 && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-slate-400 block">
                      Ảnh 2: {dualImages.alt2}
                    </span>
                    <div className="relative rounded-2xl overflow-hidden border border-[#262632] bg-[#16161d] min-h-[220px] flex items-center justify-center">
                      <SpeakingImage
                        src={dualImages.img2}
                        alt={dualImages.alt2 || "Hình ảnh 2"}
                        label="Ảnh 2"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        }

        if (singleImage) {
          return (
            <div className="space-y-3">
              <span className="text-xs font-bold text-rose-400 block uppercase tracking-wider">
                Hình ảnh đề bài (Miêu tả ảnh):
              </span>
              <div className="relative rounded-2xl overflow-hidden border border-[#262632] bg-[#16161d] max-h-[380px] flex items-center justify-center p-2">
                <SpeakingImage
                  src={singleImage}
                  alt={partData.imageAlt || "Hình ảnh bài thi nói"}
                  label="Ảnh Part 2"
                />
              </div>
            </div>
          );
        }

        return null;
      })()}

      {/* Speaking Prompts Render */}
      {(() => {
        const questionList = partData.questions || partData.tasks || partData.prompts || [];
        if (!Array.isArray(questionList) || questionList.length === 0) return null;
        return (
          <div className="p-5 sm:p-6 rounded-2xl border border-[#22222a] bg-[#121215] space-y-3">
            <span className="text-xs font-bold text-rose-400 block uppercase tracking-wider">
              Nội dung câu hỏi:
            </span>
            <div className="space-y-2.5">
              {questionList.map((q: any, idx: number) => {
                const qText = typeof q === "string" ? q : q.prompt || q.questionText || q.question || "";
                const isCurrentPrompt = currentQuestion ? idx === currentIndex : true;
                return (
                  <p
                    key={idx}
                    className={cn(
                      "text-xs sm:text-sm font-semibold leading-relaxed rounded-lg px-2 py-1.5",
                      isCurrentPrompt ? "bg-rose-500/10 text-white ring-1 ring-rose-500/25" : "text-slate-300"
                    )}
                  >
                    {idx + 1}. {qText}
                  </p>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Real Audio Recording Interface */}
      <div className="rounded-2xl border border-[#22222a] bg-[#121215] p-6 sm:p-8 flex flex-col items-center justify-center space-y-5 text-center shadow-xs">
        <div
          className={cn(
            "flex h-16 w-16 items-center justify-center rounded-2xl border transition-all",
            isRecording
              ? "bg-rose-500/20 border-rose-500 text-rose-400 animate-pulse shadow-lg shadow-rose-500/30"
              : currentAudio || audioBlobUrl
              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/10 border-rose-500/20 text-rose-400"
          )}
        >
          <Mic className="h-8 w-8" />
        </div>

        <div className="space-y-1">
          <h4 className="text-sm sm:text-base font-bold text-white">
            {isRecording
              ? `Đang ghi âm... (${Math.floor(recordingSeconds / 60)}:${(recordingSeconds % 60).toString().padStart(2, "0")})`
              : currentAudio || audioBlobUrl
              ? "Đã hoàn thành bản ghi âm"
              : "Ghi âm câu trả lời trực tiếp"}
          </h4>
          <p className="text-xs text-slate-300 max-w-sm">
            {isRecording
              ? "Nói rõ ràng vào microphone của bạn để hoàn thành bài thi."
              : "Nhấn nút bên dưới để bắt đầu ghi âm câu trả lời từ microphone của bạn."}
          </p>
        </div>

        {micError && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-rose-300 text-xs flex items-center gap-2 max-w-md">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            <span>{micError}</span>
          </div>
        )}

        {/* Audio Player for review */}
        {(audioBlobUrl || (currentAudio && currentAudio.startsWith("data:audio"))) && (
          <div className="w-full max-w-md p-3 rounded-xl bg-[#16161d] border border-[#262632]">
            <audio controls src={audioBlobUrl || currentAudio} className="w-full h-9 rounded" />
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {!isRecording && !currentAudio && !audioBlobUrl && (
            <button
              onClick={startRecording}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/25 transition-all cursor-pointer"
            >
              <Mic className="h-4 w-4" />
              <span>Bắt đầu ghi âm</span>
            </button>
          )}

          {isRecording && (
            <button
              onClick={stopRecording}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs shadow-md transition-all cursor-pointer animate-pulse"
            >
              <div className="h-3 w-3 rounded-sm bg-rose-400" />
              <span>Dừng ghi âm</span>
            </button>
          )}

          {(currentAudio || audioBlobUrl) && !isRecording && (
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                ✓ Bản ghi đã sẵn sàng
              </span>
              <button
                onClick={resetRecording}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white text-xs font-semibold cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" /> Ghi âm lại
              </button>
            </div>
          )}
        </div>

        {/* Transparent AI Evaluation Boundary Status */}
        <div className="pt-2 text-[11px] text-slate-400 bg-[#16161d] px-3 py-1.5 rounded-lg border border-[#262632]">
          Trạng thái: Bản ghi âm được lưu trên trình duyệt và sẽ được gửi tới AI Speaking Examiner khi bạn nộp bài.
        </div>
      </div>
    </div>
  );
}

