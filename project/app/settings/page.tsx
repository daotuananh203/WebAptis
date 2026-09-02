"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { useAuth } from "@/lib/hooks/use-auth";
import {
  DEFAULT_USER_PREFERENCES,
  loadUserPreferences,
  saveUserPreferences,
  UserPreferences,
} from "@/lib/storage";

export default function SettingsPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [preferences, setPreferences] = React.useState<UserPreferences>(DEFAULT_USER_PREFERENCES);
  const [saved, setSaved] = React.useState(false);

  React.useEffect(() => {
    if (!isLoading && !user?.id) {
      router.push(`/login?from=${encodeURIComponent("/settings")}`);
      return;
    }
    if (user?.id) setPreferences(loadUserPreferences(user.id));
  }, [isLoading, user?.id, router]);

  const update = (patch: Partial<UserPreferences>) => {
    if (!user?.id) return;
    const next = { ...preferences, ...patch };
    setPreferences(next);
    saveUserPreferences(patch, user.id);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1600);
  };

  if (isLoading || !user) {
    return <AppShell><div className="py-20 text-center text-xs text-slate-300">Đang tải cài đặt...</div></AppShell>;
  }

  return (
    <AppShell
      breadcrumbs={[{ label: "Cài đặt" }]}
      headerTitle="Cài đặt học tập"
      headerDescription="Tùy chỉnh trải nghiệm luyện Aptis trên thiết bị này."
    >
      <div className="max-w-2xl space-y-4">
        <section className="rounded-2xl border border-[#22222a] bg-[#121215] p-5 sm:p-6 space-y-5">
          <h2 className="text-sm font-bold text-white">Âm thanh và trải nghiệm</h2>
          <label className="flex items-center justify-between gap-4 text-xs text-slate-300">
            <span>Tốc độ phát audio</span>
            <select
              aria-label="Tốc độ phát audio"
              value={preferences.audioPlaybackSpeed}
              onChange={(event) => update({ audioPlaybackSpeed: Number(event.target.value) })}
              className="rounded-lg border border-[#262632] bg-[#16161d] px-3 py-2 text-white"
            >
              {[0.75, 1, 1.25, 1.5].map((speed) => <option key={speed} value={speed}>{speed}x</option>)}
            </select>
          </label>
          <label className="flex items-center justify-between gap-4 text-xs text-slate-300">
            <span>Tự chuyển câu sau khi chọn đáp án</span>
            <input
              type="checkbox"
              aria-label="Tự chuyển câu sau khi chọn đáp án"
              checked={preferences.autoNextOnSelect}
              onChange={(event) => update({ autoNextOnSelect: event.target.checked })}
              className="h-4 w-4 accent-emerald-500"
            />
          </label>
          <label className="flex items-center justify-between gap-4 text-xs text-slate-300">
            <span>Âm thanh giao diện</span>
            <input
              type="checkbox"
              aria-label="Âm thanh giao diện"
              checked={preferences.soundEffectsEnabled}
              onChange={(event) => update({ soundEffectsEnabled: event.target.checked })}
              className="h-4 w-4 accent-emerald-500"
            />
          </label>
        </section>
        {saved && <p role="status" className="text-xs text-emerald-300">Đã lưu cài đặt.</p>}
      </div>
    </AppShell>
  );
}
