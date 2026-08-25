"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { Skeleton } from "@/components/ui/skeleton";
import { loadProgressHistory } from "@/lib/storage";
import {
  calculateDailyStreak,
  calculateOverallStatistics,
  generateTwelveWeekHeatmap,
  ProgressAttemptRecord,
} from "@/lib/progress";
import { generateRecommendations } from "@/lib/recommendations";
import { useAuth } from "@/lib/hooks/use-auth";

export default function DashboardPage() {
  const { user } = useAuth();
  const [isMounted, setIsMounted] = useState(false);
  const [history, setHistory] = useState<ProgressAttemptRecord[]>([]);

  useEffect(() => {
    const loadedHistory = loadProgressHistory(user?.id);
    setHistory(loadedHistory);
    setIsMounted(true);
  }, [user?.id]);

  if (!isMounted) {
    return (
      <AppShell>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64 rounded-xl bg-[#16161d]" />
          <Skeleton className="h-28 w-full rounded-2xl bg-[#16161d]" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-56 w-full rounded-2xl bg-[#16161d]" />
            <Skeleton className="h-56 w-full rounded-2xl bg-[#16161d]" />
            <Skeleton className="h-56 w-full rounded-2xl bg-[#16161d]" />
          </div>
        </div>
      </AppShell>
    );
  }

  // Derive domain metrics dynamically from storage
  const streak = calculateDailyStreak(history);
  const stats = calculateOverallStatistics(history);
  const heatmap = generateTwelveWeekHeatmap(history);
  const recommendations = generateRecommendations(history);

  return (
    <AppShell
      currentStreak={streak.currentStreak}
      isActiveToday={streak.isActiveToday}
    >
      <DashboardView
        user={user}
        streak={streak}
        stats={stats}
        heatmap={heatmap}
        recommendations={recommendations}
      />
    </AppShell>
  );
}
