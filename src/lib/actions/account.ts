"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { groupMembers, user } from "@/db/schema";
import { auth } from "@/lib/auth";
import { leaveOrDissolve } from "@/lib/data/groups";
import { requireUser } from "@/lib/session";

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
