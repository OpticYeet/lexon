import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { interactions, papers } from "@/lib/db/schema";
import { requireDbUser } from "@/lib/auth/server";
import { and, eq, sql } from "drizzle-orm";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireDbUser();
    const { id: paperId } = await params;

    const [paper] = await db
      .select({ id: papers.id })
      .from(papers)
      .where(eq(papers.id, paperId))
      .limit(1);

    if (!paper) {
      return NextResponse.json({ error: "Paper not found" }, { status: 404 });
    }

    await db
      .insert(interactions)
      .values({ userId: user.id, paperId, type: "liked" })
      .onConflictDoNothing();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireDbUser();
    const { id: paperId } = await params;

    await db
      .delete(interactions)
      .where(
        and(
          eq(interactions.userId, user.id),
          eq(interactions.paperId, paperId),
          eq(interactions.type, "liked")
        )
      );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireDbUser();
    const { id: paperId } = await params;

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(interactions)
      .where(and(eq(interactions.paperId, paperId), eq(interactions.type, "liked")));

    const [userLiked] = await db
      .select()
      .from(interactions)
      .where(
        and(
          eq(interactions.userId, user.id),
          eq(interactions.paperId, paperId),
          eq(interactions.type, "liked")
        )
      );

    return NextResponse.json({
      count: Number(countResult?.count ?? 0),
      liked: !!userLiked,
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
