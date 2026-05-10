"use client";

import { StreakBadge } from "@/components/streak/StreakBadge";
import { DailyProgressBar } from "@/components/streak/DailyProgressBar";

interface FeedHeaderProps {
  streak: number;
  read: number;
  goal: number;
}

export function FeedHeader({ streak, read, goal }: FeedHeaderProps) {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <p className="text-sm text-muted mb-1">{today}</p>
        <h1 className="font-serif text-2xl font-bold">Today&rsquo;s Papers</h1>
      </div>
      <div className="flex items-center gap-4">
        <DailyProgressBar read={read} goal={goal} />
        <StreakBadge streak={streak} />
      </div>
    </div>
  );
}
