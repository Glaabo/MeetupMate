"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { availability } from "@/db/schema";
import { isValidISODate } from "@/lib/dates";
import { newId } from "@/lib/ids";
import { getMembership } from "@/lib/data/groups";
import { requireUser } from "@/lib/session";

export type DayStatus = "free" | "maybe" | null;

/** Sets (or clears, with null) the caller's availability for one day in a group. */
export async function setAvailability(
  groupId: string,
  date: string,
  status: DayStatus,
): Promise<{ error?: string }> {
  const me = await requireUser();
  if (!isValidISODate(date)) return { error: "Invalid date." };

  const membership = await getMembership(groupId, me.id);
  if (!membership) return { error: "You are not a member of this group." };

  const where = and(
    eq(availability.groupId, groupId),
    eq(availability.userId, me.id),
    eq(availability.date, date),
  );

  if (status === null) {
    await db.delete(availability).where(where);
    return {};
  }

  await db
    .insert(availability)
    .values({
      id: newId(),
      groupId,
      userId: me.id,
      date,
      status,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [availability.groupId, availability.userId, availability.date],
      set: { status, updatedAt: new Date() },
    });

  return {};
}
