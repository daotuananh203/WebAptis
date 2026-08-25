"use client";

import * as React from "react";
import { Sparkles, User, RotateCcw } from "lucide-react";
import { RecommendationChip } from "./recommendation-chip";
import { KnowledgeReferences } from "./knowledge-references";
import { StudyRecommendation } from "@/lib/recommendations/types";
import { RetrievedKnowledgeReference } from "@/lib/coach/types";

export interface ChatMessageData {
  id: string;
  sender: "user" | "coach";
  text: string;
  timestamp: string;
  relatedRecommendation?: StudyRecommendation | null;
  actionSuggestions?: string[];
  retrievedKnowledge?: RetrievedKnowledgeReference[];
  isError?: boolean;
}

export interface ChatMessageProps {
  message: ChatMessageData;
  onRetry?: () => void;
  onSelectSuggestion?: (suggestion: string) => void;
}

export function ChatMessage({
  message,
  onRetry,
  onSelectSuggestion,
}: ChatMessageProps) {
  const isUser = message.sender === "user";

  return (
    <div
      className={`flex items-start gap-3 w-full animate-in fade-in-50 duration-200 ${
        isUser ? "flex-row-reverse" : "flex-row"
      }`}
    >
      {/* Avatar */}
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
          isUser
            ? "bg-emerald-700 text-white shadow-xs"
            : "bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-400 text-white shadow-md shadow-emerald-500/20"
        }`}
      >
        {isUser ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
      </div>

      {/* Bubble Container */}
      <div
        className={`flex flex-col max-w-[85%] sm:max-w-[75%] space-y-1.5 ${
          isUser ? "items-end" : "items-start"
        }`}
      >
        {/* Author Label & Timestamp */}
        <div className="flex items-center gap-2 px-1 text-[11px] text-slate-300">
          <span className="font-bold text-white">
            {isUser ? "Bạn" : "Cố vấn AI Lexi"}
          </span>
          <span>{message.timestamp}</span>
        </div>

        {/* Message Bubble */}
        <div
          className={`rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed ${
            isUser
              ? "bg-emerald-700 text-white font-medium rounded-tr-xs shadow-sm"
              : message.isError
              ? "bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-tl-xs"
              : "bg-[#16161d] border border-[#262632] text-slate-100 rounded-tl-xs shadow-sm"
          }`}
        >
          <p className="whitespace-pre-wrap">{message.text}</p>
        </div>

        {/* Knowledge References */}
        {message.retrievedKnowledge && message.retrievedKnowledge.length > 0 && (
          <div className="w-full mt-1">
            <KnowledgeReferences references={message.retrievedKnowledge} />
          </div>
        )}

        {/* Related Recommendation Card */}
        {message.relatedRecommendation && (
          <div className="w-full mt-1">
            <RecommendationChip recommendation={message.relatedRecommendation} />
          </div>
        )}

        {/* Action Suggestion Chips */}
        {message.actionSuggestions && message.actionSuggestions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {message.actionSuggestions.map((sug, idx) => (
              <button
                key={idx}
                onClick={() => onSelectSuggestion?.(sug)}
                className="text-[11px] font-medium px-2.5 py-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all cursor-pointer text-left"
              >
                💡 {sug}
              </button>
            ))}
          </div>
        )}

        {/* Error Retry Option */}
        {message.isError && onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 font-semibold mt-1 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Thử lại</span>
          </button>
        )}
      </div>
    </div>
  );
}
