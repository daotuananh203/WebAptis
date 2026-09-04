"use client";

import * as React from "react";
import { Loader2, Trash2, Sparkles } from "lucide-react";
import { ChatMessage, ChatMessageData } from "./chat-message";
import { ChatInput } from "./chat-input";
import { QuickPrompts } from "./quick-prompts";
import { CoachEmptyState } from "./coach-empty-state";
import { loadProgressHistory } from "@/lib/storage";
import { prepareAICoachContext } from "@/lib/recommendations";
import { AICoachContext } from "@/lib/recommendations/types";
import { useAuth } from "@/lib/hooks/use-auth";

class CoachRequestError extends Error {
  constructor(public readonly code: unknown) {
    super("AI Coach request failed");
    this.name = "CoachRequestError";
  }
}

function coachUserErrorMessage(code: unknown): string {
  if (code === "INVALID_REQUEST") {
    return "Yêu cầu chưa hợp lệ. Vui lòng kiểm tra lại nội dung và thử lại.";
  }
  if (code === "AI_PROVIDER_TIMEOUT") {
    return "Cố vấn AI phản hồi quá lâu. Vui lòng thử lại sau.";
  }
  if (code === "AI_PROVIDER_ERROR") {
    return "Cố vấn AI đang gặp sự cố tạm thời. Vui lòng thử lại sau.";
  }
  return "Xin lỗi, đã xảy ra lỗi khi kết nối tới Cố vấn AI. Vui lòng thử lại sau.";
}

export function CoachShell() {
  const { user } = useAuth();
  const [context, setContext] = React.useState<AICoachContext>(() =>
    prepareAICoachContext([])
  );
  const [messages, setMessages] = React.useState<ChatMessageData[]>([]);
  const [inputValue, setInputValue] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // 1. Initialize AICoachContext from client storage on mount
  React.useEffect(() => {
    try {
      const history = loadProgressHistory(user?.id);
      const prepared = prepareAICoachContext(history);
      setContext(prepared);
    } catch {
      // Fallback already in place
    }
  }, [user?.id]);

  // 2. Auto-scroll on new messages
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // 3. Send message handler (Unified for both suggested questions and free-form input)
  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText ?? inputValue).trim();
    if (!textToSend || isLoading) return;

    const userMsgId = `usr_${Date.now()}`;
    const userMsg: ChatMessageData = {
      id: userMsgId,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/coach/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userMessage: textToSend,
          coachContext: context,
          history: messages.filter((m) => !m.isError).slice(-6).map((m) => ({
            role: m.sender === "user" ? "user" : "model",
            content: m.text,
          })),
        }),
      });

      const json = await res.json();
      if (!json.success) {
        throw new CoachRequestError(json.code);
      }

      const coachResponse = json.data;
      const coachMsg: ChatMessageData = {
        id: `coach_${Date.now()}`,
        sender: "coach",
        text: coachResponse.message,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        relatedRecommendation: coachResponse.relatedRecommendation,
        actionSuggestions: coachResponse.actionSuggestions || [],
        retrievedKnowledge: coachResponse.retrievedKnowledge,
      };

      setMessages((prev) => [...prev, coachMsg]);
    } catch (err) {
      const errMsg: ChatMessageData = {
        id: `err_${Date.now()}`,
        sender: "coach",
        text: err instanceof CoachRequestError
          ? coachUserErrorMessage(err.code)
          : "Xin lỗi, đã xảy ra lỗi khi kết nối tới Cố vấn AI. Vui lòng thử lại sau.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isError: true,
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] max-w-4xl mx-auto rounded-2xl border border-[#22222a] bg-[#121215] shadow-lg overflow-hidden">
      {/* 1. Coach Header Bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-[#1e1e26] bg-[#101014]/90 backdrop-blur-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-400 text-white shadow-sm shadow-emerald-500/30">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white leading-none">
                Lexi — Giảng Viên AI Aptis B2
              </h2>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">
                Online
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-none mt-1">
              Tra cứu tri thức Edulife & giải đáp chiến thuật toàn diện 5 kỹ năng
            </p>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            onClick={handleClearHistory}
            className="flex items-center gap-1 text-xs text-slate-300 hover:text-rose-400 p-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            title="Xóa hội thoại"
          >
            <Trash2 className="h-4 w-4" />
            <span className="hidden sm:inline">Làm mới</span>
          </button>
        )}
      </div>

      {/* 2. Message History Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.length === 0 ? (
          <CoachEmptyState context={context} />
        ) : (
          messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              message={msg}
              onRetry={() => handleSendMessage(msg.text)}
              onSelectSuggestion={(sug) => handleSendMessage(sug)}
            />
          ))
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-center gap-3 w-full animate-in fade-in duration-200">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white shadow-xs">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-[#16161d] border border-[#262632] text-xs text-slate-300">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-300" />
              <span>Lexi đang tra cứu Knowledge Brain và soạn câu trả lời...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 3. Quick Suggestion Prompts (Examples, NOT a whitelist) */}
      <QuickPrompts
        onSelectPrompt={(prompt) => handleSendMessage(prompt)}
        disabled={isLoading}
      />

      {/* 4. Chat Input Box (Free-form input always enabled) */}
      <ChatInput
        value={inputValue}
        onChange={setInputValue}
        onSend={() => handleSendMessage()}
        isLoading={isLoading}
        disabled={isLoading}
      />
    </div>
  );
}
