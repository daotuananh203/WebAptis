"use client";

import * as React from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ExamTimerProps {
  initialSeconds: number;
  deadlineAt?: string;
  onTimeExpired: () => void;
  onTick?: (remainingSeconds: number) => void;
  className?: string;
}

export function ExamTimer({
  initialSeconds,
  deadlineAt,
  onTimeExpired,
  onTick,
  className,
}: ExamTimerProps) {
  const [seconds, setSeconds] = React.useState(initialSeconds);
  const expiryNotified = React.useRef(false);
  const onTimeExpiredRef = React.useRef(onTimeExpired);
  const onTickRef = React.useRef(onTick);

  React.useEffect(() => {
    onTimeExpiredRef.current = onTimeExpired;
    onTickRef.current = onTick;
  }, [onTimeExpired, onTick]);

  React.useEffect(() => {
    expiryNotified.current = false;
    const deadline = deadlineAt ? Date.parse(deadlineAt) : Date.now() + initialSeconds * 1000;
    const tick = () => {
      const next = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setSeconds(next);
      if (next > 0) onTickRef.current?.(next);
      if (next === 0 && !expiryNotified.current) {
        expiryNotified.current = true;
        onTimeExpiredRef.current();
      }
    };
    tick();
    const interval = window.setInterval(tick, 250);
    return () => window.clearInterval(interval);
  }, [deadlineAt, initialSeconds]);

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
