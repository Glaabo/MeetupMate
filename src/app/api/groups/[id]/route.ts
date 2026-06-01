import { NextResponse } from "next/server";
import { z } from "zod";
import { MeetupTheme } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";
import { jsonError, requireApiSession } from "@/lib/api";
import { requireGroupMember, requireGroupOwner } from "@/lib/permissions";
import { themeDataForCreate, validateThemeInput } from "@/lib/theme-validation";

const patchSchema = z.object({
  theme: z.nativeEnum(MeetupTheme).optional(),
  boardGameId: z.string().optional().nullable(),
  penAndPaperId: z.string().optional().nullable(),
  themeNotes: z.string().max(500).optional().nullable(),
});

type Params = { params: Promise<{ id: string }> };

function serializeGroup(
  group: Awaited<ReturnType<typeof fetchGroup>>,
) {
  return {
    id: group.id,
    name: group.name,
    theme: group.theme,
    themeNotes: group.themeNotes,
    matchThreshold: group.matchThreshold,
    memberCount: group._count.members,
    boardGame: group.boardGame,
    penAndPaper: group.penAndPaper,
    members: group.members.map((m) => ({
      id: m.user.id,
      name: m.user.name,
      role: m.role,
    })),
  };
}

async function fetchGroup(id: string) {
  return prisma.group.findUniqueOrThrow({
    where: { id },
    include: {
      _count: { select: { members: true } },
      boardGame: true,
      penAndPaper: true,
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { joinedAt: "asc" },
      },
    },
  });
}

export async function GET(_request: Request, { params }: Params) {
  try {
    const session = await requireApiSession();
    const { id } = await params;
    await requireGroupMember(id, session.user.id);

    const group = await fetchGroup(id);
    return NextResponse.json({ group: serializeGroup(group) });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const session = await requireApiSession();
    const { id } = await params;
    await requireGroupOwner(id, session.user.id);

    const body = patchSchema.parse(await request.json());
    const existing = await prisma.group.findUniqueOrThrow({ where: { id } });

    const themeInput = {
      theme: body.theme ?? existing.theme,
      boardGameId:
        body.boardGameId !== undefined ? body.boardGameId : existing.boardGameId,
      penAndPaperId:
        body.penAndPaperId !== undefined
          ? body.penAndPaperId
          : existing.penAndPaperId,
      themeNotes:
        body.themeNotes !== undefined ? body.themeNotes : existing.themeNotes,
    };

    const themeError = await validateThemeInput(themeInput);
    if (themeError) {
      return NextResponse.json({ error: themeError }, { status: 400 });
    }

    await prisma.group.update({
      where: { id },
      data: themeDataForCreate(themeInput),
    });

    const group = await fetchGroup(id);
    return NextResponse.json({ group: serializeGroup(group) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    return jsonError(error);
  }
}
