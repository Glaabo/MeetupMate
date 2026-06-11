import "server-only";

import { and, asc, eq, inArray, ne } from "drizzle-orm";
import { db } from "@/db";
import { availability, groupMembers, groups, user } from "@/db/schema";

export type GroupSummary = {
  id: string;
  name: string;
  icon: string;
  role: "owner" | "member";
  memberCount: number;
  matchThreshold: number;
};

export type MemberInfo = {
  userId: string;
  name: string;
  role: "owner" | "member";
  joinedAt: Date;
};

/** Opaque encrypted availability blob of one member. */
export type MemberBlob = {
  userId: string;
  name: string;
  ciphertext: string;
};

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

/** Encrypted availability blobs of all members of one group. */
export async function getAvailabilityBlobs(groupId: string): Promise<MemberBlob[]> {
  return db
    .select({
      userId: availability.userId,
      name: user.name,
      ciphertext: availability.ciphertext,
    })
    .from(availability)
    .innerJoin(user, eq(user.id, availability.userId))
    .where(eq(availability.groupId, groupId));
}

/** Encrypted blobs across several groups (dashboard preview), keyed by group. */
export async function getBlobsForGroups(groupIds: string[]): Promise<Map<string, MemberBlob[]>> {
  const result = new Map<string, MemberBlob[]>();
  if (groupIds.length === 0) return result;
  const rows = await db
    .select({
      groupId: availability.groupId,
      userId: availability.userId,
      name: user.name,
      ciphertext: availability.ciphertext,
    })
    .from(availability)
    .innerJoin(user, eq(user.id, availability.userId))
    .where(inArray(availability.groupId, groupIds));
  for (const row of rows) {
    let list = result.get(row.groupId);
    if (!list) {
      list = [];
      result.set(row.groupId, list);
    }
    list.push({ userId: row.userId, name: row.name, ciphertext: row.ciphertext });
  }
  return result;
}

/** All groups the user belongs to, with member counts. */
export async function getGroupsForUser(userId: string): Promise<GroupSummary[]> {
  const memberships = await db
    .select({
      groupId: groupMembers.groupId,
      role: groupMembers.role,
      name: groups.name,
      icon: groups.icon,
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
    .select({ groupId: groupMembers.groupId })
    .from(groupMembers)
    .where(inArray(groupMembers.groupId, groupIds));
  const memberCounts = new Map<string, number>();
  for (const row of memberRows) {
    memberCounts.set(row.groupId, (memberCounts.get(row.groupId) ?? 0) + 1);
  }

  return memberships.map((m) => ({
    id: m.groupId,
    name: m.name,
    icon: m.icon,
    role: m.role,
    memberCount: memberCounts.get(m.groupId) ?? 1,
    matchThreshold: m.matchThreshold,
  }));
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
