"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { SwipeCard } from "@/components/feed/SwipeCard";
import { ParticleBackground } from "@/components/feed/ParticleBackground";
import { Skeleton } from "@/components/ui/skeleton";

// Aesthetic background palettes — each entry is [bg, cardBg, textColor, mutedColor, borderColor, accentColor]
const THEMES = [
  { bg: "#F8F6F1", card: "#FFFFFF", text: "#1A1A18", muted: "#6B6B5E", border: "#E2DFD8", accent: "#E8602C" },
  { bg: "#1A1D23", card: "#252830", text: "#F0EDE8", muted: "#9B9A97", border: "#3A3D45", accent: "#F4A261" },
  { bg: "#F0EBE3", card: "#FEFCF9", text: "#2C2420", muted: "#7A6B5E", border: "#DDD6CC", accent: "#C45D3E" },
  { bg: "#E8EDF2", card: "#FFFFFF", text: "#1B2838", muted: "#5E6B7A", border: "#D0D8E2", accent: "#3D7BB5" },
  { bg: "#1E2A1E", card: "#263026", text: "#EAF0EA", muted: "#96A896", border: "#3A4A3A", accent: "#7CB87C" },
  { bg: "#2D2438", card: "#362E42", text: "#F0ECF5", muted: "#A89BB8", border: "#4A3D5A", accent: "#C09EE8" },
  { bg: "#F5F0E8", card: "#FFFDF8", text: "#3A2E1E", muted: "#8A7A62", border: "#E8DFD0", accent: "#B8860B" },
  { bg: "#1A2332", card: "#222E3E", text: "#E8F0F8", muted: "#8AA0B8", border: "#334455", accent: "#5BA4D9" },
  { bg: "#F2E8E8", card: "#FFFAFA", text: "#2E1A1A", muted: "#8A6060", border: "#E0D0D0", accent: "#C75050" },
  { bg: "#E8F0E8", card: "#F8FFF8", text: "#1A2E1A", muted: "#5E7A5E", border: "#CDE0CD", accent: "#4A8A4A" },
];

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

  const currentTheme = useMemo(() => THEMES[currentIndex % THEMES.length], [currentIndex]);

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
    <div
      className="fixed inset-0 transition-colors duration-700 ease-in-out"
      style={{ backgroundColor: currentTheme.bg }}
    >
      <ParticleBackground theme={currentTheme} />
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
            theme={THEMES[index % THEMES.length]}
          />
        ))}
        {loadingMore && (
          <div className="h-screen snap-start flex items-center justify-center">
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full animate-bounce [animation-delay:0ms]" style={{ backgroundColor: currentTheme.muted }} />
              <div className="w-2 h-2 rounded-full animate-bounce [animation-delay:150ms]" style={{ backgroundColor: currentTheme.muted }} />
              <div className="w-2 h-2 rounded-full animate-bounce [animation-delay:300ms]" style={{ backgroundColor: currentTheme.muted }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
