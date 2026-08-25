import * as React from "react";
import Link from "next/link";
import { Sparkles, MessageSquare, ArrowRight } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";

export function AICoachBanner() {
  return (
    <Card className="border-indigo-200 bg-gradient-to-r from-indigo-900 via-blue-900 to-slate-900 text-white shadow-sm overflow-hidden relative">
      <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 h-48 w-48 rounded-full bg-blue-500/20 blur-2xl pointer-events-none" />
      <CardContent className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-1.5 text-indigo-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="h-4 w-4 text-indigo-400" />
            <span>CỐ VẤN HỌC TẬP AI</span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
            Bạn cần tư vấn chiến thuật làm bài hay giải đáp thắc mắc?
          </h3>
          <p className="text-xs text-indigo-100/80 leading-relaxed">
            Trò chuyện trực tiếp với Cố vấn AI để nhận lời khuyên ôn tập, mẹo phân bổ thời gian và giải thích chi tiết điểm yếu của bạn.
          </p>
        </div>

        <Link href="/coach" className="shrink-0">
          <Button
            variant="default"
            size="sm"
            className="bg-white text-indigo-950 hover:bg-indigo-50 font-bold gap-2 shadow-md text-xs"
          >
            <MessageSquare className="h-4 w-4 text-indigo-600" />
            <span>Nhắn tin với Cố vấn AI</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
