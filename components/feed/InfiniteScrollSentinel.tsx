"use client";

import { useEffect, useRef } from "react";

interface InfiniteScrollSentinelProps {
  onIntersect: () => void;
  loading: boolean;
}

export function InfiniteScrollSentinel({
  onIntersect,
  loading,
}: InfiniteScrollSentinelProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !loading) {
          onIntersect();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [onIntersect, loading]);

  return (
    <div ref={ref} className="h-10 flex items-center justify-center">
      {loading && (
        <div className="flex gap-1">
          <div className="w-2 h-2 rounded-full bg-muted animate-bounce [animation-delay:0ms]" />
          <div className="w-2 h-2 rounded-full bg-muted animate-bounce [animation-delay:150ms]" />
          <div className="w-2 h-2 rounded-full bg-muted animate-bounce [animation-delay:300ms]" />
        </div>
      )}
    </div>
  );
}
