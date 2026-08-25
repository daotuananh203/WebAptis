"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  GraduationCap,
  Headphones,
  BookOpen,
  PenTool,
  Mic,
  BookA,
  Layers,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface NavItemDef {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  badge?: string;
  badgeVariant?: "teal" | "orange" | "purple" | "gray";
}

export const OVERVIEW_MENU_ITEMS: NavItemDef[] = [
  { label: "Trang chủ", href: "/dashboard", icon: LayoutDashboard },
];

export const PRACTICE_MENU_ITEMS: NavItemDef[] = [
  { label: "Thi thử tổng", href: "/mock-test", icon: GraduationCap },
  { label: "Reading", href: "/practice?skill=reading", icon: BookOpen },
  { label: "Listening", href: "/practice?skill=listening", icon: Headphones },
  { label: "Writing", href: "/practice?skill=writing", icon: PenTool },
  { label: "Speaking", href: "/practice?skill=speaking", icon: Mic },
  { label: "Grammar & Vocabulary", href: "/practice?skill=grammarVocabulary", icon: BookA },
  { label: "Luyện theo Part", href: "/practice", icon: Layers },
];

export const PERSONAL_MENU_ITEMS: NavItemDef[] = [
  { label: "Lịch sử làm bài", href: "/dashboard#history", icon: History },
];

export interface SidebarProps {
  isOpen?: boolean;
  isCollapsed?: boolean;
  onClose?: () => void;
}

function SidebarNavContent({
  isCollapsed = false,
  onClose,
}: {
  isCollapsed?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSkill = searchParams.get("skill");

  const isItemActive = (href: string) => {
    if (href.includes("?skill=")) {
      const targetSkill = href.split("?skill=")[1];
      return pathname === "/practice" && currentSkill === targetSkill;
    }
    if (href === "/practice") {
      return pathname === "/practice" && !currentSkill;
    }
    if (href === "/dashboard#history") {
      return pathname === "/dashboard";
    }
    return pathname === href;
  };

  const renderNavGroup = (
    title: string,
    items: NavItemDef[],
    showDivider = true
  ) => {
    return (
      <div className="space-y-1">
        {showDivider && isCollapsed ? (
          <div className="h-px bg-[#1e1e26] my-2 mx-1" />
        ) : (
          !isCollapsed && (
            <p className="px-3 text-[10px] font-extrabold tracking-widest text-slate-400 uppercase mb-2">
              {title}
            </p>
          )
        )}
        <div className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            const active = isItemActive(item.href);

            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={onClose}
                title={isCollapsed ? item.label : undefined}
                className={cn(
                  "flex items-center rounded-xl text-xs font-medium transition-all group relative",
                  isCollapsed
                    ? "justify-center p-2.5"
                    : "justify-between px-3 py-2",
                  active
                    ? "bg-emerald-500/15 text-emerald-300 font-bold border-l-2 border-emerald-400 shadow-xs"
                    : "text-slate-300 hover:text-white hover:bg-white/5"
                )}
              >
                <div
                  className={cn(
                    "flex items-center",
                    isCollapsed ? "justify-center" : "gap-3"
                  )}
                >
                  <Icon
                    className={cn(
                      "shrink-0 transition-colors",
                      isCollapsed ? "h-5 w-5" : "h-3.5 w-3.5",
                      active
                        ? "text-emerald-300"
                        : "text-slate-400 group-hover:text-slate-300"
                    )}
                  />
                  {!isCollapsed && <span>{item.label}</span>}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div
      className={cn(
        "flex-1 overflow-y-auto",
        isCollapsed ? "px-2 py-4 space-y-3" : "px-3 py-4 space-y-6"
      )}
    >
      {/* SECTION 1: TỔNG QUAN */}
      {renderNavGroup("TỔNG QUAN", OVERVIEW_MENU_ITEMS, false)}

      {/* SECTION 2: LUYỆN THI */}
      {renderNavGroup("LUYỆN THI", PRACTICE_MENU_ITEMS, true)}

      {/* SECTION 3: CÁ NHÂN */}
      {renderNavGroup("CÁ NHÂN", PERSONAL_MENU_ITEMS, true)}
    </div>
  );
}

export function Sidebar({
  isOpen = false,
  isCollapsed = false,
  onClose,
}: SidebarProps) {
  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed top-16 bottom-0 left-0 z-40 bg-[#101014] border-r border-[#1e1e26] flex flex-col transition-all duration-200 ease-in-out",
          // Mobile visibility
          isOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0",
          // Desktop width
          isCollapsed ? "md:w-16" : "md:w-64"
        )}
      >
        <React.Suspense fallback={<div className="flex-1 px-3 py-4" />}>
          <SidebarNavContent isCollapsed={isCollapsed} onClose={onClose} />
        </React.Suspense>

        {/* Sidebar Footer: Target Band Badge */}
        <div
          className={cn(
            "border-t border-[#1e1e26] bg-[#0d0d0f]/60",
            isCollapsed ? "p-2" : "p-3"
          )}
        >
          {isCollapsed ? (
            <div
              title="Mục tiêu: Aptis General B2"
              className="h-8 w-full rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-black flex items-center justify-center cursor-default"
            >
              B2
            </div>
          ) : (
            <div className="rounded-xl bg-[#141419] p-3 border border-[#22222a] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 block uppercase">
                  Mục tiêu
                </span>
                <span className="text-xs font-extrabold text-white">
                  Aptis General B2
                </span>
              </div>
              <div className="h-6 px-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-black flex items-center justify-center">
                B2 CEFR
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
