import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { interactions, papers, authors, paperAuthors, fields } from "@/lib/db/schema";
import { requireDbUser } from "@/lib/auth/server";
import { eq, and, desc, inArray } from "drizzle-orm";

export async function GET() {
  try {
    const user = await requireDbUser();

    const saved = await db
      .select({
        id: papers.id,
        title: papers.title,
        fullPaperUrl: papers.fullPaperUrl,
        year: papers.year,
        fieldName: fields.name,
        fieldColor: fields.color,
      })
      .from(interactions)
      .innerJoin(papers, eq(interactions.paperId, papers.id))
      .leftJoin(fields, eq(papers.fieldId, fields.id))
      .where(
        and(
          eq(interactions.userId, user.id),
          eq(interactions.type, "saved")
        )
      )
      .orderBy(desc(interactions.interactionAt))
      .limit(50);

    const paperIds = saved.map((s) => s.id);
    let authorMap: Record<string, { name: string }[]> = {};

    if (paperIds.length > 0) {
      const authorsResult = await db
        .select({
          paperId: paperAuthors.paperId,
          name: authors.name,
        })
        .from(paperAuthors)
        .innerJoin(authors, eq(paperAuthors.authorId, authors.id))
        .where(inArray(paperAuthors.paperId, paperIds));

      for (const a of authorsResult) {
        if (!authorMap[a.paperId]) authorMap[a.paperId] = [];
        authorMap[a.paperId].push({ name: a.name });
      }
    }

    const result = saved.map((s) => ({
      id: s.id,
      title: s.title,
      fullPaperUrl: s.fullPaperUrl,
      year: s.year,
      field: s.fieldName ? { name: s.fieldName, color: s.fieldColor ?? "#666" } : null,
      authors: authorMap[s.id] ?? [],
    }));

    return NextResponse.json({ papers: result });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
