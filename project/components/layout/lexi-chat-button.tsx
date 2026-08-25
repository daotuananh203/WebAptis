"use client";

import * as React from "react";
import Link from "next/link";
import { Sparkles, Bot, X } from "lucide-react";

export function LexiChatButton() {
  const [isVisible, setIsVisible] = React.useState(true);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        title="Mở Cố vấn AI Lexi"
        className="fixed bottom-6 right-6 z-50 p-3 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-lg shadow-emerald-500/25 hover:scale-105 transition-transform cursor-pointer"
      >
        <Bot className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 group animate-in fade-in slide-in-from-bottom-4">
      {/* Floating Lexi CTA Card */}
      <Link
        href="/coach"
        className="flex items-center gap-3 pl-3.5 pr-4 py-2.5 rounded-2xl bg-[#141419] border border-[#242430] hover:border-emerald-500/50 shadow-xl shadow-black/60 transition-all hover:scale-[1.02] cursor-pointer"
      >
        {/* Robot Avatar */}
        <div className="relative">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-400 text-white shadow-md shadow-emerald-500/30">
            <Bot className="h-5 w-5" />
          </div>
          {/* EN Badge */}
          <span className="absolute -bottom-1 -right-1 px-1 py-0.2 rounded bg-[#0d0d0f] border border-emerald-500/40 text-[9px] font-black text-emerald-300">
            EN
          </span>
        </div>

        {/* Text info */}
        <div className="text-left">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-extrabold text-white">Lexi</span>
            <span className="flex items-center gap-0.5 text-[9px] font-bold text-emerald-300 bg-emerald-500/10 px-1.5 py-0.2 rounded-full border border-emerald-500/20">
              <Sparkles className="h-2.5 w-2.5" /> AI Coach
            </span>
          </div>
          <span className="text-[11px] text-slate-300 font-medium block">
            Hỏi đáp & Chiến thuật
          </span>
        </div>
      </Link>

      {/* Close button */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsVisible(false);
        }}
        title="Thu gọn"
        className="h-7 w-7 rounded-full bg-[#141419] border border-[#22222a] text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
