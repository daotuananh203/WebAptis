"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log sanitized error details without leaking sensitive user payload
    console.error("[WebAptis Global Error Boundary]:", error.message);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0d0d0f] text-slate-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full p-6 sm:p-8 rounded-2xl bg-[#141419] border border-[#262632] shadow-2xl text-center space-y-6">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400">
          <AlertTriangle className="h-7 w-7" />
        </div>

        <div className="space-y-2">
          <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">
            Đã xảy ra sự cố kỹ thuật
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Hệ thống đã ghi nhận lỗi và đang được xử lý. Bạn có thể thử tải lại trang hoặc quay về trang chủ.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-700/20 transition-all cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Thử lại</span>
          </button>
          <Link
            href="/dashboard"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#1e1e26] hover:bg-[#282834] text-slate-200 font-bold text-xs border border-[#333342] transition-all"
          >
            <Home className="h-4 w-4" />
            <span>Về bảng điều khiển</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
