"use client";

import * as React from "react";
import { Clock, Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PracticeTimerProps {
  initialSeconds: number;
  onTimeExpired?: () => void;
  onTick?: (remainingSeconds: number) => void;
  className?: string;
}

export function PracticeTimer({
  initialSeconds,
  onTimeExpired,
  onTick,
  className,
}: PracticeTimerProps) {
  const [seconds, setSeconds] = React.useState(initialSeconds);
  const [isPaused, setIsPaused] = React.useState(false);

  React.useEffect(() => {
    setSeconds(initialSeconds);
  }, [initialSeconds]);

  React.useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onTimeExpired?.();
          return 0;
        }
        const next = prev - 1;
        onTick?.(next);
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, onTimeExpired, onTick]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const isUrgent = seconds < 120 && seconds > 0;

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors shadow-2xs",
        isUrgent
          ? "border-red-500/40 bg-red-500/10 text-red-400 animate-pulse"
          : "border-[#2a2a36] bg-[#16161d] text-white",
        className
      )}
    >
      <Clock className={cn("h-3.5 w-3.5", isUrgent ? "text-red-400" : "text-emerald-300")} />
      <span className="font-mono tracking-wider">
        {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
      </span>
      <button
        onClick={() => setIsPaused(!isPaused)}
        className="text-slate-300 hover:text-white transition-colors cursor-pointer ml-1 p-0.5"
        title={isPaused ? "Tiếp tục" : "Tạm dừng"}
      >
        {isPaused ? <Play className="h-3 w-3 fill-current" /> : <Pause className="h-3 w-3" />}
      </button>
    </div>
  );
}
