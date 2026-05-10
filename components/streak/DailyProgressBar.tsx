"use client";

import { ProgressDots } from "@/components/ui/progress";

interface DailyProgressBarProps {
  read: number;
  goal: number;
}

export function DailyProgressBar({ read, goal }: DailyProgressBarProps) {
  const isComplete = read >= goal;

  return (
    <div className="flex items-center gap-3">
      <ProgressDots total={goal} filled={read} />
      <span className="text-xs text-muted">
        {isComplete ? (
          <span className="text-success font-medium">Goal complete!</span>
        ) : (
          `${read} of ${goal} papers`
        )}
      </span>
    </div>
  );
}
