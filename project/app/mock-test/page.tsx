"use client";

import { AppShell } from "@/components/layout/app-shell";
import { MockTestHub } from "@/components/mock-test/mock-test-hub";

export default function MockTestPage() {
  return (
    <AppShell
      breadcrumbs={[{ label: "Thi thử Mock Test", href: "/mock-test" }]}
      headerTitle="Thi thử Mock Test"
      headerDescription="Làm bài thi thử 5 kỹ năng theo định dạng Aptis ESOL General B2 chuẩn 16 bộ đề."
    >
      <MockTestHub />
    </AppShell>
  );
}
