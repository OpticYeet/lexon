"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { SwipeCard } from "@/components/feed/SwipeCard";
import { ParticleBackground } from "@/components/feed/ParticleBackground";
import { Skeleton } from "@/components/ui/skeleton";

interface FeedPaper {
  id: string;
  title: string;
  aiSummary: string | null;
  abstract: string | null;
  year: number | null;
  citationCount: number | null;
  fullPaperUrl: string;
  authors: { name: string }[];
  field: { name: string; color: string; slug: string } | null;
}

export function SwipeFeed() {
  const [papers, setPapers] = useState<FeedPaper[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/feed");
        const data = await res.json();
        const dailyPapers = data.papers ?? [];

        if (dailyPapers.length > 0) {
          setPapers(dailyPapers);
        } else {
          await loadEndless(null);
        }
      } catch (error) {
        console.error("Failed to load feed:", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const loadEndless = useCallback(async (currentCursor: string | null) => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      const params = new URLSearchParams({ limit: "10" });
      if (currentCursor) params.set("cursor", currentCursor);
      const res = await fetch(`/api/feed/endless?${params}`);
      const data = await res.json();
      setPapers((prev) => [...prev, ...(data.papers ?? [])]);
      setCursor(data.nextCursor ?? null);
    } catch (error) {
      console.error("Failed to load more:", error);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore]);

  useEffect(() => {
    if (currentIndex >= papers.length - 3 && !loadingMore && papers.length > 0) {
      loadEndless(cursor);
    }
  }, [currentIndex, papers.length, cursor, loadEndless, loadingMore]);

  useEffect(() => {
    if (papers[currentIndex]) {
      fetch("/api/interactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paperId: papers[currentIndex].id, type: "read", readPct: 100 }),
      }).catch(() => {});
    }
  }, [currentIndex, papers]);

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const scrollTop = container.scrollTop;
    const cardHeight = container.clientHeight;
    const newIndex = Math.round(scrollTop / cardHeight);
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < papers.length) {
      setCurrentIndex(newIndex);
    }
  }, [currentIndex, papers.length]);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-paper">
        <div className="space-y-4 w-full max-w-md px-6">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (papers.length === 0) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-paper">
        <div className="text-center px-6">
          <p className="font-serif text-2xl font-bold mb-2">No papers yet</p>
          <p className="text-muted">Check back soon — papers are loaded daily.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0">
      <ParticleBackground />
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="absolute inset-0 overflow-y-scroll snap-y snap-mandatory scrollbar-hide z-10"
      >
        {papers.map((paper, index) => (
          <SwipeCard
            key={paper.id}
            paper={paper}
            isActive={index === currentIndex}
          />
        ))}
        {loadingMore && (
          <div className="h-screen snap-start flex items-center justify-center">
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-muted animate-bounce [animation-delay:0ms]" />
              <div className="w-2 h-2 rounded-full bg-muted animate-bounce [animation-delay:150ms]" />
              <div className="w-2 h-2 rounded-full bg-muted animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
