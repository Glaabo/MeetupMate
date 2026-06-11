"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { groupMembers, groups, invites } from "@/db/schema";
import { hashToken, newId, newInviteToken } from "@/lib/ids";
import { getMembership, leaveOrDissolve } from "@/lib/data/groups";
import { requireUser } from "@/lib/session";

export type FormState = { error?: string } | null;

const groupSchema = z.object({
  name: z.string().trim().min(1, "Please enter a group name.").max(60, "Name is too long."),
  icon: z.string().regex(/^[a-z]{2,20}$/, "Invalid icon."),
});

const createSchema = groupSchema.extend({
  /** base64url(IV || ciphertext) of the key sentinel, produced client-side. */
  keyVerifier: z.string().min(16).max(500),
});

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export async function createGroup(input: {
  name: string;
  icon: string;
  keyVerifier: string;
}): Promise<{ groupId?: string; error?: string }> {
  const me = await requireUser();
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const groupId = newId();
  const now = new Date();
  db.transaction((tx) => {
    tx.insert(groups)
      .values({
        id: groupId,
        name: parsed.data.name,
        icon: parsed.data.icon,
        keyVerifier: parsed.data.keyVerifier,
        createdById: me.id,
        createdAt: now,
      })
      .run();
    tx.insert(groupMembers)
      .values({
        id: newId(),
        groupId,
        userId: me.id,
        role: "owner",
        joinedAt: now,
      })
      .run();
  });

  revalidatePath("/groups");
  return { groupId };
}

const updateSchema = groupSchema.extend({
  matchThreshold: z.coerce.number().int().min(0).max(99),
});

export async function updateGroup(
  groupId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const me = await requireUser();
  const membership = await getMembership(groupId, me.id);
  if (membership?.role !== "owner") return { error: "Only the group owner can edit the group." };

  const parsed = updateSchema.safeParse({
    name: formData.get("name"),
    icon: formData.get("icon") || "calendar",
    matchThreshold: formData.get("matchThreshold") ?? 0,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await db
    .update(groups)
    .set({
      name: parsed.data.name,
      icon: parsed.data.icon,
      matchThreshold: parsed.data.matchThreshold,
    })
    .where(eq(groups.id, groupId));

  revalidatePath(`/groups/${groupId}`, "layout");
  revalidatePath("/groups");
  return null;
}

/** Creates a single-use-style invite link (valid 7 days). Returns the URL. */
export async function createInvite(groupId: string): Promise<{ url?: string; error?: string }> {
  const me = await requireUser();
  const membership = await getMembership(groupId, me.id);
  if (!membership) return { error: "You are not a member of this group." };

  const token = newInviteToken();
  await db.insert(invites).values({
    id: newId(),
    groupId,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + INVITE_TTL_MS),
    createdById: me.id,
    createdAt: new Date(),
  });

  const base = process.env.APP_URL ?? "http://localhost:3000";
  return { url: `${base}/join/${token}` };
}

export async function joinGroup(token: string): Promise<{ groupId?: string; error?: string }> {
  const me = await requireUser();
  const tokenHash = hashToken(token);
  const rows = await db.select().from(invites).where(eq(invites.tokenHash, tokenHash)).limit(1);
  const invite = rows[0];
  if (!invite || invite.expiresAt.getTime() < Date.now()) {
    return { error: "This invite link is invalid or has expired." };
  }

  const existing = await getMembership(invite.groupId, me.id);
  if (!existing) {
    await db.insert(groupMembers).values({
      id: newId(),
      groupId: invite.groupId,
      userId: me.id,
      role: "member",
      joinedAt: new Date(),
    });
  }

  revalidatePath("/groups");
  return { groupId: invite.groupId };
}

export async function removeMember(groupId: string, memberUserId: string): Promise<FormState> {
  const me = await requireUser();
  const myMembership = await getMembership(groupId, me.id);
  if (myMembership?.role !== "owner") return { error: "Only the group owner can remove members." };
  if (memberUserId === me.id) return { error: "Use “Leave group” instead." };

  const target = await getMembership(groupId, memberUserId);
  if (!target) return null;
  await leaveOrDissolve(groupId, memberUserId, target.role);

  revalidatePath(`/groups/${groupId}`, "layout");
  return null;
}

/**
 * Leave a group. If the owner leaves, ownership is transferred to the
 * longest-standing member; if nobody is left, the group is deleted.
 */
export async function leaveGroup(groupId: string): Promise<FormState> {
  const me = await requireUser();
  const membership = await getMembership(groupId, me.id);
  if (!membership) return { error: "You are not a member of this group." };

  await leaveOrDissolve(groupId, me.id, membership.role);

  revalidatePath("/groups");
  redirect("/groups");
}

export async function deleteGroup(groupId: string): Promise<FormState> {
  const me = await requireUser();
  const membership = await getMembership(groupId, me.id);
  if (membership?.role !== "owner") return { error: "Only the group owner can delete the group." };

  await db.delete(groups).where(eq(groups.id, groupId));

  revalidatePath("/groups");
  redirect("/groups");
}
