import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, streaks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function requireAuth() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  return userId;
}

export async function getDbUser() {
  const clerkUserId = await requireAuth();
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.clerkUserId, clerkUserId))
    .limit(1);

  if (user) return user;

  // Auto-create user if authenticated with Clerk but not in DB yet
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email = clerkUser.emailAddresses[0]?.emailAddress;
  if (!email) return null;

  const displayName = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null;

  const [newUser] = await db
    .insert(users)
    .values({
      clerkUserId,
      email,
      username: clerkUser.username ?? null,
      displayName,
      avatarUrl: clerkUser.imageUrl ?? null,
    })
    .onConflictDoNothing()
    .returning();

  if (newUser) {
    await db.insert(streaks).values({ userId: newUser.id });
    return newUser;
  }

  // Race condition: another request created it
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.clerkUserId, clerkUserId))
    .limit(1);
  return existing ?? null;
}

export async function requireDbUser() {
  const user = await getDbUser();
  if (!user) {
    throw new Error("User not found in database");
  }
  return user;
}
