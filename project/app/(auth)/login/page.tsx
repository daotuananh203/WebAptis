import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#0d0d0f] flex items-center justify-center p-4">
      <Suspense fallback={<div className="text-xs text-slate-300">Đang tải...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
