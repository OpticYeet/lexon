import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { papers, fields } from "@/lib/db/schema";
import { generatePaperSummary } from "@/lib/api/claude";
import { eq, and, isNull, isNotNull, desc } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
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
    .limit(50);

  const allFields = await db.select().from(fields);
  const fieldMap = new Map(allFields.map((f) => [f.id, f.name]));

  let summarized = 0;

  for (const paper of papersToSummarize) {
    if (!paper.abstract) continue;

    try {
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

      summarized++;
    } catch (error) {
      console.error(`Error summarizing paper ${paper.id}:`, error);
    }
  }

  return NextResponse.json({ summarized });
}
