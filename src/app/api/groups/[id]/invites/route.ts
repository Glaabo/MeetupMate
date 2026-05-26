import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  buildInviteUrl,
  generateInviteToken,
  hashInviteToken,
  inviteExpiresAt,
} from "@/lib/invites";
import { jsonError, requireApiSession } from "@/lib/api";
import { requireGroupMember } from "@/lib/permissions";

const schema = z.object({
  maxUses: z.number().int().positive().optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const session = await requireApiSession();
    const { id: groupId } = await params;
    await requireGroupMember(groupId, session.user.id);

    const body = schema.safeParse(await request.json().catch(() => ({})));
    if (!body.success) {
      return NextResponse.json({ error: body.error.flatten() }, { status: 400 });
    }

    const token = generateInviteToken();
    const invite = await prisma.invite.create({
      data: {
        groupId,
        tokenHash: hashInviteToken(token),
        expiresAt: inviteExpiresAt(),
        maxUses: body.data.maxUses,
        createdById: session.user.id,
      },
    });

    return NextResponse.json({
      inviteId: invite.id,
      url: buildInviteUrl(token),
      expiresAt: invite.expiresAt,
    });
  } catch (error) {
    return jsonError(error);
  }
}
