import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  papers,
  authors,
  paperAuthors,
  fields,
  dailyFeeds,
  interactions,
  streaks,
} from "@/lib/db/schema";
import { requireDbUser } from "@/lib/auth/server";
import { generateDailyFeed } from "@/lib/feed/algorithm";
import { toCalendarDate } from "@/lib/utils";
import { eq, and, inArray, sql } from "drizzle-orm";

export async function GET() {
  try {
    const user = await requireDbUser();
    const today = toCalendarDate(new Date(), user.timezone ?? "UTC");

    // Generate feed if needed
    await generateDailyFeed({
      userId: user.id,
      dailyGoal: user.dailyGoal ?? 3,
      today,
    });

    // Fetch today's feed with full paper data
    const feedItems = await db
      .select()
      .from(dailyFeeds)
      .where(and(eq(dailyFeeds.userId, user.id), eq(dailyFeeds.feedDate, today)))
      .orderBy(dailyFeeds.position);

    const paperIds = feedItems.map((f) => f.paperId).filter(Boolean) as string[];
    if (paperIds.length === 0) {
      return NextResponse.json({ papers: [], progress: { read: 0, goal: user.dailyGoal ?? 3, streakActive: false } });
    }

    // Get papers with authors and fields
    const feedPapers = await db
      .select()
      .from(papers)
      .where(inArray(papers.id, paperIds));

    const paperFields = await db.select().from(fields);
    const fieldMap = new Map(paperFields.map((f) => [f.id, f]));

    // Get authors for each paper
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

    // Get today's reads — filter at SQL level to avoid loading entire history
    const todayReads = await db
      .select({ paperId: interactions.paperId })
      .from(interactions)
      .where(
        and(
          eq(interactions.userId, user.id),
          eq(interactions.type, "read"),
          sql`DATE(${interactions.interactionAt} AT TIME ZONE ${user.timezone ?? "UTC"}) = ${today}`
        )
      );

    const todayReadPaperIds = new Set(todayReads.map((i) => i.paperId));

    // Get streak
    const [streak] = await db
      .select()
      .from(streaks)
      .where(eq(streaks.userId, user.id));

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

    // Get like counts per paper
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

    // Build response ordered by feed position
    const orderedPapers = feedItems
      .map((fi) => {
        const paper = feedPapers.find((p) => p.id === fi.paperId);
        if (!paper) return null;
        const paperAuthorList = (authorsByPaper.get(paper.id) ?? [])
          .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
          .map((a) => ({ id: a.authorId, name: a.name, affiliation: a.affiliation }));
        return {
          ...paper,
          authors: paperAuthorList,
          field: fieldMap.get(paper.fieldId!) ?? null,
          isRead: todayReadPaperIds.has(paper.id),
          isLiked: likedSet.has(paper.id),
          isSaved: savedSet.has(paper.id),
          likeCount: likeCountMap.get(paper.id) ?? 0,
        };
      })
      .filter(Boolean);

    return NextResponse.json({
      papers: orderedPapers,
      progress: {
        read: todayReadPaperIds.size,
        goal: user.dailyGoal ?? 3,
        streakActive: (streak?.currentStreak ?? 0) > 0,
      },
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Feed error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
