import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { requireDbUser } from "@/lib/auth/server";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const user = await requireDbUser();
    return NextResponse.json(user);
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireDbUser();
    const body = await req.json();

    const allowedFields = ["displayName", "dailyGoal", "timezone", "onboardingDone"];
    const updates: Record<string, any> = {};

    for (const key of allowedFields) {
      if (key in body) {
        const dbKey = key === "displayName" ? "displayName" :
                      key === "dailyGoal" ? "dailyGoal" :
                      key === "onboardingDone" ? "onboardingDone" : key;
        updates[dbKey] = body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    updates.updatedAt = new Date();

    const [updated] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, user.id))
      .returning();

    return NextResponse.json(updated);
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
