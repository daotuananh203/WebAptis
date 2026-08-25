import { Suspense } from "react";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-[#0d0d0f] flex items-center justify-center p-4">
      <Suspense fallback={<div className="text-xs text-slate-300">Đang tải...</div>}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
