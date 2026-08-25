"use client";

import Link from "next/link";
import { Flame, BookOpen, LogOut, User as UserIcon } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { useAuth } from "@/lib/hooks/use-auth";

export interface HeaderProps {
  title?: string;
  description?: string;
  currentStreak?: number;
  isActiveToday?: boolean;
}

export function Header({
  title = "Tổng quan",
  description = "Theo dõi tiến độ luyện thi và kế hoạch học tập.",
  currentStreak = 0,
  isActiveToday = false,
}: HeaderProps) {
  const { user, logout } = useAuth();

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/80 px-4 sm:px-6 backdrop-blur-md">
      <div className="flex flex-col">
        <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
          {title}
        </h1>
        {description && (
          <p className="text-xs text-slate-400 hidden sm:block">
            {description}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Daily Streak Pill */}
        <div className="flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 sm:px-3 py-1 border border-amber-200/80 text-amber-900 text-xs font-semibold shadow-xs">
          <Flame
            className={`h-4 w-4 ${
              isActiveToday ? "text-amber-500 fill-amber-500 animate-pulse" : "text-amber-400"
            }`}
          />
          <span className="hidden sm:inline">{currentStreak} ngày liên tục</span>
          <span className="sm:hidden">{currentStreak} ngày</span>
          {isActiveToday && (
            <Badge variant="success" className="text-[9px] px-1 py-0 ml-1">
              ĐÃ HỌC
            </Badge>
          )}
        </div>

        {/* Quick Practice Link */}
        <Link href="/practice" className="hidden sm:inline-flex">
          <Button size="sm" variant="outline" className="gap-1.5 shadow-xs font-medium text-xs">
            <BookOpen className="h-3.5 w-3.5" />
            <span>Luyện tập</span>
          </Button>
        </Link>

        {/* User Account State */}
        {user ? (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div
              title={`${user.name} (${user.email})`}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-xs shadow-xs"
            >
              {getInitials(user.name)}
            </div>
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-900 leading-none truncate max-w-[120px]">
                {user.name}
              </span>
              <span className="text-[10px] text-slate-400 leading-none mt-0.5 truncate max-w-[120px]">
                {user.email}
              </span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={logout}
              title="Đăng xuất"
              className="text-xs text-slate-400 hover:text-red-600 p-1.5 h-8 w-8"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <Link href="/login">
              <Button size="sm" variant="ghost" className="text-xs font-semibold">
                Đăng nhập
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="text-xs font-semibold shadow-xs">
                Đăng ký
              </Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
