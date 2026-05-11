"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { SwipeCard } from "@/components/feed/SwipeCard";
import { ParticleBackground } from "@/components/feed/ParticleBackground";
import { Skeleton } from "@/components/ui/skeleton";

// 30 palettes ordered as a smooth gradient journey — each step is a gentle shift from the last.
// Flows: warm cream → peach → blush → rose → mauve → lavender → periwinkle → sky →
// seafoam → sage → olive → moss → deeper greens → teal → deep blue → slate → charcoal →
// warm dark → amber dark → back toward warm lights. Loops seamlessly.
const THEMES = [
  // 1. Warm cream
  { bg: "#F7F5F0", card: "#FFFFFF", text: "#2E2B26", muted: "#7D7A72", border: "#EAE6DE", accent: "#B8865C" },
  // 2. Soft wheat
  { bg: "#F5F1E8", card: "#FEFCF7", text: "#33302A", muted: "#8A8070", border: "#E6E0D2", accent: "#C49058" },
  // 3. Golden linen
  { bg: "#F3EEE2", card: "#FDFBF5", text: "#362F24", muted: "#8E7E64", border: "#E4DBCA", accent: "#C89450" },
  // 4. Peach sand
  { bg: "#F5EDE6", card: "#FFFAF6", text: "#382E28", muted: "#907868", border: "#E8DCD0", accent: "#C88060" },
  // 5. Warm blush
  { bg: "#F4ECE8", card: "#FFF9F7", text: "#382A28", muted: "#947470", border: "#E6D6D2", accent: "#C47A72" },
  // 6. Dusty rose
  { bg: "#F2EAEB", card: "#FDF7F8", text: "#352828", muted: "#906C6E", border: "#E2D2D4", accent: "#C0707A" },
  // 7. Soft mauve
  { bg: "#F0E9ED", card: "#FCF8FA", text: "#332830", muted: "#8A6E80", border: "#DED2DA", accent: "#B07090" },
  // 8. Lilac mist
  { bg: "#EEEBF2", card: "#FBF9FD", text: "#2E2835", muted: "#807090", border: "#DCD6E4", accent: "#9B78B8" },
  // 9. Lavender cloud
  { bg: "#ECEAF4", card: "#FAF8FF", text: "#2A2838", muted: "#787098", border: "#D8D4E8", accent: "#8878C0" },
  // 10. Periwinkle
  { bg: "#EAECF5", card: "#F8FAFF", text: "#282838", muted: "#7078A0", border: "#D4D8EA", accent: "#7080C8" },
  // 11. Soft sky
  { bg: "#E8EEF5", card: "#F6FAFF", text: "#252E38", muted: "#6880A0", border: "#D0DAE8", accent: "#5888C0" },
  // 12. Morning blue
  { bg: "#E6F0F4", card: "#F5FBFD", text: "#223038", muted: "#6088A0", border: "#CCE0EA", accent: "#4890B8" },
  // 13. Ocean mist
  { bg: "#E5F0F2", card: "#F4FBFC", text: "#203235", muted: "#5C8A98", border: "#C8E0E4", accent: "#4098A8" },
  // 14. Seafoam
  { bg: "#E5F0EE", card: "#F4FCFA", text: "#1E3430", muted: "#5A8A82", border: "#C8E0DA", accent: "#40A090" },
  // 15. Mint sage
  { bg: "#E6F0EA", card: "#F5FBF6", text: "#20352A", muted: "#5C8A70", border: "#CADECE", accent: "#489878" },
  // 16. Soft sage
  { bg: "#E8EFE8", card: "#F6FAF6", text: "#243028", muted: "#608A68", border: "#D0DCC8", accent: "#509868" },
  // 17. Moss green
  { bg: "#EAEFE6", card: "#F7FAF4", text: "#283025", muted: "#688A5C", border: "#D4DCC4", accent: "#5A9858" },
  // 18. Olive mist
  { bg: "#ECEDE4", card: "#F8F9F2", text: "#2C3025", muted: "#707A58", border: "#D8DAC8", accent: "#6A9048" },
  // 19. Willow
  { bg: "#EAECE2", card: "#F6F8F0", text: "#2E3224", muted: "#747C52", border: "#D6D8C2", accent: "#788C42" },
  // 20. Fern dusk
  { bg: "#E2E6DE", card: "#F0F4EC", text: "#2A3028", muted: "#687860", border: "#CCD4C4", accent: "#6A8850" },
  // 21. Deep sage
  { bg: "#D8DED6", card: "#E8EEE4", text: "#262E26", muted: "#5E7258", border: "#C2CCC0", accent: "#5A8048" },
  // 22. Stone green
  { bg: "#CED6CE", card: "#E0E8E0", text: "#222C24", muted: "#587058", border: "#B8C4B8", accent: "#508050" },
  // 23. Twilight moss
  { bg: "#3A4238", card: "#444E42", text: "#E2E8E0", muted: "#98A892", border: "#525E50", accent: "#78B070" },
  // 24. Evening teal
  { bg: "#2C3838", card: "#364444", text: "#E0ECE8", muted: "#88AAA0", border: "#445858", accent: "#60B0A0" },
  // 25. Deep slate
  { bg: "#2A3038", card: "#343C44", text: "#E4E8EE", muted: "#8898A8", border: "#424A54", accent: "#6898C0" },
  // 26. Night blue
  { bg: "#262C38", card: "#303848", text: "#E4E8F2", muted: "#8890B0", border: "#3C4456", accent: "#7088C8" },
  // 27. Warm night
  { bg: "#2C2828", card: "#383434", text: "#EDE8E4", muted: "#A09490", border: "#4A4440", accent: "#C89070" },
  // 28. Dark clay
  { bg: "#302A24", card: "#3C3630", text: "#EEE8E0", muted: "#A09480", border: "#4E4438", accent: "#D09858" },
  // 29. Ember dark
  { bg: "#322820", card: "#3E342C", text: "#F0E8DC", muted: "#A89478", border: "#504434", accent: "#D8A048" },
  // 30. Dusk amber
  { bg: "#342C22", card: "#40382E", text: "#F0EAE0", muted: "#A89880", border: "#524838", accent: "#D0A850" },
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
