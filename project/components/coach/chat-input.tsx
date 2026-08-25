"use client";

import * as React from "react";
import { Send, Loader2 } from "lucide-react";

export interface ChatInputProps {
  value: string;
  onChange: (val: string) => void;
  onSend: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function ChatInput({
  value,
  onChange,
  onSend,
  isLoading = false,
  disabled = false,
}: ChatInputProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !isLoading && !disabled) {
        onSend();
      }
    }
  };

  const charCount = value.length;
  const isOverLimit = charCount > 1000;
  const canSend = value.trim().length > 0 && !isOverLimit && !isLoading && !disabled;

  return (
    <div className="border-t border-[#1e1e26] bg-[#121215] p-3 sm:p-4 rounded-b-2xl">
      <div className="relative flex items-end gap-2 bg-[#16161d] border border-[#262632] rounded-xl p-2 focus-within:border-emerald-500/60 focus-within:ring-1 focus-within:ring-emerald-500/20 transition-all">
        <textarea
          ref={textareaRef}
          rows={2}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || isLoading}
          placeholder="Hỏi Cố vấn AI về bài làm, ngữ pháp, từ vựng hay chiến thuật..."
          className="flex-1 max-h-32 resize-none bg-transparent text-xs sm:text-sm text-white placeholder:text-slate-400 focus:outline-none p-1.5 leading-relaxed"
        />

        <div className="flex flex-col items-end gap-1 shrink-0">
          <button
            onClick={onSend}
            disabled={!canSend}
            className="flex items-center gap-1.5 h-9 px-3.5 font-bold shadow-md bg-emerald-700 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs rounded-xl transition-all cursor-pointer"
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <>
                <Send className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Gửi</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between px-1 pt-1.5 text-[11px] text-slate-300">
        <span>
          Nhấn <kbd className="font-mono bg-[#1c1c24] px-1.5 py-0.5 rounded text-slate-300 border border-[#2a2a36]">Enter</kbd> để gửi, <kbd className="font-mono bg-[#1c1c24] px-1.5 py-0.5 rounded text-slate-300 border border-[#2a2a36]">Shift + Enter</kbd> xuống dòng
        </span>
        <span className={isOverLimit ? "text-rose-400 font-bold" : ""}>
          {charCount}/1000
        </span>
      </div>
    </div>
  );
}
