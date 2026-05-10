import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { papers, authors, paperAuthors, fields } from "@/lib/db/schema";
import { fetchArxivPapers, ARXIV_CATEGORIES } from "@/lib/api/arxiv";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allFields = await db.select().from(fields);
  const fieldMap = new Map(allFields.map((f) => [f.slug, f.id]));

  let totalIngested = 0;

  for (const [fieldSlug, categories] of Object.entries(ARXIV_CATEGORIES)) {
    const fieldId = fieldMap.get(fieldSlug);
    if (!fieldId) continue;

    for (const category of categories) {
      try {
        const arxivPapers = await fetchArxivPapers(category, 20);

        for (const paper of arxivPapers) {
          // Insert paper
          const [inserted] = await db
            .insert(papers)
            .values({
              externalId: paper.externalId,
              source: "arxiv",
              title: paper.title,
              abstract: paper.abstract,
              fullPaperUrl: paper.fullPaperUrl,
              pdfUrl: paper.pdfUrl,
              fieldId,
              subFields: paper.categories.slice(0, 5),
              year: new Date(paper.publishedAt).getFullYear(),
              publishedAt: new Date(paper.publishedAt),
              isOpenAccess: true,
              qualityScore: 0.5, // default, recomputed later
            })
            .onConflictDoNothing()
            .returning();

          if (inserted) {
            // Insert authors
            for (let i = 0; i < paper.authors.length; i++) {
              const [author] = await db
                .insert(authors)
                .values({ name: paper.authors[i].name })
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

        // Rate limit: arXiv asks for 3 second delay between requests
        await new Promise((r) => setTimeout(r, 3000));
      } catch (error) {
        console.error(`Error ingesting ${category}:`, error);
      }
    }
  }

  return NextResponse.json({ ingested: totalIngested });
}
