"use client";

import { cn } from "@/lib/utils";

interface StreakBadgeProps {
  streak: number;
  className?: string;
}

export function StreakBadge({ streak, className }: StreakBadgeProps) {
  const color =
    streak === 0
      ? "text-streak-cold"
      : streak < 7
      ? "text-streak-warm"
      : streak < 30
      ? "text-streak-hot"
      : "text-streak-fire";

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="currentColor"
        className={cn(color, streak > 0 && "drop-shadow-sm")}
      >
        <path d="M12 2C10.5 5.5 8 8 6 10c-2 2-3 4.5-3 7 0 4.5 4 7 9 7s9-2.5 9-7c0-2.5-1-5-3-7-1.5-1.5-3-3.5-4-5.5-.5-1-1-2-2-2.5zm0 4c.5 1 1.5 2.5 2.5 3.5 1.5 1.5 2.5 3 2.5 5 0 3-2.5 4.5-5 4.5s-5-1.5-5-4.5c0-2 1-3.5 2.5-5C10.5 8.5 11.5 7 12 6z" />
      </svg>
      <span className={cn("font-semibold text-sm tabular-nums", color)}>
        {streak}
      </span>
    </div>
  );
}
