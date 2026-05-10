import { db } from "@/lib/db";
import {
  papers,
  interactions,
  dailyFeeds,
  userInterests,
} from "@/lib/db/schema";
import { eq, and, inArray, notInArray, desc, sql, isNotNull } from "drizzle-orm";

interface FeedOptions {
  userId: string;
  dailyGoal: number;
  today: string; // YYYY-MM-DD
}

export async function generateDailyFeed({ userId, dailyGoal, today }: FeedOptions) {
  // Check if already generated for today
  const existing = await db
    .select()
    .from(dailyFeeds)
    .where(and(eq(dailyFeeds.userId, userId), eq(dailyFeeds.feedDate, today)));

  if (existing.length > 0) {
    return existing;
  }

  // Get user interests
  const interests = await db
    .select()
    .from(userInterests)
    .where(eq(userInterests.userId, userId));

  if (interests.length === 0) {
    return [];
  }

  const fieldIds = interests.map((i) => i.fieldId);
  const weightMap = new Map(interests.map((i) => [i.fieldId, i.weight ?? 1.0]));

  // Get papers already read by user
  const readPaperIds = await db
    .select({ paperId: interactions.paperId })
    .from(interactions)
    .where(and(eq(interactions.userId, userId), eq(interactions.type, "read")));

  const excludeIds = readPaperIds.map((r) => r.paperId);

  // Fetch candidates
  const candidateQuery = db
    .select()
    .from(papers)
    .where(
      and(
        inArray(papers.fieldId, fieldIds),
        isNotNull(papers.abstract),
        excludeIds.length > 0
          ? notInArray(papers.id, excludeIds)
          : undefined
      )
    )
    .orderBy(desc(papers.qualityScore))
    .limit(30);

  const candidates = await candidateQuery;

  // Score and pick with field diversity
  const scored = candidates.map((paper) => ({
    ...paper,
    score:
      (paper.qualityScore ?? 0) * (weightMap.get(paper.fieldId!) ?? 1.0) +
      Math.random() * 0.1,
  }));

  scored.sort((a, b) => b.score - a.score);

  // Pick papers with max 2 per field
  const selected: typeof candidates = [];
  const fieldCounts = new Map<number, number>();

  for (const paper of scored) {
    if (selected.length >= dailyGoal) break;
    const fieldCount = fieldCounts.get(paper.fieldId!) ?? 0;
    if (fieldCount >= 2) continue;
    selected.push(paper);
    fieldCounts.set(paper.fieldId!, fieldCount + 1);
  }

  // Insert into daily_feeds
  const feedItems = selected.map((paper, idx) => ({
    userId,
    paperId: paper.id,
    feedDate: today,
    position: idx + 1,
    wasServed: true,
  }));

  if (feedItems.length > 0) {
    await db.insert(dailyFeeds).values(feedItems).onConflictDoNothing();
  }

  return feedItems;
}

interface EndlessFeedOptions {
  userId: string;
  cursor: string | null; // "qualityScore::publishedAt" composite
  limit: number;
  today: string;
}

export async function getEndlessFeed({
  userId,
  cursor,
  limit,
  today,
}: EndlessFeedOptions) {
  // Get user interests
  const interests = await db
    .select()
    .from(userInterests)
    .where(eq(userInterests.userId, userId));

  const fieldIds = interests.map((i) => i.fieldId);
  if (fieldIds.length === 0) return { papers: [], nextCursor: null };

  // Get already-read papers + today's daily feed papers
  const [readPapers, todayFeed] = await Promise.all([
    db
      .select({ paperId: interactions.paperId })
      .from(interactions)
      .where(and(eq(interactions.userId, userId), eq(interactions.type, "read"))),
    db
      .select({ paperId: dailyFeeds.paperId })
      .from(dailyFeeds)
      .where(and(eq(dailyFeeds.userId, userId), eq(dailyFeeds.feedDate, today))),
  ]);

  const excludeIds = [
    ...readPapers.map((r) => r.paperId),
    ...todayFeed.map((f) => f.paperId!),
  ].filter(Boolean) as string[];

  // Build query with cursor
  let query = db
    .select()
    .from(papers)
    .where(
      and(
        inArray(papers.fieldId, fieldIds),
        isNotNull(papers.abstract),
        excludeIds.length > 0 ? notInArray(papers.id, excludeIds) : undefined,
        cursor
          ? sql`(${papers.qualityScore}, ${papers.publishedAt}) < (${parseFloat(cursor.split("::")[0])}, ${cursor.split("::")[1]})`
          : undefined
      )
    )
    .orderBy(desc(papers.qualityScore), desc(papers.publishedAt))
    .limit(limit + 1); // fetch one extra to determine if there's more

  const results = await query;
  const hasMore = results.length > limit;
  const page = hasMore ? results.slice(0, limit) : results;

  const nextCursor = hasMore
    ? `${page[page.length - 1].qualityScore}::${page[page.length - 1].publishedAt?.toISOString()}`
    : null;

  return { papers: page, nextCursor };
}
