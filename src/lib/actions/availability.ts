"use server";

import { db } from "@/db";
import { availability } from "@/db/schema";
import { newId } from "@/lib/ids";
import { getMembership } from "@/lib/data/groups";
import { requireUser } from "@/lib/session";

/** Generous cap; a year of daily marks encrypts to a few KB. */
const MAX_BLOB_LENGTH = 200_000;

/**
 * Stores the caller's end-to-end encrypted availability blob for a group.
 * The blob is encrypted client-side; the server cannot read it.
 */
export async function saveAvailabilityBlob(
  groupId: string,
  ciphertext: string,
): Promise<{ error?: string }> {
  const me = await requireUser();
  if (typeof ciphertext !== "string" || ciphertext.length > MAX_BLOB_LENGTH) {
    return { error: "Invalid data." };
  }

  const membership = await getMembership(groupId, me.id);
  if (!membership) return { error: "You are not a member of this group." };

  await db
    .insert(availability)
    .values({
      id: newId(),
      groupId,
      userId: me.id,
      ciphertext,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [availability.groupId, availability.userId],
      set: { ciphertext, updatedAt: new Date() },
    });

  return {};
}
