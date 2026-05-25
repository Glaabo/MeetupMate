import { NextResponse } from "next/server";
import { endOfMonth, startOfMonth } from "date-fns";
import { prisma } from "@/lib/db";
import { parseMonthParam, toDateString } from "@/lib/dates";
import { jsonError, requireApiSession } from "@/lib/api";
import {
  effectiveMatchThreshold,
  requireGroupMember,
} from "@/lib/permissions";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  try {
    const session = await requireApiSession();
    const { id: groupId } = await params;
    const membership = await requireGroupMember(groupId, session.user.id);

    const url = new URL(request.url);
    const month = parseMonthParam(url.searchParams.get("month"));
    const rangeStart = startOfMonth(month);
    const rangeEnd = endOfMonth(month);

    const [memberCount, availabilities, members] = await Promise.all([
      prisma.groupMember.count({ where: { groupId } }),
      prisma.availability.findMany({
        where: {
          groupId,
          date: { gte: rangeStart, lte: rangeEnd },
        },
        include: {
          user: { select: { id: true, name: true } },
        },
      }),
      prisma.groupMember.findMany({
        where: { groupId },
        include: { user: { select: { id: true, name: true } } },
      }),
    ]);

    const threshold = effectiveMatchThreshold(
      membership.group.matchThreshold,
      memberCount,
    );

    const byDate = new Map<
      string,
      { count: number; users: { id: string; name: string }[] }
    >();

    for (const row of availabilities) {
      const key = toDateString(row.date);
      const entry = byDate.get(key) ?? { count: 0, users: [] };
      entry.count += 1;
      entry.users.push({ id: row.user.id, name: row.user.name });
      byDate.set(key, entry);
    }

    const days = [...byDate.entries()].map(([date, data]) => ({
      date,
      availableCount: data.count,
      memberCount,
      meetsThreshold: data.count >= threshold,
      users: data.users,
    }));

    return NextResponse.json({
      month: url.searchParams.get("month") ?? toDateString(rangeStart).slice(0, 7),
      memberCount,
      matchThreshold: threshold,
      members: members.map((m) => ({
        id: m.user.id,
        name: m.user.name,
      })),
      days,
    });
  } catch (error) {
    return jsonError(error);
  }
}
