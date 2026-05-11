"use client";

import { useState, useCallback, useEffect } from "react";
import { PaperCard } from "@/components/paper/PaperCard";
import { FeedHeader } from "@/components/feed/FeedHeader";
import { FeedDivider } from "@/components/feed/FeedDivider";
import { InfiniteScrollSentinel } from "@/components/feed/InfiniteScrollSentinel";
import { Skeleton } from "@/components/ui/skeleton";

interface FeedPaper {
  id: string;
  title: string;
  aiSummary: string | null;
  abstract: string | null;
  year: number | null;
  citationCount: number | null;
  authors: { name: string }[];
  field: { name: string; color: string; slug: string } | null;
  isRead?: boolean;
}

export function DailyFeed() {
  const [dailyPapers, setDailyPapers] = useState<FeedPaper[]>([]);
  const [endlessPapers, setEndlessPapers] = useState<FeedPaper[]>([]);
  const [progress, setProgress] = useState({ read: 0, goal: 3, streakActive: false });
  const [streak, setStreak] = useState(0);
  const [cursor, setCursor] = useState<string | null>(null);
  const [endlessLoading, setEndlessLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [endlessStarted, setEndlessStarted] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [feedRes, streakRes] = await Promise.all([
          fetch("/api/feed"),
          fetch("/api/streak"),
        ]);
        const feedData = await feedRes.json();
        const streakData = await streakRes.json();

        setDailyPapers(feedData.papers ?? []);
        setProgress(feedData.progress ?? { read: 0, goal: 3, streakActive: false });
        setStreak(streakData.currentStreak ?? 0);
      } catch (error) {
        console.error("Failed to load feed:", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const markAsRead = useCallback(async (paperId: string) => {
    await fetch("/api/interactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paperId, type: "read", readPct: 100 }),
    });

    setDailyPapers((prev) =>
      prev.map((p) => (p.id === paperId ? { ...p, isRead: true } : p))
    );
    setEndlessPapers((prev) =>
      prev.map((p) => (p.id === paperId ? { ...p, isRead: true } : p))
    );
    setProgress((prev) => ({ ...prev, read: prev.read + 1 }));
  }, []);

  const goalComplete = progress.read >= progress.goal;

  // Start endless feed once goal is complete
  useEffect(() => {
    if (goalComplete && !endlessStarted) {
      setEndlessStarted(true);
      loadMore();
    }
  }, [goalComplete, endlessStarted]);

  const loadMore = useCallback(async () => {
    if (endlessLoading) return;
    setEndlessLoading(true);
    try {
      const params = new URLSearchParams({ limit: "10" });
      if (cursor) params.set("cursor", cursor);

      const res = await fetch(`/api/feed/endless?${params}`);
      const data = await res.json();

      setEndlessPapers((prev) => [...prev, ...(data.papers ?? [])]);
      setCursor(data.nextCursor ?? null);
    } catch (error) {
      console.error("Failed to load endless feed:", error);
    } finally {
      setEndlessLoading(false);
    }
  }, [cursor, endlessLoading]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div>
      <FeedHeader streak={streak} read={progress.read} goal={progress.goal} />

      <div className="space-y-4">
        {dailyPapers.map((paper) => (
          <div key={paper.id} onClick={() => !paper.isRead && markAsRead(paper.id)}>
            <PaperCard paper={paper} />
          </div>
        ))}
      </div>

      {goalComplete && (
        <>
          <FeedDivider />
          <div className="space-y-4">
            {endlessPapers.map((paper) => (
              <div key={paper.id} onClick={() => !paper.isRead && markAsRead(paper.id)}>
                <PaperCard paper={paper} />
              </div>
            ))}
          </div>
          {cursor && (
            <InfiniteScrollSentinel
              onIntersect={loadMore}
              loading={endlessLoading}
            />
          )}
        </>
      )}
    </div>
  );
}
