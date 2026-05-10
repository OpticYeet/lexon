"use client";

import { useEffect, useState } from "react";
import { useUser, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

  useEffect(() => {
    Promise.all([
      fetch("/api/users/interests").then((r) => r.json()),
      fetch("/api/users/me").then((r) => r.json()),
    ]).then(([interestsData, userData]) => {
      setInterests(interestsData.map((i: any) => i.fieldId));
      setDailyGoal(userData.dailyGoal ?? 3);
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
    </div>
  );
}
