"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, BookOpen, GraduationCap, Sparkles } from "lucide-react";

export const MOBILE_NAV_ITEMS = [
  { label: "Tổng quan", href: "/dashboard", icon: LayoutDashboard },
  { label: "Luyện tập", href: "/practice", icon: BookOpen },
  { label: "Thi thử", href: "/mock-test", icon: GraduationCap },
  { label: "AI Coach", href: "/coach", icon: Sparkles },
];

export function MobileNav() {
  const pathname = usePathname();

  // Don't show bottom nav inside active mock test exam room to maximize focus
  const isInsideExamRoom = pathname.startsWith("/mock-test/session/");
  if (isInsideExamRoom) return null;

  return (
    <nav
      aria-label="Điều hướng chính di động"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-[#1e1e26] bg-[#101014]/95 backdrop-blur-lg px-1 pb-[env(safe-area-inset-bottom,0px)] shadow-lg"
    >
      <div className="flex w-full items-center justify-around h-16 max-w-lg mx-auto">
        {MOBILE_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1 py-1.5 h-full transition-all active:scale-95 touch-manipulation",
                isActive
                  ? "text-emerald-300 font-bold"
                  : "text-slate-300 hover:text-white"
              )}
            >
              <div
                className={cn(
                  "flex items-center justify-center h-8 w-12 rounded-xl transition-colors",
                  isActive ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "text-slate-400"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
              </div>
              <span className="text-[10px] tracking-tight leading-none text-center truncate px-0.5">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
