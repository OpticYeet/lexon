import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const FIELD_PILLS = [
  { name: "Biology", color: "#4A7C59" },
  { name: "Physics", color: "#2B5F8E" },
  { name: "CS / AI", color: "#C4622D" },
  { name: "Economics", color: "#2A7A6B" },
  { name: "Psychology", color: "#9B4D6E" },
  { name: "Medicine", color: "#C14B4B" },
  { name: "Mathematics", color: "#7B5EA7" },
  { name: "Chemistry", color: "#8B5E3C" },
];

export default async function LandingPage() {
  const { userId } = await auth();
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <span className="font-serif text-2xl font-bold text-accent">Lexon</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/sign-in">
            <Button variant="ghost" size="sm">
              Sign in
            </Button>
          </Link>
          <Link href="/sign-up">
            <Button size="sm">Get started</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center max-w-3xl mx-auto">
        <div className="mb-6 flex flex-wrap justify-center gap-2">
          {FIELD_PILLS.map((field) => (
            <span
              key={field.name}
              className="text-xs font-medium px-3 py-1 rounded-full"
              style={{ backgroundColor: `${field.color}12`, color: field.color }}
            >
              {field.name}
            </span>
          ))}
        </div>

        <h1 className="font-serif text-4xl md:text-6xl font-bold leading-tight mb-6">
          Stay curious.
          <br />
          <span className="text-accent">Stay sharp.</span>
        </h1>

        <p className="text-lg text-muted max-w-xl mb-8 leading-relaxed">
          Read 3 scientific papers a day in plain English. Build a streak,
          discover breakthroughs across fields, and never stop learning.
        </p>

        <Link href="/sign-up">
          <Button size="lg" className="text-base px-8">
            Start reading — it&rsquo;s free
          </Button>
        </Link>

        <p className="text-xs text-muted mt-4">
          No credit card required. Papers from arXiv and Semantic Scholar.
        </p>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 text-left w-full">
          <div className="p-6 rounded-xl border border-border bg-card">
            <div className="text-2xl mb-3">📑</div>
            <h3 className="font-semibold mb-1">AI Summaries</h3>
            <p className="text-sm text-muted">
              Every paper distilled into 3-4 sentences of plain English.
              No jargon without explanation.
            </p>
          </div>
          <div className="p-6 rounded-xl border border-border bg-card">
            <div className="text-2xl mb-3">🔥</div>
            <h3 className="font-semibold mb-1">Daily Streaks</h3>
            <p className="text-sm text-muted">
              Build a reading habit with streak tracking, grace periods,
              and milestone badges.
            </p>
          </div>
          <div className="p-6 rounded-xl border border-border bg-card">
            <div className="text-2xl mb-3">∞</div>
            <h3 className="font-semibold mb-1">Endless Feed</h3>
            <p className="text-sm text-muted">
              After your daily papers, keep scrolling through an infinite
              feed of curated research.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-8 text-xs text-muted">
        <p>Lexon — Scientific paper discovery for the curious mind.</p>
      </footer>
    </div>
  );
}
