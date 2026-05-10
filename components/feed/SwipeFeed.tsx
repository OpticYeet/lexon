"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { SwipeCard } from "@/components/feed/SwipeCard";
import { ParticleBackground } from "@/components/feed/ParticleBackground";
import { Skeleton } from "@/components/ui/skeleton";

// 30 aesthetic, calming color palettes
const THEMES = [
  // 1. Warm parchment
  { bg: "#F8F6F1", card: "#FFFFFF", text: "#2C2A25", muted: "#7A776E", border: "#E8E4DC", accent: "#C4775A" },
  // 2. Twilight navy
  { bg: "#1E2533", card: "#28303F", text: "#E8ECF2", muted: "#8E9BB0", border: "#3A4456", accent: "#7EB5D6" },
  // 3. Sage mist
  { bg: "#EBF0EC", card: "#F8FBF8", text: "#2A3530", muted: "#6B8070", border: "#D4DED6", accent: "#5E9E78" },
  // 4. Lavender haze
  { bg: "#F0EDF5", card: "#FDFCFF", text: "#2D2838", muted: "#7E7490", border: "#DDD6E8", accent: "#9B7EC8" },
  // 5. Deep ocean
  { bg: "#1A2830", card: "#223340", text: "#E5EEF2", muted: "#88A4B5", border: "#334D5C", accent: "#5DAAC8" },
  // 6. Blush cream
  { bg: "#F5EFED", card: "#FFFBFA", text: "#3A2828", muted: "#9A7A78", border: "#E8DAD6", accent: "#C88A80" },
  // 7. Moss & stone
  { bg: "#E8EBE4", card: "#F6F8F4", text: "#2B302A", muted: "#6E7A65", border: "#D0D6C8", accent: "#7A9B5A" },
  // 8. Midnight plum
  { bg: "#221E2E", card: "#2C2838", text: "#ECE8F2", muted: "#A098B5", border: "#403A50", accent: "#B090D0" },
  // 9. Sand dune
  { bg: "#F2EDE5", card: "#FDFBF7", text: "#3A3428", muted: "#8A7E68", border: "#E2DAC8", accent: "#C09860" },
  // 10. Arctic blue
  { bg: "#EDF2F5", card: "#F8FBFD", text: "#1E2E38", muted: "#6080A0", border: "#D0DEE8", accent: "#4A90B8" },
  // 11. Warm charcoal
  { bg: "#252320", card: "#302D2A", text: "#EDE8E2", muted: "#A09888", border: "#454038", accent: "#D4A070" },
  // 12. Seafoam
  { bg: "#E8F2F0", card: "#F5FDFB", text: "#1E3530", muted: "#5E8A80", border: "#C8E0DA", accent: "#4AABA0" },
  // 13. Dusty rose
  { bg: "#F2EAEB", card: "#FDF8F8", text: "#382828", muted: "#907070", border: "#E2D4D5", accent: "#C07080" },
  // 14. Forest night
  { bg: "#1E2822", card: "#26322A", text: "#E5F0E8", muted: "#8AAA92", border: "#384A3E", accent: "#6EC08A" },
  // 15. Peach cloud
  { bg: "#F5F0EB", card: "#FFFCF8", text: "#3A3028", muted: "#908068", border: "#E8DDD0", accent: "#D08860" },
  // 16. Slate dusk
  { bg: "#2A2D35", card: "#343840", text: "#E8EAF0", muted: "#929AAA", border: "#464B55", accent: "#88A8D0" },
  // 17. Pistachio
  { bg: "#EDF0E8", card: "#F8FAF5", text: "#2A3025", muted: "#687A58", border: "#D6DCC8", accent: "#7AAA5A" },
  // 18. Mauve twilight
  { bg: "#2B2530", card: "#352E3A", text: "#F0E8F2", muted: "#A898B0", border: "#4A4055", accent: "#C8A0D8" },
  // 19. Warm linen
  { bg: "#F5F2ED", card: "#FEFDFB", text: "#302C25", muted: "#7A7468", border: "#E5E0D8", accent: "#B88050" },
  // 20. Deep teal
  { bg: "#1A2C2E", card: "#223838", text: "#E5F2F0", muted: "#80B0AA", border: "#305050", accent: "#50C0B0" },
  // 21. Cotton candy
  { bg: "#F2EDF5", card: "#FDFAFF", text: "#302838", muted: "#8A78A0", border: "#E0D6EA", accent: "#A880C8" },
  // 22. Olive grove
  { bg: "#EAEBE4", card: "#F6F7F2", text: "#2E3028", muted: "#707560", border: "#D4D6C8", accent: "#8A9A50" },
  // 23. Night sky
  { bg: "#1A1E28", card: "#222835", text: "#E8ECF5", muted: "#8898B8", border: "#303848", accent: "#6888C8" },
  // 24. Vanilla bean
  { bg: "#F5F2EA", card: "#FFFDF5", text: "#352E22", muted: "#887A60", border: "#E8E0D0", accent: "#C8A050" },
  // 25. Misty mountain
  { bg: "#E8ECEE", card: "#F5F8FA", text: "#252E32", muted: "#607078", border: "#CDD6DA", accent: "#5890A0" },
  // 26. Dark amber
  { bg: "#252018", card: "#302A20", text: "#F0E8DA", muted: "#A89878", border: "#484030", accent: "#D0A050" },
  // 27. Periwinkle
  { bg: "#ECEEF5", card: "#F8FAFF", text: "#252838", muted: "#6A70A0", border: "#D4D8EA", accent: "#6878C0" },
  // 28. Eucalyptus
  { bg: "#E5EDE8", card: "#F2FAF5", text: "#1E302A", muted: "#5A8A70", border: "#C8DCD0", accent: "#408868" },
  // 29. Soft clay
  { bg: "#F0EAE5", card: "#FBF7F4", text: "#382A25", muted: "#907060", border: "#E0D2C8", accent: "#B87050" },
  // 30. Cosmic indigo
  { bg: "#1E1E2E", card: "#282838", text: "#E8E8F5", muted: "#9090B8", border: "#383850", accent: "#8080D0" },
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

  // Shuffle themes deterministically so adjacent papers never share a palette
  const shuffledThemes = useMemo(() => {
    const order = THEMES.map((_, i) => i);
    // Fisher-Yates with fixed seed for consistency within a session
    let seed = 42;
    const rng = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    return order.map((i) => THEMES[i]);
  }, []);

  const currentTheme = useMemo(() => shuffledThemes[currentIndex % shuffledThemes.length], [currentIndex, shuffledThemes]);

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
            theme={shuffledThemes[index % shuffledThemes.length]}
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
