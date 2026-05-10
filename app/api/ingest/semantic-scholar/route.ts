import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { papers, authors, paperAuthors, fields } from "@/lib/db/schema";
import { searchPapers, S2_FIELD_QUERIES } from "@/lib/api/semantic-scholar";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allFields = await db.select().from(fields);
  const fieldMap = new Map(allFields.map((f) => [f.slug, f.id]));

  let totalIngested = 0;

  for (const [fieldSlug, queries] of Object.entries(S2_FIELD_QUERIES)) {
    const fieldId = fieldMap.get(fieldSlug);
    if (!fieldId) continue;

    for (const query of queries) {
      try {
        const s2Papers = await searchPapers(query, 20);

        for (const paper of s2Papers) {
          if (paper.citationCount < 1) continue; // quality filter

          const qualityScore = computeQualityScore(
            paper.citationCount,
            paper.influentialCitationCount,
            paper.year
          );

          const [inserted] = await db
            .insert(papers)
            .values({
              externalId: paper.externalId,
              source: "semantic_scholar",
              title: paper.title,
              abstract: paper.abstract,
              fullPaperUrl: paper.fullPaperUrl,
              pdfUrl: paper.pdfUrl,
              fieldId,
              year: paper.year,
              citationCount: paper.citationCount,
              influentialCitations: paper.influentialCitationCount,
              venue: paper.venue,
              isOpenAccess: paper.isOpenAccess,
              qualityScore,
            })
            .onConflictDoNothing()
            .returning();

          if (inserted) {
            for (let i = 0; i < paper.authors.length; i++) {
              const [author] = await db
                .insert(authors)
                .values({
                  name: paper.authors[i].name,
                  externalId: paper.authors[i].authorId ?? null,
                })
                .onConflictDoNothing()
                .returning();

              if (author) {
                await db
                  .insert(paperAuthors)
                  .values({
                    paperId: inserted.id,
                    authorId: author.id,
                    position: i + 1,
                  })
                  .onConflictDoNothing();
              }
            }
            totalIngested++;
          }
        }

        // Respect S2 rate limits
        await new Promise((r) => setTimeout(r, 1100));
      } catch (error) {
        console.error(`Error ingesting "${query}":`, error);
      }
    }
  }

  return NextResponse.json({ ingested: totalIngested });
}

function computeQualityScore(
  citations: number,
  influential: number,
  year: number | null
): number {
  const citScore = Math.log(1 + citations) * 0.4;
  const infScore = Math.log(1 + influential) * 0.4;
  const currentYear = new Date().getFullYear();
  const age = year ? currentYear - year : 5;
  const recencyScore = Math.max(0.1, 1.0 - age * 0.18) * 0.2;
  return citScore + infScore + recencyScore;
}
