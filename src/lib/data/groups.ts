import "server-only";

import { and, asc, eq, gte, inArray, lte, ne } from "drizzle-orm";
import { db } from "@/db";
import { availability, groupMembers, groups, user } from "@/db/schema";
import { todayISO } from "@/lib/dates";

export type GroupSummary = {
  id: string;
  name: string;
  emoji: string;
  role: "owner" | "member";
  memberCount: number;
  nextMatch: string | null;
};

export type MemberInfo = {
  userId: string;
  name: string;
  role: "owner" | "member";
  joinedAt: Date;
};

export type DayAvailability = {
  free: { userId: string; name: string }[];
  maybe: { userId: string; name: string }[];
};

/** How many free members a day needs to count as a match. */
export function requiredCount(matchThreshold: number, memberCount: number): number {
  return matchThreshold === 0 ? memberCount : Math.min(matchThreshold, memberCount);
}

export async function getMembership(groupId: string, userId: string) {
  const rows = await db
    .select()
    .from(groupMembers)
    .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function getGroupForMember(groupId: string, userId: string) {
  const membership = await getMembership(groupId, userId);
  if (!membership) return null;
  const rows = await db.select().from(groups).where(eq(groups.id, groupId)).limit(1);
  if (!rows[0]) return null;
  return { group: rows[0], membership };
}

export async function getMembers(groupId: string): Promise<MemberInfo[]> {
  const rows = await db
    .select({
      userId: groupMembers.userId,
      name: user.name,
      role: groupMembers.role,
      joinedAt: groupMembers.joinedAt,
    })
    .from(groupMembers)
    .innerJoin(user, eq(user.id, groupMembers.userId))
    .where(eq(groupMembers.groupId, groupId))
    .orderBy(asc(groupMembers.joinedAt));
  return rows;
}

/**
 * Availability of all members of a group within [start, end],
 * keyed by ISO date.
 */
export async function getGroupAvailability(
  groupId: string,
  start: string,
  end: string,
): Promise<Map<string, DayAvailability>> {
  const rows = await db
    .select({
      date: availability.date,
      status: availability.status,
      userId: availability.userId,
      name: user.name,
    })
    .from(availability)
    .innerJoin(user, eq(user.id, availability.userId))
    .where(
      and(
        eq(availability.groupId, groupId),
        gte(availability.date, start),
        lte(availability.date, end),
      ),
    );

  const byDate = new Map<string, DayAvailability>();
  for (const row of rows) {
    let day = byDate.get(row.date);
    if (!day) {
      day = { free: [], maybe: [] };
      byDate.set(row.date, day);
    }
    day[row.status].push({ userId: row.userId, name: row.name });
  }
  return byDate;
}

/** All groups the user belongs to, with member counts and the next matching day. */
export async function getGroupsForUser(userId: string): Promise<GroupSummary[]> {
  const memberships = await db
    .select({
      groupId: groupMembers.groupId,
      role: groupMembers.role,
      name: groups.name,
      emoji: groups.emoji,
      matchThreshold: groups.matchThreshold,
      joinedAt: groupMembers.joinedAt,
    })
    .from(groupMembers)
    .innerJoin(groups, eq(groups.id, groupMembers.groupId))
    .where(eq(groupMembers.userId, userId))
    .orderBy(asc(groupMembers.joinedAt));

  if (memberships.length === 0) return [];

  const groupIds = memberships.map((m) => m.groupId);

  const memberRows = await db
    .select({ groupId: groupMembers.groupId, userId: groupMembers.userId })
    .from(groupMembers)
    .where(inArray(groupMembers.groupId, groupIds));
  const memberCounts = new Map<string, number>();
  for (const row of memberRows) {
    memberCounts.set(row.groupId, (memberCounts.get(row.groupId) ?? 0) + 1);
  }

  // Free days from today onwards, used to compute the next match per group.
  const today = todayISO();
  const futureFree = await db
    .select({
      groupId: availability.groupId,
      date: availability.date,
    })
    .from(availability)
    .where(
      and(
        inArray(availability.groupId, groupIds),
        gte(availability.date, today),
        eq(availability.status, "free"),
      ),
    );

  const freeCounts = new Map<string, Map<string, number>>();
  for (const row of futureFree) {
    let dates = freeCounts.get(row.groupId);
    if (!dates) {
      dates = new Map();
      freeCounts.set(row.groupId, dates);
    }
    dates.set(row.date, (dates.get(row.date) ?? 0) + 1);
  }

  return memberships.map((m) => {
    const memberCount = memberCounts.get(m.groupId) ?? 1;
    const needed = requiredCount(m.matchThreshold, memberCount);
    let nextMatch: string | null = null;
    const dates = freeCounts.get(m.groupId);
    if (dates && needed > 0) {
      for (const [date, count] of dates) {
        if (count >= needed && (nextMatch === null || date < nextMatch)) {
          nextMatch = date;
        }
      }
    }
    return {
      id: m.groupId,
      name: m.name,
      emoji: m.emoji,
      role: m.role,
      memberCount,
      nextMatch,
    };
  });
}

/**
 * Removes a user from a group. If they are the owner, ownership is handed to
 * the longest-standing remaining member; if nobody remains, the group is deleted.
 * Callers are responsible for authorization.
 */
export async function leaveOrDissolve(
  groupId: string,
  userId: string,
  role: "owner" | "member",
): Promise<void> {
  if (role === "owner") {
    const successor = await db
      .select()
      .from(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), ne(groupMembers.userId, userId)))
      .orderBy(asc(groupMembers.joinedAt))
      .limit(1);

    if (successor.length === 0) {
      await db.delete(groups).where(eq(groups.id, groupId));
      return;
    }
    await db
      .update(groupMembers)
      .set({ role: "owner" })
      .where(eq(groupMembers.id, successor[0].id));
  }

  await db
    .delete(availability)
    .where(and(eq(availability.groupId, groupId), eq(availability.userId, userId)));
  await db
    .delete(groupMembers)
    .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)));
}

/** Upcoming match days for a group (from today, limited). */
export async function getUpcomingMatches(
  groupId: string,
  matchThreshold: number,
  memberCount: number,
  limit = 5,
): Promise<{ date: string; freeCount: number }[]> {
  const needed = requiredCount(matchThreshold, memberCount);
  if (needed <= 0) return [];

  const rows = await db
    .select({ date: availability.date })
    .from(availability)
    .where(
      and(
        eq(availability.groupId, groupId),
        gte(availability.date, todayISO()),
        eq(availability.status, "free"),
      ),
    );

  const counts = new Map<string, number>();
  for (const row of rows) counts.set(row.date, (counts.get(row.date) ?? 0) + 1);

  return [...counts.entries()]
    .filter(([, count]) => count >= needed)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .slice(0, limit)
    .map(([date, freeCount]) => ({ date, freeCount }));
}
