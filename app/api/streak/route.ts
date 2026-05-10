import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { streaks, streakDays, interactions } from "@/lib/db/schema";
import { requireDbUser } from "@/lib/auth/server";
import { toCalendarDate } from "@/lib/utils";
import { eq, and, sql, desc } from "drizzle-orm";

export async function GET() {
  try {
    const user = await requireDbUser();
    const today = toCalendarDate(new Date(), user.timezone ?? "UTC");

    const [streak] = await db
      .select()
      .from(streaks)
      .where(eq(streaks.userId, user.id));

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
    const goal = user.dailyGoal ?? 3;

    // Get recent streak days for calendar
    const recentDays = await db
      .select()
      .from(streakDays)
      .where(eq(streakDays.userId, user.id))
      .orderBy(desc(streakDays.date))
      .limit(90);

    return NextResponse.json({
      currentStreak: streak?.currentStreak ?? 0,
      longestStreak: streak?.longestStreak ?? 0,
      totalPapersRead: streak?.totalPapersRead ?? 0,
      totalDaysActive: streak?.totalDaysActive ?? 0,
      gracePeriodUsed: streak?.gracePeriodUsed ?? false,
      todayProgress: {
        read: todayReadCount,
        goal,
        goalMet: todayReadCount >= goal,
      },
      recentDays,
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
