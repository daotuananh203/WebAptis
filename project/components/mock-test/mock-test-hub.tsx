"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Clock,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  BookA,
  BookOpen,
  Headphones,
  PenTool,
  Mic,
  Volume2,
  AlertCircle,
  Play,
  Sparkles,
} from "lucide-react";
import {
  createMockTestSession,
  loadActiveMockTestSession,
  clearActiveMockTestSession,
} from "@/lib/storage";
import { Badge } from "../ui/badge";

const ALL_MOCK_TESTS = Array.from({ length: 16 }, (_, i) => {
  const num = i + 1;
  const id = `aptis-b2-${num.toString().padStart(2, "0")}`;
  const hasAudio = num !== 16;
  return {
    testNum: num,
    testId: id,
    title: `Đề thi thử Aptis B2 — Đề ${num.toString().padStart(2, "0")}`,
    hasAudio,
    totalMinutes: 162,
    sectionsCount: 5,
  };
});

export function MockTestHub() {
  const router = useRouter();
  const [activeSession, setActiveSession] = React.useState<any>(null);

  React.useEffect(() => {
    const session = loadActiveMockTestSession();
    if (session && !session.isSubmitted) {
      setActiveSession(session);
    }
  }, []);

  const handleStartTest = (testId: string) => {
    clearActiveMockTestSession();
    const newSession = createMockTestSession(testId);
    router.push(`/mock-test/session/${newSession.testId}`);
  };

  const handleResume = () => {
    if (activeSession) {
      router.push(`/mock-test/session/${activeSession.testId}`);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Top Banner */}
      <div className="rounded-2xl border border-emerald-500/25 bg-gradient-to-r from-emerald-950/60 via-[#12161a] to-[#121215] p-6 sm:p-10 text-white shadow-lg shadow-emerald-950/20">
        <div className="max-w-2xl space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">
              MÔ PHỎNG THI THẬT 5 KỸ NĂNG (16 BỘ ĐỀ)
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Thi thử Full Mock Test Aptis ESOL B2
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Chọn một trong 16 bộ đề thi thử hoàn chỉnh chuẩn định dạng Aptis General B2. Mỗi đề thi bao gồm trọn vẹn 5 phần: Grammar & Vocabulary, Reading, Listening, Writing, Speaking với tổng thời gian 162 phút.
          </p>

          {/* Active Session Recovery Banner */}
          {activeSession && (
            <div className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-emerald-300">
                  Tìm thấy bài thi thử đang làm dở: {activeSession.testId.replace("aptis-b2-", "Đề ")}
                </p>
                <p className="text-[11px] text-slate-300">
                  Bạn có 1 bài thi đang thực hiện (Phần {activeSession.currentSectionIndex + 1} / 5).
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    clearActiveMockTestSession();
                    setActiveSession(null);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
                >
                  Hủy bài cũ
                </button>
                <button
                  onClick={handleResume}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-700 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  Tiếp tục làm bài
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 16 Full Mock Tests Selection Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white">
              Chọn Bộ Đề Thi Thử (Đề 01 → Đề 16)
            </h2>
            <p className="text-xs text-slate-300">
              16 Full Mock Tests chuẩn cấu trúc đề thi chính thức
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ALL_MOCK_TESTS.map((test) => (
            <div
              key={test.testId}
              className="rounded-2xl border border-[#22222a] bg-[#121215] hover:border-emerald-500/50 hover:bg-[#15151c] transition-all p-5 flex flex-col justify-between space-y-4 shadow-sm group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border border-emerald-500/30 text-emerald-300 bg-emerald-500/10">
                    Đề {test.testNum.toString().padStart(2, "0")}
                  </span>
                  {test.hasAudio ? (
                    <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-300 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                      <Volume2 className="h-2.5 w-2.5" /> MP3 Audio
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[9px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                      <AlertCircle className="h-2.5 w-2.5" /> No Audio
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                  {test.title}
                </h3>
                <p className="text-[11px] text-slate-300">
                  5 Kỹ năng • 162 phút thi liên tiếp
                </p>
              </div>

              <div className="pt-2 border-t border-[#1e1e26]">
                <button
                  onClick={() => handleStartTest(test.testId)}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>Bắt đầu thi thử</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5 Components Timeline Breakdown */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-white">
            Cấu trúc bài thi chính thức (Tổng: 162 phút)
          </h2>
          <span className="text-xs text-slate-300 font-medium">5 phần thi liên tiếp</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          <div className="rounded-2xl border border-[#22222a] bg-[#121215] p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase">PHẦN 1</span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-white/5 border border-white/10 text-slate-300">25 phút</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-400 font-bold">
                <BookA className="h-4 w-4" />
              </div>
              <h4 className="text-xs font-bold text-white leading-tight">Grammar & Vocab</h4>
            </div>
            <p className="text-[11px] text-slate-300">50 câu (25 ngữ pháp, 25 từ vựng)</p>
          </div>

          <div className="rounded-2xl border border-[#22222a] bg-[#121215] p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase">PHẦN 2</span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-white/5 border border-white/10 text-slate-300">35 phút</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-400 font-bold">
                <BookOpen className="h-4 w-4" />
              </div>
              <h4 className="text-xs font-bold text-white leading-tight">Reading</h4>
            </div>
            <p className="text-[11px] text-slate-300">4 phần (điền từ, sắp xếp, ý kiến, tiêu đề)</p>
          </div>

          <div className="rounded-2xl border border-[#22222a] bg-[#121215] p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase">PHẦN 3</span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-white/5 border border-white/10 text-slate-300">40 phút</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold">
                <Headphones className="h-4 w-4" />
              </div>
              <h4 className="text-xs font-bold text-white leading-tight">Listening</h4>
            </div>
            <p className="text-[11px] text-slate-300">4 phần nghe (tối đa 2 lần phát)</p>
          </div>

          <div className="rounded-2xl border border-[#22222a] bg-[#121215] p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase">PHẦN 4</span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300">50 phút</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 font-bold">
                <PenTool className="h-4 w-4" />
              </div>
              <h4 className="text-xs font-bold text-white leading-tight">Writing</h4>
            </div>
            <p className="text-[11px] text-slate-300">4 phần (form, câu ngắn, chat, email)</p>
          </div>

          <div className="rounded-2xl border border-[#22222a] bg-[#121215] p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase">PHẦN 5</span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-500/15 border border-rose-500/30 text-rose-300">12 phút</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 font-bold">
                <Mic className="h-4 w-4" />
              </div>
              <h4 className="text-xs font-bold text-white leading-tight">Speaking</h4>
            </div>
            <p className="text-[11px] text-slate-300">4 phần ghi âm (hỏi đáp, tả ảnh, so sánh, nói)</p>
          </div>
        </div>
      </div>

      {/* Exam Rules & Instructions Card */}
      <div className="rounded-2xl border border-[#22222a] bg-[#121215] p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-[#1e1e26] pb-3">
          <ShieldCheck className="h-5 w-5 text-emerald-300" />
          <h3 className="text-base font-bold text-white">Quy chế và hướng dẫn phòng thi</h3>
        </div>
        <div className="space-y-3 text-xs text-slate-300">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-300 shrink-0 mt-0.5" />
            <span><strong className="text-white">Thời gian riêng cho từng phần:</strong> Mỗi kỹ năng có đồng hồ đếm ngược độc lập. Khi hết giờ, bài làm sẽ tự động nộp và chuyển sang phần thi tiếp theo.</span>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-300 shrink-0 mt-0.5" />
            <span><strong className="text-white">Khóa phần thi đã qua:</strong> Sau khi hoàn thành hoặc chuyển phần, bạn không thể quay lại phần thi trước.</span>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-300 shrink-0 mt-0.5" />
            <span><strong className="text-white">Tự động lưu bài:</strong> Câu trả lời được lưu tự động liên tục trên trình duyệt. Nếu vô tình tải lại trang, bài làm vẫn được giữ nguyên.</span>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-300 shrink-0 mt-0.5" />
            <span><strong className="text-white">Báo cáo điểm chuẩn B2:</strong> Nhận kết quả chấm điểm chi tiết và nhận xét từ Cố vấn AI ngay sau khi hoàn thành 5 phần.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
