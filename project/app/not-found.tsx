import Link from "next/link";
import { HelpCircle, Home, BookOpen } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0d0d0f] text-slate-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full p-6 sm:p-8 rounded-2xl bg-[#141419] border border-[#262632] shadow-2xl text-center space-y-6">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
          <HelpCircle className="h-7 w-7" />
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-black tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
            404 NOT FOUND
          </span>
          <h2 className="text-lg sm:text-xl font-black tracking-tight text-white mt-2">
            Không tìm thấy trang yêu cầu
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Đường dẫn bài thi hoặc tính năng bạn tìm kiếm không tồn tại hoặc đã được chuyển sang vị trí mới.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-700/20 transition-all"
          >
            <Home className="h-4 w-4" />
            <span>Về bảng điều khiển</span>
          </Link>
          <Link
            href="/practice"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#1e1e26] hover:bg-[#282834] text-slate-200 font-bold text-xs border border-[#333342] transition-all"
          >
            <BookOpen className="h-4 w-4" />
            <span>Luyện thi Aptis</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
