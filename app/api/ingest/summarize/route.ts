import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { papers, fields } from "@/lib/db/schema";
import { generatePaperSummary } from "@/lib/api/claude";
import { eq, and, isNull, isNotNull, desc } from "drizzle-orm";
import crypto from "crypto";

function verifyCronSecret(secret: string | null): boolean {
  const expected = process.env.CRON_SECRET;
  if (!secret || !expected) return false;
  const a = Buffer.from(secret);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  if (!verifyCronSecret(req.headers.get("x-cron-secret"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get papers without summaries, ordered by quality score
  const papersToSummarize = await db
    .select({
      id: papers.id,
      title: papers.title,
      abstract: papers.abstract,
      fieldId: papers.fieldId,
    })
    .from(papers)
    .where(and(isNull(papers.aiSummary), isNotNull(papers.abstract)))
    .orderBy(desc(papers.qualityScore))
    .limit(10);

  const allFields = await db.select().from(fields);
  const fieldMap = new Map(allFields.map((f) => [f.id, f.name]));

  let summarized = 0;

  // Process in parallel batches of 3 to stay within timeout
  const CONCURRENCY = 3;
  for (let i = 0; i < papersToSummarize.length; i += CONCURRENCY) {
    const batch = papersToSummarize.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(
      batch.map(async (paper) => {
        if (!paper.abstract) return;
        const fieldName = fieldMap.get(paper.fieldId!) ?? "Science";
        const summary = await generatePaperSummary(
          paper.title,
          paper.abstract,
          fieldName
        );
        await db
          .update(papers)
          .set({ aiSummary: summary, aiSummaryAt: new Date() })
          .where(eq(papers.id, paper.id));
        return true;
      })
    );
    for (const r of results) {
      if (r.status === "fulfilled" && r.value) summarized++;
      if (r.status === "rejected") console.error("Summarize error:", r.reason);
    }
  }

  return NextResponse.json({ summarized });
}
