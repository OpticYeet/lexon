"use client";

import { cn } from "@/lib/utils";

interface ProgressDotsProps {
  total: number;
  filled: number;
  className?: string;
}

export function ProgressDots({ total, filled, className }: ProgressDotsProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "w-3 h-3 rounded-full transition-all duration-500",
            i < filled
              ? "bg-accent scale-110"
              : "bg-border"
          )}
          style={{
            transitionDelay: i < filled ? `${i * 100}ms` : "0ms",
          }}
        />
      ))}
    </div>
  );
}
