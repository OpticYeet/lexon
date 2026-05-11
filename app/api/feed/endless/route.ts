import { NextRequest, NextResponse } from "next/server";
import { requireDbUser } from "@/lib/auth/server";
import { getEndlessFeed } from "@/lib/feed/algorithm";
import { toCalendarDate } from "@/lib/utils";
import { db } from "@/lib/db";
import { papers, authors, paperAuthors, fields } from "@/lib/db/schema";
import { eq, and, inArray, sql } from "drizzle-orm";
import { interactions } from "@/lib/db/schema";

export async function GET(req: NextRequest) {
  try {
    const user = await requireDbUser();
    const today = toCalendarDate(new Date(), user.timezone ?? "UTC");

    const cursor = req.nextUrl.searchParams.get("cursor") || null;
    const limit = Math.min(
      parseInt(req.nextUrl.searchParams.get("limit") ?? "10"),
      20
    );

    const result = await getEndlessFeed({ userId: user.id, cursor, limit, today });

    if (result.papers.length === 0) {
      return NextResponse.json({ papers: [], nextCursor: null });
    }

    const paperIds = result.papers.map((p) => p.id);

    // Get authors and fields
    const paperFields = await db.select().from(fields);
    const fieldMap = new Map(paperFields.map((f) => [f.id, f]));

    const allAuthors = await db
      .select({
        paperId: paperAuthors.paperId,
        authorId: paperAuthors.authorId,
        position: paperAuthors.position,
        name: authors.name,
        affiliation: authors.affiliation,
      })
      .from(paperAuthors)
      .innerJoin(authors, eq(paperAuthors.authorId, authors.id))
      .where(inArray(paperAuthors.paperId, paperIds));

    const authorsByPaper = new Map<string, typeof allAuthors>();
    for (const a of allAuthors) {
      const existing = authorsByPaper.get(a.paperId) ?? [];
      existing.push(a);
      authorsByPaper.set(a.paperId, existing);
    }

    // Get user's liked and saved states for these papers
    const userLikes = await db
      .select({ paperId: interactions.paperId })
      .from(interactions)
      .where(
        and(
          eq(interactions.userId, user.id),
          eq(interactions.type, "liked"),
          inArray(interactions.paperId, paperIds)
        )
      );
    const likedSet = new Set(userLikes.map((l) => l.paperId));

    const userSaves = await db
      .select({ paperId: interactions.paperId })
      .from(interactions)
      .where(
        and(
          eq(interactions.userId, user.id),
          eq(interactions.type, "saved"),
          inArray(interactions.paperId, paperIds)
        )
      );
    const savedSet = new Set(userSaves.map((s) => s.paperId));

    const likeCounts = await db
      .select({
        paperId: interactions.paperId,
        count: sql<number>`count(*)`,
      })
      .from(interactions)
      .where(
        and(
          eq(interactions.type, "liked"),
          inArray(interactions.paperId, paperIds)
        )
      )
      .groupBy(interactions.paperId);
    const likeCountMap = new Map(likeCounts.map((l) => [l.paperId, Number(l.count)]));

    const enrichedPapers = result.papers.map((paper) => {
      const paperAuthorList = (authorsByPaper.get(paper.id) ?? [])
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
        .map((a) => ({ id: a.authorId, name: a.name, affiliation: a.affiliation }));
      return {
        ...paper,
        authors: paperAuthorList,
        field: fieldMap.get(paper.fieldId!) ?? null,
        isLiked: likedSet.has(paper.id),
        isSaved: savedSet.has(paper.id),
        likeCount: likeCountMap.get(paper.id) ?? 0,
      };
    });

    return NextResponse.json({
      papers: enrichedPapers,
      nextCursor: result.nextCursor,
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Endless feed error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
