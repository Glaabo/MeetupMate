import { NextResponse } from "next/server";
import { GroupRole } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";
import { hashInviteToken } from "@/lib/invites";
import { jsonError, requireApiSession } from "@/lib/api";

type Params = { params: Promise<{ token: string }> };

export async function POST(_request: Request, { params }: Params) {
  try {
    const session = await requireApiSession();
    const { token } = await params;
    const tokenHash = hashInviteToken(token);

    const invite = await prisma.invite.findUnique({
      where: { tokenHash },
      include: { group: true },
    });

    if (!invite) {
      return NextResponse.json({ error: "Invalid invite" }, { status: 404 });
    }
    if (invite.expiresAt < new Date()) {
      return NextResponse.json({ error: "Invite expired" }, { status: 410 });
    }
    if (invite.maxUses != null && invite.useCount >= invite.maxUses) {
      return NextResponse.json({ error: "Invite fully used" }, { status: 410 });
    }

    const existing = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: invite.groupId,
          userId: session.user.id,
        },
      },
    });

    if (existing) {
      return NextResponse.json({
        groupId: invite.groupId,
        alreadyMember: true,
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.groupMember.create({
        data: {
          groupId: invite.groupId,
          userId: session.user.id,
          role: GroupRole.MEMBER,
        },
      });
      await tx.invite.update({
        where: { id: invite.id },
        data: { useCount: { increment: 1 } },
      });
    });

    return NextResponse.json({
      groupId: invite.groupId,
      groupName: invite.group.name,
      alreadyMember: false,
    });
  } catch (error) {
    return jsonError(error);
  }
}
