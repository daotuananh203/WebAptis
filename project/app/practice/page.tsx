"use client";

import { Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PracticeHub } from "@/components/practice/practice-hub";

export default function PracticePage() {
  return (
    <AppShell
      breadcrumbs={[{ label: "Luyện tập Aptis", href: "/practice" }]}
      headerTitle="Luyện từng phần"
      headerDescription="Chọn kỹ năng hoặc phần thi để luyện tập với hệ thống 272 bài luyện và chấm điểm tức thì."
    >
      <Suspense fallback={<div className="py-12 text-center text-xs text-slate-300">Đang tải thư viện bài tập...</div>}>
        <PracticeHub />
      </Suspense>
    </AppShell>
  );
}
