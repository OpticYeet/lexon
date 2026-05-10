"use client";

import { cn } from "@/lib/utils";

interface StreakDay {
  date: string;
  papersRead: number;
  goalMet: boolean;
}

interface StreakCalendarProps {
  days: StreakDay[];
}

export function StreakCalendar({ days }: StreakCalendarProps) {
  // Generate last 90 days
  const today = new Date();
  const allDays: { date: string; active: boolean }[] = [];
  const dayMap = new Map(days.map((d) => [d.date, d]));

  for (let i = 89; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    const day = dayMap.get(dateStr);
    allDays.push({
      date: dateStr,
      active: day?.goalMet ?? false,
    });
  }

  // Group into weeks (rows of 7)
  const weeks: typeof allDays[] = [];
  for (let i = 0; i < allDays.length; i += 7) {
    weeks.push(allDays.slice(i, i + 7));
  }

  return (
    <div className="space-y-1.5">
      {weeks.map((week, wi) => (
        <div key={wi} className="flex gap-1.5">
          {week.map((day) => (
            <div
              key={day.date}
              className={cn(
                "w-3.5 h-3.5 rounded-full transition-colors",
                day.active ? "bg-accent" : "bg-ink/5"
              )}
              title={`${day.date}${day.active ? " — Goal met" : ""}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
