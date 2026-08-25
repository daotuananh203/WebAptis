"use client";

import * as React from "react";
import Link from "next/link";
import { Lock, ArrowRight, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type PracticeBadgeType = "ĐỀ XUẤT" | "BÀI TEST" | "MẸO" | "TÙY CHỌN" | string;

export interface PracticeModeCardProps {
  badge: PracticeBadgeType;
  tag: string;
  icon: LucideIcon;
  title: string;
  description: string;
  locked?: boolean;
  href?: string;
  buttonLabel?: string;
  onSelect?: () => void;
}

export function PracticeModeCard({
  badge,
  tag,
  icon: Icon,
  title,
  description,
  locked = false,
  href,
  buttonLabel,
  onSelect,
}: PracticeModeCardProps) {
  const isRecommended = badge === "ĐỀ XUẤT";

  const getBadgeStyle = (b: PracticeBadgeType) => {
    switch (b) {
      case "ĐỀ XUẤT":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
      case "BÀI TEST":
        return "bg-white/10 text-slate-300 border-white/10";
      case "MẸO":
        return "bg-orange-500/15 text-orange-400 border-orange-500/30";
      case "TÙY CHỌN":
        return "bg-purple-500/15 text-purple-400 border-purple-500/30";
      default:
        return "bg-white/10 text-slate-300 border-white/10";
    }
  };

  const defaultBtnLabel = isRecommended
    ? "Đi tới bài test →"
    : "Bắt đầu làm bài →";

  const finalBtnLabel = buttonLabel || defaultBtnLabel;


  return (
    <div
      className={cn(
        "rounded-2xl p-5 sm:p-6 flex flex-col justify-between space-y-4 transition-all duration-200",
        isRecommended
          ? "bg-gradient-to-b from-[#14181f] to-[#121215] border-2 border-emerald-500/40 shadow-md shadow-emerald-950/30"
          : "bg-[#121215] border border-[#22222a] hover:border-slate-700"
      )}
    >
      {/* Card Header: Tag & Badge */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-xl border",
              isRecommended
                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                : "bg-white/5 border-white/10 text-slate-400"
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
          <span className="text-[10px] font-bold text-slate-300 tracking-wider uppercase">
            {tag}
          </span>
        </div>

        <span
          className={cn(
            "text-[10px] font-extrabold px-2 py-0.5 rounded-full border",
            getBadgeStyle(badge)
          )}
        >
          {badge}
        </span>
      </div>

      {/* Body: Title & Description */}
      <div className="space-y-1.5 flex-1">
        <h3 className="text-sm sm:text-base font-bold text-white leading-tight">
          {title}
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          {description}
        </p>
      </div>

      {/* Footer CTA */}
      <div className="pt-2 border-t border-[#1e1e26]">
        {locked ? (
          <button
            disabled
            className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#1a1a22] border border-[#262632] text-slate-400 text-xs font-bold cursor-not-allowed opacity-75"
          >
            <Lock className="h-3.5 w-3.5" />
            <span>{finalBtnLabel}</span>
          </button>
        ) : onSelect ? (
          <button
            onClick={onSelect}
            className={cn(
              "w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
              isRecommended
                ? "bg-emerald-700 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20"
                : "bg-[#1c1c24] hover:bg-[#252530] border border-[#2a2a36] text-white"
            )}
          >
            <span>{finalBtnLabel}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        ) : href ? (
          <Link
            href={href}
            className={cn(
              "w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
              isRecommended
                ? "bg-emerald-700 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20"
                : "bg-[#1c1c24] hover:bg-[#252530] border border-[#2a2a36] text-white"
            )}
          >
            <span>{finalBtnLabel}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        ) : null}
      </div>
    </div>
  );
}
