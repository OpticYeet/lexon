"use client";

import { useEffect, useState } from "react";
import { StreakBadge } from "@/components/streak/StreakBadge";
import { StreakCalendar } from "@/components/streak/StreakCalendar";
import { DailyProgressBar } from "@/components/streak/DailyProgressBar";
import { Skeleton } from "@/components/ui/skeleton";

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  totalPapersRead: number;
  totalDaysActive: number;
  todayProgress: { read: number; goal: number; goalMet: boolean };
  recentDays: { date: string; papersRead: number; goalMet: boolean }[];
}

export default function StreakPage() {
  const [data, setData] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/streak")
      .then((res) => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold mb-8">Your Streak</h1>

      {/* Hero streak number */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-3 mb-2">
          <StreakBadge streak={data.currentStreak} className="scale-150" />
        </div>
        <p className="text-4xl font-serif font-bold mt-4">
          {data.currentStreak} {data.currentStreak === 1 ? "day" : "days"}
        </p>
        <p className="text-muted text-sm mt-1">Current streak</p>
      </div>

      {/* Today's progress */}
      <div className="bg-card border border-border rounded-xl p-5 mb-8">
        <h2 className="text-sm font-semibold mb-3">Today</h2>
        <DailyProgressBar
          read={data.todayProgress.read}
          goal={data.todayProgress.goal}
        />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="text-center">
          <p className="text-2xl font-bold">{data.longestStreak}</p>
          <p className="text-xs text-muted">Longest streak</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold">{data.totalPapersRead}</p>
          <p className="text-xs text-muted">Papers read</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold">{data.totalDaysActive}</p>
          <p className="text-xs text-muted">Days active</p>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="text-sm font-semibold mb-4">Last 90 days</h2>
        <StreakCalendar days={data.recentDays} />
      </div>
    </div>
  );
}
