"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { calendarFeeds, groupMembers, user } from "@/db/schema";
import { auth } from "@/lib/auth";
import { leaveOrDissolve } from "@/lib/data/groups";
import { hashToken, newId, newInviteToken } from "@/lib/ids";
import { requireUser } from "@/lib/session";

/**
 * Creates (or rotates) the caller's personal iCal feed and returns its URL.
 * Rotating invalidates any previously shared feed URL.
 */
export async function rotateCalendarFeed(): Promise<{ url?: string; error?: string }> {
  const me = await requireUser();
  const token = newInviteToken();

  await db
    .insert(calendarFeeds)
    .values({ id: newId(), userId: me.id, tokenHash: hashToken(token), createdAt: new Date() })
    .onConflictDoUpdate({
      target: calendarFeeds.userId,
      set: { tokenHash: hashToken(token), createdAt: new Date() },
    });

  revalidatePath("/settings");
  const base = process.env.APP_URL ?? "http://localhost:3000";
  return { url: `${base}/api/calendar/${token}.ics` };
}

/** Disables the caller's iCal feed; old URLs stop working immediately. */
export async function disableCalendarFeed(): Promise<{ error?: string }> {
  const me = await requireUser();
  await db.delete(calendarFeeds).where(eq(calendarFeeds.userId, me.id));
  revalidatePath("/settings");
  return {};
}

/**
 * Permanently deletes the caller's account and all of their data.
 * Groups they own are handed over to another member or deleted if empty.
 */
export async function deleteAccount(): Promise<{ error?: string }> {
  const me = await requireUser();

  const memberships = await db
    .select()
    .from(groupMembers)
    .where(eq(groupMembers.userId, me.id));

  for (const m of memberships) {
    await leaveOrDissolve(m.groupId, me.id, m.role);
  }

  // Clears the session cookie and revokes the session.
  await auth.api.signOut({ headers: await headers() });

  // Cascades: sessions, accounts, remaining memberships and availability.
  await db.delete(user).where(eq(user.id, me.id));

  redirect("/");
}
