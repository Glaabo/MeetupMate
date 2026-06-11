"use server";

import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { calendarFeeds, feedEvents } from "@/db/schema";
import { isValidISODate } from "@/lib/dates";
import { newId } from "@/lib/ids";
import { getMembership } from "@/lib/data/groups";
import { requireUser } from "@/lib/session";

const eventsSchema = z
  .array(
    z.object({
      date: z.string().refine(isValidISODate, "Invalid date"),
      title: z.string().trim().min(1).max(120),
    }),
  )
  .max(60);

/**
 * Publishes locally computed match days for the caller's iCal feed.
 * Only runs when the user has explicitly enabled calendar sync — this is the
 * single, opt-in place where match days exist in plaintext on the server.
 */
export async function publishFeedEvents(
  groupId: string,
  events: { date: string; title: string }[],
): Promise<{ error?: string }> {
  const me = await requireUser();

  const feed = await db
    .select({ id: calendarFeeds.id })
    .from(calendarFeeds)
    .where(eq(calendarFeeds.userId, me.id))
    .limit(1);
  if (feed.length === 0) return {}; // sync not enabled: never store anything

  const membership = await getMembership(groupId, me.id);
  if (!membership) return { error: "You are not a member of this group." };

  const parsed = eventsSchema.safeParse(events);
  if (!parsed.success) return { error: "Invalid events." };

  const now = new Date();
  db.transaction((tx) => {
    tx.delete(feedEvents)
      .where(and(eq(feedEvents.userId, me.id), eq(feedEvents.groupId, groupId)))
      .run();
    for (const event of parsed.data) {
      tx.insert(feedEvents)
        .values({
          id: newId(),
          userId: me.id,
          groupId,
          date: event.date,
          title: event.title,
          updatedAt: now,
        })
        .run();
    }
  });

  return {};
}
