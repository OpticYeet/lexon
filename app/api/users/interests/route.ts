import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { userInterests } from "@/lib/db/schema";
import { requireDbUser } from "@/lib/auth/server";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const user = await requireDbUser();
    const interests = await db
      .select()
      .from(userInterests)
      .where(eq(userInterests.userId, user.id));
    return NextResponse.json(interests);
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await requireDbUser();
    const body = await req.json();
    const { fieldIds } = body;

    if (!Array.isArray(fieldIds) || fieldIds.length === 0) {
      return NextResponse.json(
        { error: "fieldIds must be a non-empty array" },
        { status: 400 }
      );
    }

    // Delete existing interests and replace
    await db.delete(userInterests).where(eq(userInterests.userId, user.id));

    const values = fieldIds.map((fieldId: number) => ({
      userId: user.id,
      fieldId,
      weight: 1.0,
    }));

    await db.insert(userInterests).values(values);

    return NextResponse.json({ success: true, count: fieldIds.length });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
