"use client";

import * as React from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ExamTimerProps {
  initialSeconds: number;
  onTimeExpired: () => void;
  onTick?: (remainingSeconds: number) => void;
  className?: string;
}

export function ExamTimer({
  initialSeconds,
  onTimeExpired,
  onTick,
  className,
}: ExamTimerProps) {
  const [seconds, setSeconds] = React.useState(initialSeconds);

  React.useEffect(() => {
    setSeconds(initialSeconds);
  }, [initialSeconds]);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onTimeExpired();
          return 0;
        }
        const next = prev - 1;
        onTick?.(next);
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onTimeExpired, onTick]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const isUrgent = seconds < 180 && seconds > 0; // Less than 3 mins

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-colors shadow-2xs",
        isUrgent
          ? "border-red-500/40 bg-red-500/10 text-red-400 animate-pulse"
          : "border-[#2a2a36] bg-[#16161d] text-white",
        className
      )}
    >
      <Clock className={cn("h-4 w-4", isUrgent ? "text-red-400" : "text-emerald-300")} />
      <span className="font-mono text-xs sm:text-sm tracking-wider">
        {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
      </span>
    </div>
  );
}
