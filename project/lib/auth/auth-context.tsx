"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LoginInput, RegisterInput, UserProfile } from "./types";
import { migrateAnonymousStorageToUser } from "../storage/migration";
import { syncUserProgressWithServer } from "../storage/sync";

export interface AuthContextValue {
  user: UserProfile | null;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<{ success: boolean; error?: string }>;
  register: (input: RegisterInput) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<UserProfile | null>;
}

export const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const router = useRouter();

  React.useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === "aptis_auth_event" && event.newValue) {
        setUser(null);
        router.push("/login");
      }
    };
    window.addEventListener("storage", onStorage);
    const channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("aptis-auth") : null;
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === "logout") {
        setUser(null);
        router.push("/login");
      }
    };
    channel?.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("storage", onStorage);
      channel?.removeEventListener("message", onMessage);
      channel?.close();
    };
  }, [router]);

  const handlePostAuthSync = React.useCallback(async (userId: string) => {
    try {
      // 1. Migrate any local anonymous drafts/history to user scope
      migrateAnonymousStorageToUser(userId);
      // 2. Synchronize with PostgreSQL server (source of truth)
      await syncUserProgressWithServer(userId);
    } catch (err) {
      console.warn("[Auth Post-Sync Warning]:", err);
    }
  }, []);

  const fetchCurrentUser = React.useCallback(async (): Promise<UserProfile | null> => {
    try {
      const res = await fetch("/api/auth/me");
      if (!res.ok) {
        setUser(null);
        return null;
      }
      const json = await res.json();
      if (json.success && json.data) {
        setUser(json.data);
        if (json.data.id) {
          handlePostAuthSync(json.data.id);
        }
        return json.data;
      }
      setUser(null);
      return null;
    } catch {
      setUser(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [handlePostAuthSync]);

  React.useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = async (input: LoginInput): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setUser(json.data);
        if (json.data.id) {
          await handlePostAuthSync(json.data.id);
        }
        return { success: true };
      }
      return { success: false, error: json.error || "Đăng nhập không thành công" };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Lỗi kết nối máy chủ",
      };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (input: RegisterInput): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setUser(json.data);
        if (json.data.id) {
          await handlePostAuthSync(json.data.id);
        }
        return { success: true };
      }
      return { success: false, error: json.error || "Đăng ký không thành công" };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Lỗi kết nối máy chủ",
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignore network errors on logout
    } finally {
      setUser(null);
      try {
        localStorage.setItem("aptis_auth_event", `${Date.now()}`);
      } catch {}
      if (typeof BroadcastChannel !== "undefined") {
        const channel = new BroadcastChannel("aptis-auth");
        channel.postMessage({ type: "logout" });
        channel.close();
      }
      router.push("/login");
    }
  };

  const value = React.useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      login,
      register,
      logout,
      refreshUser: fetchCurrentUser,
    }),
    [user, isLoading, fetchCurrentUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
