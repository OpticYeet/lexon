"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { SwipeCard } from "@/components/feed/SwipeCard";
import { ParticleBackground } from "@/components/feed/ParticleBackground";
import { Skeleton } from "@/components/ui/skeleton";

// 30 palettes: mostly mid-to-dark tones with a few soft lights for breathing room.
// Flows gently through warm → rose → violet → blue → teal → green → dark greens →
// deep blues → warm darks → loops back.
const THEMES = [
  // 1. Warm sand
  { bg: "#E8E2D8", card: "#F4F0E8", text: "#2E2A24", muted: "#7A7468", border: "#D6CFC2", accent: "#B88050" },
  // 2. Soft clay
  { bg: "#E2D8D0", card: "#F0EAE4", text: "#302824", muted: "#887068", border: "#D0C4BA", accent: "#C07858" },
  // 3. Dusty blush
  { bg: "#DED4D2", card: "#ECE6E4", text: "#322828", muted: "#8A6C6A", border: "#CCC2C0", accent: "#B86868" },
  // 4. Rose dusk
  { bg: "#D6CCD0", card: "#E8E0E4", text: "#30262C", muted: "#886878", border: "#C4B8BE", accent: "#B06080" },
  // 5. Mauve shadow
  { bg: "#C8C0CC", card: "#DCD6E0", text: "#2C2630", muted: "#806880", border: "#B8B0BC", accent: "#A06898" },
  // 6. Dusk violet
  { bg: "#B8B0C4", card: "#CEC8D8", text: "#282430", muted: "#786890", border: "#A8A0B4", accent: "#9068B0" },
  // 7. Muted lavender
  { bg: "#A8A4B8", card: "#C0BCD0", text: "#242230", muted: "#706888", border: "#9894A8", accent: "#8070B8" },
  // 8. Twilight indigo
  { bg: "#484868", card: "#565878", text: "#E4E2F0", muted: "#A0A0C0", border: "#5C5E80", accent: "#9090D0" },
  // 9. Deep periwinkle
  { bg: "#3A3C5C", card: "#484A6A", text: "#E2E2F0", muted: "#9898C0", border: "#505270", accent: "#8088D0" },
  // 10. Night violet
  { bg: "#302848", card: "#3C3458", text: "#E4E0F2", muted: "#9890B8", border: "#483E64", accent: "#A088D0" },
  // 11. Deep slate blue
  { bg: "#283040", card: "#343C4E", text: "#E2E6F0", muted: "#8898B0", border: "#3E4858", accent: "#6890C0" },
  // 12. Ocean depth
  { bg: "#223040", card: "#2E3C4E", text: "#E0E8F2", muted: "#80A0B8", border: "#38485A", accent: "#5098C8" },
  // 13. Deep marine
  { bg: "#1E2E3A", card: "#2A3A48", text: "#DEE8F0", muted: "#78A0B4", border: "#344858", accent: "#48A0C0" },
  // 14. Dark teal
  { bg: "#1E3030", card: "#283C3C", text: "#DEF0EC", muted: "#78B0A4", border: "#345050", accent: "#48B8A8" },
  // 15. Deep aqua
  { bg: "#203430", card: "#2C4040", text: "#E0F0EA", muted: "#78B098", border: "#385250", accent: "#48B890" },
  // 16. Forest pool
  { bg: "#223828", card: "#2E4434", text: "#E0F0E4", muted: "#78AA84", border: "#3A5240", accent: "#50B870" },
  // 17. Deep moss
  { bg: "#283A24", card: "#344830", text: "#E2F0E0", muted: "#80A878", border: "#3E5438", accent: "#58B060" },
  // 18. Dark fern
  { bg: "#2E3C22", card: "#3A4A2E", text: "#E4F0DC", muted: "#88A870", border: "#445638", accent: "#68A850" },
  // 19. Olive night
  { bg: "#343C24", card: "#404A30", text: "#E6F0DE", muted: "#90A468", border: "#4A5838", accent: "#78A048" },
  // 20. Shadowed sage
  { bg: "#505848", card: "#606A56", text: "#E6EEE0", muted: "#A0B490", border: "#687860", accent: "#80C060" },
  // 21. Stone moss
  { bg: "#4A5044", card: "#5A6254", text: "#E4EAE0", muted: "#98AA8C", border: "#606A58", accent: "#70B058" },
  // 22. Twilight green
  { bg: "#3E4838", card: "#4C5846", text: "#E2EAE0", muted: "#90A888", border: "#566250", accent: "#68A860" },
  // 23. Dark earth
  { bg: "#2E2C24", card: "#3C3A30", text: "#EDE8DE", muted: "#A09880", border: "#4A4638", accent: "#C0A050" },
  // 24. Warm umber
  { bg: "#322A20", card: "#403828", text: "#F0E8DA", muted: "#A89470", border: "#504430", accent: "#D0A040" },
  // 25. Ember night
  { bg: "#342420", card: "#42302A", text: "#F0E4DA", muted: "#A88870", border: "#524038", accent: "#D08848" },
  // 26. Dark rust
  { bg: "#38241E", card: "#483228", text: "#F0E2D8", muted: "#A88068", border: "#563E34", accent: "#D07840" },
  // 27. Burnt sienna
  { bg: "#3C2420", card: "#4C3430", text: "#F0E0DA", muted: "#A87868", border: "#583C36", accent: "#C86848" },
  // 28. Deep burgundy
  { bg: "#382228", card: "#483034", text: "#F0E0E2", muted: "#A87880", border: "#543840", accent: "#C06070" },
  // 29. Plum shadow
  { bg: "#382432", card: "#483240", text: "#F0E0EA", muted: "#A87890", border: "#543A4C", accent: "#C06898" },
  // 30. Muted wine
  { bg: "#3A2430", card: "#4A3240", text: "#F0E0E8", muted: "#A87888", border: "#543A48", accent: "#C86880" },
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
  const [hasMore, setHasMore] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cycle through the gradient journey sequentially — loops back after 30
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
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const params = new URLSearchParams({ limit: "10" });
      if (currentCursor) params.set("cursor", currentCursor);
      const res = await fetch(`/api/feed/endless?${params}`);
      const data = await res.json();
      const newPapers = data.papers ?? [];
      if (newPapers.length === 0) {
        setHasMore(false);
      } else {
        setPapers((prev) => [...prev, ...newPapers]);
        setCursor(data.nextCursor ?? null);
        if (!data.nextCursor) setHasMore(false);
      }
    } catch (error) {
      console.error("Failed to load more:", error);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore]);

  useEffect(() => {
    if (currentIndex >= papers.length - 3 && !loadingMore && hasMore && papers.length > 0) {
      loadEndless(cursor);
    }
  }, [currentIndex, papers.length, cursor, loadEndless, loadingMore, hasMore]);

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
      className="fixed inset-0 transition-colors duration-1000 ease-in-out"
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
            theme={currentTheme}
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
