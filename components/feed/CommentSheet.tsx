"use client";

import { useState, useEffect, useRef } from "react";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  displayName: string | null;
  avatarUrl: string | null;
}

interface CommentSheetProps {
  paperId: string;
  onClose: () => void;
}

export function CommentSheet({ paperId, onClose }: CommentSheetProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [posting, setPosting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`/api/papers/${paperId}/comments`)
      .then((r) => r.json())
      .then((data) => setComments(data.comments ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [paperId]);

  const handlePost = async () => {
    if (!newComment.trim() || posting) return;
    setPosting(true);
    try {
      const res = await fetch(`/api/papers/${paperId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment.trim() }),
      });
      const data = await res.json();
      if (data.comment) {
        setComments((prev) => [{ ...data.comment, displayName: "You", avatarUrl: null }, ...prev]);
        setNewComment("");
      }
    } catch (error) {
      console.error("Failed to post comment:", error);
    } finally {
      setPosting(false);
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "now";
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  return (
    <div className="fixed inset-0 z-[100]" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Sheet */}
      <div
        className="absolute bottom-0 left-0 right-0 bg-paper rounded-t-2xl max-h-[70vh] flex flex-col animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center py-3">
          <div className="w-10 h-1 rounded-full bg-ink/20" />
        </div>

        <div className="px-5 pb-2">
          <h3 className="font-semibold text-sm">
            Comments {comments.length > 0 && `(${comments.length})`}
          </h3>
        </div>

        {/* Comment list */}
        <div className="flex-1 overflow-y-auto px-5 pb-4">
          {loading ? (
            <div className="text-sm text-muted text-center py-8">Loading...</div>
          ) : comments.length === 0 ? (
            <div className="text-sm text-muted text-center py-8">
              No comments yet. Be the first!
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-ink/10 flex items-center justify-center flex-shrink-0">
                    {comment.avatarUrl ? (
                      <img
                        src={comment.avatarUrl}
                        alt=""
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <span className="text-xs font-medium text-muted">
                        {(comment.displayName ?? "?")[0]}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-medium">
                        {comment.displayName ?? "Anonymous"}
                      </span>
                      <span className="text-xs text-muted">
                        {timeAgo(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-ink/80 mt-0.5">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-border px-5 py-3 flex gap-2">
          <input
            ref={inputRef}
            type="text"
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handlePost()}
            maxLength={500}
            className="flex-1 px-3 py-2 bg-ink/5 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-accent"
          />
          <button
            onClick={handlePost}
            disabled={!newComment.trim() || posting}
            className="px-4 py-2 text-sm font-medium text-accent disabled:opacity-40 transition-opacity"
          >
            Post
          </button>
        </div>
      </div>
    </div>
  );
}
