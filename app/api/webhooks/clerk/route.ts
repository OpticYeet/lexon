import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, streaks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    throw new Error("Missing CLERK_WEBHOOK_SECRET");
  }

  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  if (evt.type === "user.created") {
    const { id, email_addresses, username, first_name, last_name, image_url } =
      evt.data;
    const email = email_addresses[0]?.email_address;
    if (!email) {
      return new Response("No email found", { status: 400 });
    }

    const displayName = [first_name, last_name].filter(Boolean).join(" ") || null;

    const [newUser] = await db
      .insert(users)
      .values({
        clerkUserId: id,
        email,
        username: username ?? null,
        displayName,
        avatarUrl: image_url ?? null,
      })
      .onConflictDoNothing()
      .returning();

    if (newUser) {
      await db.insert(streaks).values({ userId: newUser.id });
    }
  }

  if (evt.type === "user.deleted") {
    const { id } = evt.data;
    if (id) {
      // ON DELETE CASCADE in schema handles all related data
      await db.delete(users).where(eq(users.clerkUserId, id));
    }
  }

  return new Response("OK", { status: 200 });
}
