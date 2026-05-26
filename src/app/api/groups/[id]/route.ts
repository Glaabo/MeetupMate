import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, requireApiSession } from "@/lib/api";
import { requireGroupMember } from "@/lib/permissions";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const session = await requireApiSession();
    const { id } = await params;
    await requireGroupMember(id, session.user.id);

    const group = await prisma.group.findUniqueOrThrow({
      where: { id },
      include: {
        _count: { select: { members: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
          orderBy: { joinedAt: "asc" },
        },
      },
    });

    return NextResponse.json({
      group: {
        id: group.id,
        name: group.name,
        matchThreshold: group.matchThreshold,
        memberCount: group._count.members,
        members: group.members.map((m) => ({
          id: m.user.id,
          name: m.user.name,
          role: m.role,
        })),
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
