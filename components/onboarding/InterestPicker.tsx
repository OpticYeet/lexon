"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

const FIELDS = [
  { id: 1, slug: "biology", name: "Biology", icon: "🧬", color: "#4A7C59" },
  { id: 2, slug: "physics", name: "Physics", icon: "⚛️", color: "#2B5F8E" },
  { id: 3, slug: "chemistry", name: "Chemistry", icon: "🧪", color: "#8B5E3C" },
  { id: 4, slug: "mathematics", name: "Mathematics", icon: "∑", color: "#7B5EA7" },
  { id: 5, slug: "cs-ai", name: "Computer Science", icon: "🖥️", color: "#C4622D" },
  { id: 6, slug: "economics", name: "Economics", icon: "📊", color: "#2A7A6B" },
  { id: 7, slug: "psychology", name: "Psychology", icon: "🧠", color: "#9B4D6E" },
  { id: 8, slug: "environment", name: "Environment", icon: "🌍", color: "#3D7A45" },
  { id: 9, slug: "medicine", name: "Medicine", icon: "❤️", color: "#C14B4B" },
  { id: 10, slug: "philosophy", name: "Philosophy", icon: "💡", color: "#6B6B3D" },
];

const DAILY_GOALS = [
  { value: 3, label: "3 papers", description: "Casual — ~5 minutes" },
  { value: 5, label: "5 papers", description: "Dedicated — ~10 minutes" },
];

export function InterestPicker() {
  const router = useRouter();
  const [selectedFields, setSelectedFields] = useState<number[]>([]);
  const [dailyGoal, setDailyGoal] = useState(3);
  const [step, setStep] = useState<"interests" | "frequency">("interests");
  const [saving, setSaving] = useState(false);

  const toggleField = (id: number) => {
    setSelectedFields((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      await Promise.all([
        fetch("/api/users/interests", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fieldIds: selectedFields }),
        }),
        fetch("/api/users/me", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dailyGoal, onboardingDone: true }),
        }),
      ]);
      router.push("/dashboard");
    } catch (error) {
      console.error("Onboarding error:", error);
    } finally {
      setSaving(false);
    }
  };

  if (step === "interests") {
    return (
      <div className="max-w-lg mx-auto text-center">
        <h1 className="font-serif text-3xl font-bold mb-3">
          What are you curious about?
        </h1>
        <p className="text-muted mb-8">
          Select at least 2 fields. We&rsquo;ll curate papers based on your interests.
        </p>

        <div className="grid grid-cols-2 gap-3 mb-8">
          {FIELDS.map((field) => {
            const isSelected = selectedFields.includes(field.id);
            return (
              <button
                key={field.id}
                onClick={() => toggleField(field.id)}
                className={cn(
                  "flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 text-left",
                  isSelected
                    ? "border-current shadow-sm scale-[1.02]"
                    : "border-border hover:border-ink/20"
                )}
                style={isSelected ? { borderColor: field.color, color: field.color } : undefined}
              >
                <span className="text-2xl">{field.icon}</span>
                <span className={cn("font-medium text-sm", isSelected ? "" : "text-ink")}>
                  {field.name}
                </span>
              </button>
            );
          })}
        </div>

        <Button
          size="lg"
          disabled={selectedFields.length < 2}
          onClick={() => setStep("frequency")}
          className="w-full"
        >
          Continue ({selectedFields.length} selected)
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto text-center">
      <h1 className="font-serif text-3xl font-bold mb-3">
        How much do you want to read?
      </h1>
      <p className="text-muted mb-8">
        Set your daily goal. You can always read more — this just sets your streak target.
      </p>

      <div className="space-y-3 mb-8">
        {DAILY_GOALS.map((goal) => (
          <button
            key={goal.value}
            onClick={() => setDailyGoal(goal.value)}
            className={cn(
              "w-full p-4 rounded-xl border-2 transition-all duration-200 text-left",
              dailyGoal === goal.value
                ? "border-accent bg-accent/5"
                : "border-border hover:border-ink/20"
            )}
          >
            <span className="font-semibold">{goal.label}</span>
            <span className="text-sm text-muted ml-2">{goal.description}</span>
          </button>
        ))}
      </div>

      <Button
        size="lg"
        onClick={handleComplete}
        disabled={saving}
        className="w-full"
      >
        {saving ? "Setting up..." : "Start reading"}
      </Button>
    </div>
  );
}
