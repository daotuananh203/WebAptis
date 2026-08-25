"use client";

import { AppShell } from "@/components/layout/app-shell";
import { CoachShell } from "@/components/coach/coach-shell";

export default function CoachPage() {
  return (
    <AppShell
      breadcrumbs={[{ label: "Cố vấn AI Lexi", href: "/coach" }]}
      headerTitle="Cố vấn AI Lexi"
      headerDescription="Hỏi đáp chiến thuật phòng thi, giải thích ngữ pháp và nhận gợi ý bài luyện cá nhân hóa theo 16 bộ đề."
    >
      <CoachShell />
    </AppShell>
  );
}
