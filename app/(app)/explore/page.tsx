import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { SwipeFeed } from "@/components/feed/SwipeFeed";

export default async function ExplorePage() {
  const { userId } = await auth();
  if (userId) {
    const [user] = await db
      .select({ onboardingDone: users.onboardingDone })
      .from(users)
      .where(eq(users.clerkUserId, userId))
      .limit(1);

    if (!user || !user.onboardingDone) {
      redirect("/onboarding");
    }
  }

  return <SwipeFeed />;
}
