import { NextResponse } from "next/server";
import { z } from "zod";
import { GroupRole } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";
import { jsonError, requireApiSession } from "@/lib/api";

const createSchema = z.object({
  name: z.string().min(1).max(100),
  matchThreshold: z.number().int().min(0).optional(),
});

export async function GET() {
  try {
    const session = await requireApiSession();
    const memberships = await prisma.groupMember.findMany({
      where: { userId: session.user.id },
      include: {
        group: {
          include: {
            _count: { select: { members: true } },
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    });

    return NextResponse.json({
      groups: memberships.map((m) => ({
        id: m.group.id,
        name: m.group.name,
        role: m.role,
        matchThreshold: m.group.matchThreshold,
        memberCount: m.group._count.members,
        joinedAt: m.joinedAt,
      })),
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireApiSession();
    const body = createSchema.parse(await request.json());

    const group = await prisma.$transaction(async (tx) => {
      const created = await tx.group.create({
        data: {
          name: body.name,
          createdById: session.user.id,
          matchThreshold: body.matchThreshold ?? 0,
        },
      });
      await tx.groupMember.create({
        data: {
          groupId: created.id,
          userId: session.user.id,
          role: GroupRole.OWNER,
        },
      });
      return created;
    });

    return NextResponse.json({ group }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    return jsonError(error);
  }
}
