import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { papers, authors, paperAuthors, fields } from "@/lib/db/schema";
import { eq, ilike, desc, and, inArray } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const q = searchParams.get("q");
  const field = searchParams.get("field");
  const sort = searchParams.get("sort") ?? "quality";
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50);
  const offset = parseInt(searchParams.get("offset") ?? "0");

  const conditions = [];
  if (q) {
    conditions.push(ilike(papers.title, `%${q}%`));
  }
  if (field) {
    const [fieldRow] = await db.select().from(fields).where(eq(fields.slug, field));
    if (fieldRow) {
      conditions.push(eq(papers.fieldId, fieldRow.id));
    }
  }

  const orderBy =
    sort === "recent" ? desc(papers.publishedAt) :
    sort === "citations" ? desc(papers.citationCount) :
    desc(papers.qualityScore);

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const results = await db
    .select()
    .from(papers)
    .where(where)
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset);

  // Get fields and authors
  const allFields = await db.select().from(fields);
  const fieldMap = new Map(allFields.map((f) => [f.id, f]));

  const paperIds = results.map((p) => p.id);
  const allAuthors = paperIds.length > 0
    ? await db
        .select({
          paperId: paperAuthors.paperId,
          name: authors.name,
          position: paperAuthors.position,
        })
        .from(paperAuthors)
        .innerJoin(authors, eq(paperAuthors.authorId, authors.id))
        .where(inArray(paperAuthors.paperId, paperIds))
    : [];

  const authorsByPaper = new Map<string, { name: string; position: number | null }[]>();
  for (const a of allAuthors) {
    const list = authorsByPaper.get(a.paperId) ?? [];
    list.push({ name: a.name, position: a.position });
    authorsByPaper.set(a.paperId, list);
  }

  const enriched = results.map((paper) => ({
    ...paper,
    field: fieldMap.get(paper.fieldId!) ?? null,
    authors: (authorsByPaper.get(paper.id) ?? [])
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      .map((a) => a.name),
  }));

  return NextResponse.json({ papers: enriched, total: enriched.length });
}
