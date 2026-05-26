import { GroupRole } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";

export class AuthError extends Error {
  constructor(
    message: string,
    public status: number = 401,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export async function requireGroupMember(groupId: string, userId: string) {
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
    include: { group: true },
  });
  if (!membership) {
    throw new AuthError("Not a member of this group", 403);
  }
  return membership;
}

export async function requireGroupOwner(groupId: string, userId: string) {
  const membership = await requireGroupMember(groupId, userId);
  if (membership.role !== GroupRole.OWNER) {
    throw new AuthError("Owner access required", 403);
  }
  return membership;
}

export function effectiveMatchThreshold(
  storedThreshold: number,
  memberCount: number,
): number {
  if (memberCount <= 0) return 1;
  if (storedThreshold <= 0 || storedThreshold > memberCount) {
    return memberCount;
  }
  return storedThreshold;
}
