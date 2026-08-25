"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Menu,
  Bell,
  LayoutGrid,
  ChevronDown,
  LogOut,
  Sparkles,
  User,
} from "lucide-react";
import { useAuth } from "@/lib/hooks/use-auth";

export interface TopBarProps {
  onToggleSidebar?: () => void;
}

export function TopBar({ onToggleSidebar }: TopBarProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = React.useState(false);

  const displayName = user?.name || "dao tuan anh";
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
    } catch {
      router.push("/login");
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full h-16 bg-[#101014]/95 backdrop-blur-md border-b border-[#1e1e26] px-4 sm:px-6 flex items-center justify-between">
      {/* Left section: App Brand & Indicators */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Toggle Hamburger Button */}
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Brand Logo */}
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white font-black text-base shadow-sm shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            A
          </div>
          <div className="hidden xs:block sm:block">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-white text-sm tracking-wide">
                APTIS
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">
                B2
              </span>
            </div>
            <span className="text-[11px] text-slate-300 font-medium leading-tight block">
              Nền tảng học tập
            </span>
          </div>
        </Link>

        {/* 4 Colored Status Dots */}
        <div className="hidden sm:flex items-center gap-1.5 ml-2 pl-3 border-l border-[#1e1e26]">
          <span
            title="Kỹ năng Nghe (Listening)"
            className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-xs shadow-emerald-500/50"
          />
          <span
            title="Kỹ năng Đọc (Reading)"
            className="h-2.5 w-2.5 rounded-full bg-lime-400 shadow-xs shadow-lime-400/50"
          />
          <span
            title="Kỹ năng Viết (Writing)"
            className="h-2.5 w-2.5 rounded-full bg-orange-500 shadow-xs shadow-orange-500/50"
          />
          <span
            title="Kỹ năng Nói & G&V (Speaking & Grammar)"
            className="h-2.5 w-2.5 rounded-full bg-purple-500 shadow-xs shadow-purple-500/50"
          />
        </div>

        {/* Notification Bell */}
        <button
          title="Thông báo mới"
          className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-emerald-500" />
        </button>
      </div>

      {/* Right section: App Grid & User Profile */}
      <div className="flex items-center gap-3">
        <Link
          href="/practice"
          title="Thư viện bài tập"
          className="hidden sm:flex p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
        >
          <LayoutGrid className="h-4 w-4" />
        </Link>

        {/* User Block */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2.5 p-1.5 pl-2 rounded-xl border border-[#22222c] bg-[#141419] hover:border-emerald-500/40 hover:bg-[#181820] transition-all cursor-pointer"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-teal-600 to-emerald-700 text-white text-xs font-bold shadow-xs">
              {initials || <User className="h-3.5 w-3.5" />}
            </div>
            <div className="text-left hidden sm:block">
              <span className="text-xs font-bold text-white block leading-tight max-w-[120px] truncate">
                {displayName}
              </span>
              <span className="text-[10px] text-slate-300 block leading-none">
                Student
              </span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 mr-1" />
          </button>

          {/* User Dropdown Menu */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 rounded-xl border border-[#242430] bg-[#141419] p-1.5 shadow-xl shadow-black/50 z-50 animate-in fade-in-50 zoom-in-95">
              <div className="px-3 py-2 border-b border-[#22222a] mb-1">
                <p className="text-xs font-bold text-white truncate">{displayName}</p>
                <p className="text-[10px] text-slate-300 truncate">{user?.email || "student@aptis.edu.vn"}</p>
              </div>

              <Link
                href="/coach"
                onClick={() => setShowUserMenu(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                <Sparkles className="h-3.5 w-3.5 text-emerald-300" />
                <span>Cố vấn AI Lexi</span>
              </Link>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Đăng xuất</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
