"use client";

import * as React from "react";
import { AuthProvider } from "@/lib/auth/auth-context";

export function AuthProviderWrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
