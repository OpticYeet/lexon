"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CommentSheet } from "@/components/feed/CommentSheet";

interface SwipeCardProps {
  paper: {
    id: string;
    title: string;
    aiSummary: string | null;
    abstract: string | null;
    year: number | null;
    citationCount: number | null;
    fullPaperUrl: string;
    authors: { name: string }[];
    field: { name: string; color: string; slug: string } | null;
  };
  isActive: boolean;
}

export function SwipeCard({ paper, isActive }: SwipeCardProps) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [saved, setSaved] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [likeAnimating, setLikeAnimating] = useState(false);

  const summary = paper.abstract ?? paper.aiSummary;
  const authorText =
    paper.authors.length > 3
      ? `${paper.authors[0].name}, ${paper.authors[1].name}, +${paper.authors.length - 2} more`
      : paper.authors.map((a) => a.name).join(", ");

  const handleLike = async () => {
    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount((c) => (newLiked ? c + 1 : Math.max(0, c - 1)));
    if (newLiked) {
      setLikeAnimating(true);
      setTimeout(() => setLikeAnimating(false), 600);
    }

    await fetch(`/api/papers/${paper.id}/like`, {
      method: newLiked ? "POST" : "DELETE",
    }).catch(() => {});
  };

  const handleSave = async () => {
    const newSaved = !saved;
    setSaved(newSaved);
    await fetch(`/api/papers/${paper.id}/save`, {
      method: newSaved ? "POST" : "DELETE",
    }).catch(() => {});
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: paper.title,
        url: paper.fullPaperUrl,
      }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(paper.fullPaperUrl);
    }
  };

  return (
    <>
      <div className="h-screen w-full snap-start flex items-center justify-center relative px-6 md:px-12">
        {/* Main content */}
        <div className="max-w-lg w-full">
          {/* Field badge + year */}
          <div className="flex items-center gap-3 mb-4">
            {paper.field && (
              <Badge color={paper.field.color}>
                {paper.field.name.split(" / ")[0]}
              </Badge>
            )}
            {paper.year && (
              <span className="text-xs text-muted">{paper.year}</span>
            )}
            {paper.citationCount != null && paper.citationCount > 0 && (
              <span className="text-xs text-muted">
                {paper.citationCount.toLocaleString()} citations
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="font-serif text-2xl md:text-3xl font-bold leading-tight mb-4">
            {paper.title}
          </h1>

          {/* Authors */}
          {authorText && (
            <p className="text-sm text-muted mb-6">{authorText}</p>
          )}

          {/* Abstract / Summary */}
          {summary && (
            <p className="text-base leading-relaxed text-ink/80 line-clamp-6 md:line-clamp-none">
              {summary}
            </p>
          )}

          {/* Read full paper link */}
          <a
            href={paper.fullPaperUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-6 text-accent font-medium text-sm hover:underline"
          >
            Read full paper
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
            </svg>
          </a>
        </div>

        {/* Action bar — right side, vertical, like TikTok */}
        <div className="absolute right-4 md:right-8 bottom-1/3 flex flex-col items-center gap-6">
          {/* Like */}
          <button onClick={handleLike} className="flex flex-col items-center gap-1">
            <div
              className={cn(
                "w-11 h-11 rounded-full flex items-center justify-center transition-all",
                liked ? "bg-red-50" : "bg-ink/5 hover:bg-ink/10",
                likeAnimating && "scale-125"
              )}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill={liked ? "#EF4444" : "none"}
                stroke={liked ? "#EF4444" : "currentColor"}
                strokeWidth="2"
                className="transition-all"
              >
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
              </svg>
            </div>
            <span className="text-xs text-muted tabular-nums">
              {likeCount > 0 ? likeCount : ""}
            </span>
          </button>

          {/* Comment */}
          <button onClick={() => setShowComments(true)} className="flex flex-col items-center gap-1">
            <div className="w-11 h-11 rounded-full bg-ink/5 hover:bg-ink/10 flex items-center justify-center transition-all">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
            </div>
            <span className="text-xs text-muted"></span>
          </button>

          {/* Share */}
          <button onClick={handleShare} className="flex flex-col items-center gap-1">
            <div className="w-11 h-11 rounded-full bg-ink/5 hover:bg-ink/10 flex items-center justify-center transition-all">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
              </svg>
            </div>
          </button>

          {/* Save */}
          <button onClick={handleSave} className="flex flex-col items-center gap-1">
            <div
              className={cn(
                "w-11 h-11 rounded-full flex items-center justify-center transition-all",
                saved ? "bg-accent/10" : "bg-ink/5 hover:bg-ink/10"
              )}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill={saved ? "var(--accent)" : "none"}
                stroke={saved ? "var(--accent)" : "currentColor"}
                strokeWidth="2"
              >
                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
              </svg>
            </div>
          </button>
        </div>

        {/* Scroll hint at bottom */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-40">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </div>

      {/* Comments sheet */}
      {showComments && (
        <CommentSheet paperId={paper.id} onClose={() => setShowComments(false)} />
      )}
    </>
  );
}
