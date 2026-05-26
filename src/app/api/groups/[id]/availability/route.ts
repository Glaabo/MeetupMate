import { NextResponse } from "next/server";
import { z } from "zod";
import { endOfMonth, startOfMonth } from "date-fns";
import { prisma } from "@/lib/db";
import { parseMonthParam, toDateString } from "@/lib/dates";
import { jsonError, requireApiSession } from "@/lib/api";
import { requireGroupMember } from "@/lib/permissions";

const putSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),
  dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  try {
    const session = await requireApiSession();
    const { id: groupId } = await params;
    await requireGroupMember(groupId, session.user.id);

    const url = new URL(request.url);
    const month = parseMonthParam(url.searchParams.get("month"));
    const rangeStart = startOfMonth(month);
    const rangeEnd = endOfMonth(month);

    const rows = await prisma.availability.findMany({
      where: {
        groupId,
        userId: session.user.id,
        date: { gte: rangeStart, lte: rangeEnd },
      },
      select: { date: true },
    });

    return NextResponse.json({
      dates: rows.map((r) => toDateString(r.date)),
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const session = await requireApiSession();
    const { id: groupId } = await params;
    await requireGroupMember(groupId, session.user.id);

    const body = putSchema.parse(await request.json());
    const month = parseMonthParam(body.month);
    const rangeStart = startOfMonth(month);
    const rangeEnd = endOfMonth(month);

    const dates = body.dates.map((d) => new Date(`${d}T12:00:00.000Z`));

    await prisma.$transaction(async (tx) => {
      await tx.availability.deleteMany({
        where: {
          groupId,
          userId: session.user.id,
          date: { gte: rangeStart, lte: rangeEnd },
        },
      });
      if (dates.length > 0) {
        await tx.availability.createMany({
          data: dates.map((date) => ({
            groupId,
            userId: session.user.id,
            date,
          })),
          skipDuplicates: true,
        });
      }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    return jsonError(error);
  }
}
