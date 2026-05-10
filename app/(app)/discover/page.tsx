"use client";

import { useState, useEffect, useCallback } from "react";
import { PaperCard } from "@/components/paper/PaperCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const FIELDS = [
  { slug: "all", name: "All" },
  { slug: "biology", name: "Biology" },
  { slug: "physics", name: "Physics" },
  { slug: "chemistry", name: "Chemistry" },
  { slug: "mathematics", name: "Math" },
  { slug: "cs-ai", name: "CS / AI" },
  { slug: "economics", name: "Economics" },
  { slug: "psychology", name: "Psychology" },
  { slug: "environment", name: "Environment" },
  { slug: "medicine", name: "Medicine" },
  { slug: "philosophy", name: "Philosophy" },
];

export default function DiscoverPage() {
  const [papers, setPapers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [field, setField] = useState("all");
  const [sort, setSort] = useState("quality");

  const search = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ sort, limit: "20" });
    if (query) params.set("q", query);
    if (field !== "all") params.set("field", field);

    try {
      const res = await fetch(`/api/papers?${params}`);
      const data = await res.json();
      setPapers(data.papers ?? []);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  }, [query, field, sort]);

  useEffect(() => {
    search();
  }, [search]);

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold mb-6">Discover</h1>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search papers..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
          className="w-full px-4 py-2.5 bg-card border border-border rounded-lg text-sm focus:outline-none focus:border-accent transition-colors"
        />
      </div>

      {/* Field filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
        {FIELDS.map((f) => (
          <button
            key={f.slug}
            onClick={() => setField(f.slug)}
            className={cn(
              "whitespace-nowrap px-3 py-1.5 text-xs font-medium rounded-full border transition-colors",
              field === f.slug
                ? "border-accent bg-accent/5 text-accent"
                : "border-border text-muted hover:text-ink"
            )}
          >
            {f.name}
          </button>
        ))}
      </div>

      {/* Sort */}
      <div className="flex gap-2 mb-6">
        {[
          { value: "quality", label: "Top" },
          { value: "recent", label: "Recent" },
          { value: "citations", label: "Most Cited" },
        ].map((s) => (
          <button
            key={s.value}
            onClick={() => setSort(s.value)}
            className={cn(
              "text-xs font-medium px-2 py-1 rounded transition-colors",
              sort === s.value ? "text-ink bg-ink/5" : "text-muted hover:text-ink"
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Results */}
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : papers.length === 0 ? (
        <p className="text-muted text-center py-12">No papers found.</p>
      ) : (
        <div className="space-y-4">
          {papers.map((paper) => (
            <PaperCard key={paper.id} paper={paper} />
          ))}
        </div>
      )}
    </div>
  );
}
