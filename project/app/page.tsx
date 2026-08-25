import Link from "next/link";
import {
  Sparkles,
  BookOpen,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Flame,
  GraduationCap,
  Layers,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0d0d0f] text-slate-100 flex flex-col selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Top Navigation */}
      <header className="border-b border-[#1e1e26] bg-[#101014]/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white font-black text-base shadow-sm shadow-emerald-500/20">
              A
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-white text-sm tracking-wide">
                  APTIS
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">
                  B2
                </span>
              </div>
              <span className="text-[11px] text-slate-300 font-medium leading-none block">
                Nền tảng học tập
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <span>Vào bảng điều khiển</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-20 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-bold text-emerald-300 shadow-2xs mb-6">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Luyện thi thông minh chuẩn CEFR B2 — 16 Bộ đề Edulife</span>
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight max-w-4xl leading-[1.15]">
          Chinh phục kỳ thi <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
            Aptis ESOL General B2
          </span>
        </h1>

        <p className="mt-5 max-w-2xl text-xs sm:text-sm text-slate-300 leading-relaxed">
          Nền tảng luyện thi toàn diện 5 kỹ năng với 16 bộ đề chuẩn Edulife, 272 bài luyện chi tiết theo từng Part, hệ thống chấm điểm tự động và Cố vấn AI Lexi.
        </p>

        {/* Primary CTAs */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 h-12 rounded-xl bg-emerald-700 hover:bg-emerald-700 text-white text-sm font-bold shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
          >
            <span>Bắt đầu luyện tập ngay</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/practice"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 h-12 rounded-xl bg-[#141419] hover:bg-[#1a1a22] border border-[#262632] text-white text-sm font-semibold transition-colors cursor-pointer"
          >
            <BookOpen className="h-4 w-4 text-emerald-300" />
            <span>Thư viện 272 bài luyện</span>
          </Link>
        </div>

        {/* Value Prop Features */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left w-full">
          <div className="rounded-2xl border border-[#22222a] bg-[#121215] p-5 space-y-2 shadow-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-sm text-white">5 kỹ năng toàn diện</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Đầy đủ Grammar & Vocabulary, Reading, Listening, Writing và Speaking.
            </p>
          </div>

          <div className="rounded-2xl border border-[#22222a] bg-[#121215] p-5 space-y-2 shadow-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 font-bold">
              <Sparkles className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-sm text-white">Đánh giá Viết & Nói AI</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Nhận xét chi tiết từ ngữ, ngữ pháp, độ mạch lạc và cách phát âm theo chuẩn B2.
            </p>
          </div>

          <div className="rounded-2xl border border-[#22222a] bg-[#121215] p-5 space-y-2 shadow-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 font-bold">
              <Flame className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-sm text-white">Chuỗi ngày học & Heatmap</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Theo dõi sự chăm chỉ với bản đồ hoạt động 12 tuần và chuỗi ngày rèn luyện liên tục.
            </p>
          </div>

          <div className="rounded-2xl border border-[#22222a] bg-[#121215] p-5 space-y-2 shadow-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-400 font-bold">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-sm text-white">16 Full Mock Tests</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Mô phỏng thi thật 162 phút với audio Listening thật và đồng hồ từng phần độc lập.
            </p>
          </div>
        </div>

        {/* Disclaimer Footer */}
        <div className="mt-16 pt-8 border-t border-[#1e1e26] w-full text-center text-xs text-slate-400">
          <p>
            WebAptis B2 là nền tảng luyện thi độc lập. Điểm số ước tính không phải là chứng chỉ chính thức của Hội đồng Anh (British Council).
          </p>
        </div>
      </main>
    </div>
  );
}
