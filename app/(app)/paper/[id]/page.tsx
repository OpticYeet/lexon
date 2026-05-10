"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface PaperDetail {
  id: string;
  title: string;
  abstract: string | null;
  aiSummary: string | null;
  fullPaperUrl: string;
  pdfUrl: string | null;
  year: number | null;
  citationCount: number | null;
  venue: string | null;
  field: { name: string; color: string } | null;
  authors: { name: string; affiliation: string | null }[];
}

export default function PaperDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [paper, setPaper] = useState<PaperDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/papers/${id}`);
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();
        setPaper(data);

        // Mark as read
        await fetch("/api/interactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paperId: id, type: "read", readPct: 100 }),
        });
      } catch {
        router.push("/dashboard");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, router]);

  if (loading || !paper) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <article className="max-w-2xl">
      <button
        onClick={() => router.back()}
        className="text-sm text-muted hover:text-ink mb-6 flex items-center gap-1"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <div className="flex items-center gap-3 mb-4">
        {paper.field && (
          <Badge color={paper.field.color}>{paper.field.name}</Badge>
        )}
        {paper.year && <span className="text-sm text-muted">{paper.year}</span>}
        {paper.venue && (
          <span className="text-sm text-muted italic">{paper.venue}</span>
        )}
      </div>

      <h1 className="font-serif text-2xl md:text-3xl font-bold leading-tight mb-4">
        {paper.title}
      </h1>

      <div className="flex flex-wrap gap-2 mb-6">
        {paper.authors.map((author, i) => (
          <span key={i} className="text-sm text-muted">
            {author.name}
            {author.affiliation && (
              <span className="text-xs text-muted/60 ml-1">
                ({author.affiliation})
              </span>
            )}
            {i < paper.authors.length - 1 && ","}
          </span>
        ))}
      </div>

      {paper.citationCount != null && paper.citationCount > 0 && (
        <p className="text-sm text-muted mb-6">
          {paper.citationCount.toLocaleString()} citations
        </p>
      )}

      {paper.abstract && (
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted mb-3">
            Abstract
          </h2>
          <p className="text-base leading-relaxed">{paper.abstract}</p>
        </div>
      )}

      <div className="flex gap-3">
        <Button
          size="lg"
          onClick={() => window.open(paper.fullPaperUrl, "_blank")}
        >
          Read Full Paper
        </Button>
        {paper.pdfUrl && (
          <Button
            size="lg"
            variant="outline"
            onClick={() => window.open(paper.pdfUrl!, "_blank")}
          >
            Download PDF
          </Button>
        )}
      </div>
    </article>
  );
}
