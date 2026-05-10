"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn, truncate } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface PaperCardProps {
  paper: {
    id: string;
    title: string;
    aiSummary: string | null;
    abstract: string | null;
    year: number | null;
    citationCount: number | null;
    authors: { name: string }[];
    field: { name: string; color: string; slug: string } | null;
    isRead?: boolean;
  };
}

export function PaperCard({ paper }: PaperCardProps) {
  const router = useRouter();

  const authorText =
    paper.authors.length > 2
      ? `${paper.authors[0].name}, ${paper.authors[1].name} et al.`
      : paper.authors.map((a) => a.name).join(", ");

  const summary = paper.aiSummary ?? paper.abstract;

  return (
    <Card
      onClick={() => router.push(`/paper/${paper.id}`)}
      className={cn(
        "group relative",
        paper.isRead && "opacity-60"
      )}
    >
      {paper.isRead && (
        <div className="absolute top-3 right-3">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className="text-success"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      )}

      <div className="flex items-start gap-3 mb-3">
        {paper.field && (
          <Badge color={paper.field.color}>
            {paper.field.name.split(" / ")[0]}
          </Badge>
        )}
        {paper.year && (
          <span className="text-xs text-muted">{paper.year}</span>
        )}
        {paper.citationCount != null && paper.citationCount > 0 && (
          <span className="text-xs text-muted ml-auto">
            {paper.citationCount} citations
          </span>
        )}
      </div>

      <h3 className="font-serif text-lg font-semibold leading-snug mb-2 group-hover:text-accent transition-colors line-clamp-2">
        {paper.title}
      </h3>

      {authorText && (
        <p className="text-sm text-muted mb-3">{authorText}</p>
      )}

      {summary && (
        <p className="text-sm text-ink/70 leading-relaxed line-clamp-3">
          {summary}
        </p>
      )}
    </Card>
  );
}
