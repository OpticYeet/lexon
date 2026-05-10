import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { papers, authors, paperAuthors, fields } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [paper] = await db.select().from(papers).where(eq(papers.id, id));
  if (!paper) {
    return NextResponse.json({ error: "Paper not found" }, { status: 404 });
  }

  // Get field
  const [field] = paper.fieldId
    ? await db.select().from(fields).where(eq(fields.id, paper.fieldId))
    : [null];

  // Get authors
  const paperAuthorList = await db
    .select({
      name: authors.name,
      affiliation: authors.affiliation,
      position: paperAuthors.position,
    })
    .from(paperAuthors)
    .innerJoin(authors, eq(paperAuthors.authorId, authors.id))
    .where(eq(paperAuthors.paperId, id))
    .orderBy(paperAuthors.position);

  return NextResponse.json({
    ...paper,
    field,
    authors: paperAuthorList,
  });
}
