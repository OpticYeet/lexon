"use client";

import { useEffect, useState } from "react";
import { useUser, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SavedPaper {
  id: string;
  title: string;
  fullPaperUrl: string;
  year: number | null;
  field: { name: string; color: string } | null;
  authors: { name: string }[];
}

const FIELDS = [
  { id: 1, name: "Biology", color: "#4A7C59" },
  { id: 2, name: "Physics", color: "#2B5F8E" },
  { id: 3, name: "Chemistry", color: "#8B5E3C" },
  { id: 4, name: "Mathematics", color: "#7B5EA7" },
  { id: 5, name: "Computer Science", color: "#C4622D" },
  { id: 6, name: "Economics", color: "#2A7A6B" },
  { id: 7, name: "Psychology", color: "#9B4D6E" },
  { id: 8, name: "Environment", color: "#3D7A45" },
  { id: 9, name: "Medicine", color: "#C14B4B" },
  { id: 10, name: "Philosophy", color: "#6B6B3D" },
];

export default function ProfilePage() {
  const { user } = useUser();
  const [interests, setInterests] = useState<number[]>([]);
  const [dailyGoal, setDailyGoal] = useState(3);
  const [saving, setSaving] = useState(false);
  const [savedPapers, setSavedPapers] = useState<SavedPaper[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/users/interests").then((r) => r.json()),
      fetch("/api/users/me").then((r) => r.json()),
      fetch("/api/users/saved").then((r) => r.json()),
    ]).then(([interestsData, userData, saved]) => {
      setInterests(interestsData.map((i: any) => i.fieldId));
      setDailyGoal(userData.dailyGoal ?? 3);
      setSavedPapers(saved.papers ?? []);
      setLoadingSaved(false);
    });
  }, []);

  const toggleField = (id: number) => {
    setInterests((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const save = async () => {
    setSaving(true);
    await Promise.all([
      fetch("/api/users/interests", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fieldIds: interests }),
      }),
      fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dailyGoal }),
      }),
    ]);
    setSaving(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-2xl font-bold">Profile</h1>
        <UserButton />
      </div>

      <div className="mb-8">
        <h2 className="text-sm font-semibold mb-3">Daily Goal</h2>
        <div className="flex gap-3">
          {[3, 5].map((goal) => (
            <button
              key={goal}
              onClick={() => setDailyGoal(goal)}
              className={cn(
                "px-4 py-2 rounded-lg border-2 text-sm font-medium transition-colors",
                dailyGoal === goal
                  ? "border-accent text-accent"
                  : "border-border text-muted hover:border-ink/20"
              )}
            >
              {goal} papers/day
            </button>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-sm font-semibold mb-3">Interests</h2>
        <div className="flex flex-wrap gap-2">
          {FIELDS.map((field) => {
            const isSelected = interests.includes(field.id);
            return (
              <button
                key={field.id}
                onClick={() => toggleField(field.id)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-all",
                  isSelected
                    ? "border-current"
                    : "border-border text-muted hover:border-ink/20"
                )}
                style={isSelected ? { borderColor: field.color, color: field.color } : undefined}
              >
                {field.name}
              </button>
            );
          })}
        </div>
      </div>

      <Button onClick={save} disabled={saving || interests.length < 1}>
        {saving ? "Saving..." : "Save Changes"}
      </Button>

      {/* Saved Papers */}
      <div className="mt-12 border-t border-border pt-8">
        <h2 className="font-serif text-xl font-bold mb-4">Saved Papers</h2>
        {loadingSaved ? (
          <p className="text-sm text-muted">Loading...</p>
        ) : savedPapers.length === 0 ? (
          <p className="text-sm text-muted">No saved papers yet. Bookmark papers from the feed to see them here.</p>
        ) : (
          <div className="space-y-3">
            {savedPapers.map((paper) => (
              <a
                key={paper.id}
                href={paper.fullPaperUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-4 rounded-xl border border-border hover:border-accent/30 hover:bg-card-hover transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-serif font-semibold text-sm leading-snug mb-1 line-clamp-2">
                      {paper.title}
                    </h3>
                    <p className="text-xs text-muted truncate">
                      {paper.authors.map((a) => a.name).slice(0, 3).join(", ")}
                      {paper.authors.length > 3 && ` +${paper.authors.length - 3}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {paper.field && (
                      <Badge color={paper.field.color}>{paper.field.name.split(" / ")[0]}</Badge>
                    )}
                    {paper.year && <span className="text-xs text-muted">{paper.year}</span>}
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
