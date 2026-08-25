"use client";

import * as React from "react";
import { BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import { RetrievedKnowledgeReference } from "@/lib/coach/types";

interface KnowledgeReferencesProps {
  references: RetrievedKnowledgeReference[];
}

export function KnowledgeReferences({ references }: KnowledgeReferencesProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  if (!references || references.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-[#1e1e26]">
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-label={isOpen ? "Ẩn tài liệu tham khảo" : "Xem tài liệu tham khảo"}
        className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-300 hover:text-emerald-300 transition-colors cursor-pointer select-none"
      >
        <BookOpen className="h-3.5 w-3.5 shrink-0" />
        <span>📚 Tài liệu tham khảo ({references.length})</span>
        {isOpen ? (
          <ChevronUp className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3" />
        )}
      </button>

      {/* Collapsed content */}
      {isOpen && (
        <div
          className="mt-2 space-y-2 animate-in fade-in-50 slide-in-from-top-1 duration-150"
          role="list"
          aria-label="Danh sách tài liệu tham khảo"
        >
          {references.map((ref) => (
            <div
              key={ref.id}
              role="listitem"
              className="rounded-xl border border-[#262632] bg-[#16161d] px-3.5 py-2.5"
            >
              {/* Topic */}
              <p className="text-[11px] font-bold text-emerald-300 leading-snug">
                {ref.topic}
              </p>

              {/* Summary */}
              <p className="mt-1 text-[11px] text-slate-300 leading-snug line-clamp-3">
                {ref.summary}
              </p>

              {/* Source attribution */}
              <p className="mt-1.5 text-[10px] font-medium text-slate-400 tracking-wide">
                Nguồn tham khảo: Giáo trình Edulife Aptis B2
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
