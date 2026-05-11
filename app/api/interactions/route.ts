import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { interactions, streaks, streakDays, papers } from "@/lib/db/schema";
import { requireDbUser } from "@/lib/auth/server";
import { toCalendarDate } from "@/lib/utils";
import { checkAndUpdateStreak, StreakState } from "@/lib/streak/engine";
import { eq, and, sql } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const user = await requireDbUser();
    const body = await req.json();
    const { paperId, type, readPct } = body;

    if (!paperId || !type) {
      return NextResponse.json(
        { error: "paperId and type are required" },
        { status: 400 }
      );
    }

    if (!["read", "saved", "skipped", "shared", "liked"].includes(type)) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    // Verify paper exists
    const [paper] = await db
      .select({ id: papers.id })
      .from(papers)
      .where(eq(papers.id, paperId))
      .limit(1);

    if (!paper) {
      return NextResponse.json({ error: "Paper not found" }, { status: 404 });
    }

    // Upsert interaction
    await db
      .insert(interactions)
      .values({
        userId: user.id,
        paperId,
        type,
        readPct: readPct ?? null,
      })
      .onConflictDoNothing();

    // If read, check streak
    if (type === "read") {
      const today = toCalendarDate(new Date(), user.timezone ?? "UTC");

      // Count today's reads
      const todayReads = await db
        .select({ count: sql<number>`count(*)` })
        .from(interactions)
        .where(
          and(
            eq(interactions.userId, user.id),
            eq(interactions.type, "read"),
            sql`DATE(${interactions.interactionAt} AT TIME ZONE ${user.timezone ?? "UTC"}) = ${today}`
          )
        );

      const todayReadCount = Number(todayReads[0]?.count ?? 0);

      // Get current streak state
      const [currentStreak] = await db
        .select()
        .from(streaks)
        .where(eq(streaks.userId, user.id));

      if (currentStreak) {
        const streakState: StreakState = {
          currentStreak: currentStreak.currentStreak ?? 0,
          longestStreak: currentStreak.longestStreak ?? 0,
          lastActiveDate: currentStreak.lastActiveDate,
          gracePeriodUsed: currentStreak.gracePeriodUsed ?? false,
          totalPapersRead: currentStreak.totalPapersRead ?? 0,
          totalDaysActive: currentStreak.totalDaysActive ?? 0,
        };

        const result = checkAndUpdateStreak(
          streakState,
          today,
          todayReadCount,
          user.dailyGoal ?? 3
        );

        if (result.streakIncremented || result.newState.totalPapersRead !== streakState.totalPapersRead) {
          await db
            .update(streaks)
            .set({
              currentStreak: result.newState.currentStreak,
              longestStreak: result.newState.longestStreak,
              lastActiveDate: result.newState.lastActiveDate,
              gracePeriodUsed: result.newState.gracePeriodUsed,
              totalPapersRead: result.newState.totalPapersRead,
              totalDaysActive: result.newState.totalDaysActive,
              updatedAt: new Date(),
            })
            .where(eq(streaks.userId, user.id));

          // Upsert streak day — update count if row already exists
          await db
            .insert(streakDays)
            .values({
              userId: user.id,
              date: today,
              papersRead: todayReadCount,
              goalMet: todayReadCount >= (user.dailyGoal ?? 3),
            })
            .onConflictDoUpdate({
              target: [streakDays.userId, streakDays.date],
              set: {
                papersRead: todayReadCount,
                goalMet: todayReadCount >= (user.dailyGoal ?? 3),
              },
            });
        }

        return NextResponse.json({
          success: true,
          streak: result.newState,
          milestoneReached: result.milestoneReached,
          goalMet: todayReadCount >= (user.dailyGoal ?? 3),
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Interaction error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
