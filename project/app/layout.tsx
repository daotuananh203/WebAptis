import type { Metadata } from "next";
import "./globals.css";
import { AuthProviderWrapper } from "@/components/providers/auth-provider-wrapper";

export const metadata: Metadata = {
  title: "WebAptis B2 — Nền tảng luyện thi Aptis ESOL B2",
  description: "Luyện thi Aptis General B2 chuẩn 5 kỹ năng theo kho tài liệu Edulife",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="dark">
      <body className="min-h-screen antialiased bg-[#0d0d0f] text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-200">
        <AuthProviderWrapper>{children}</AuthProviderWrapper>
      </body>
    </html>
  );
}
