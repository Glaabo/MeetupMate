import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { toDateString } from "@/lib/dates";
import { jsonError, requireApiSession } from "@/lib/api";

export async function GET() {
  try {
    const session = await requireApiSession();
    const userId = session.user.id;

    const [user, memberships, availabilities] = await Promise.all([
      prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.groupMember.findMany({
        where: { userId },
        include: { group: { select: { id: true, name: true, matchThreshold: true } } },
      }),
      prisma.availability.findMany({
        where: { userId },
        include: { group: { select: { id: true, name: true } } },
        orderBy: [{ groupId: "asc" }, { date: "asc" }],
      }),
    ]);

    const payload = {
      exportedAt: new Date().toISOString(),
      user,
      groups: memberships.map((m) => ({
        groupId: m.group.id,
        groupName: m.group.name,
        role: m.role,
        matchThreshold: m.group.matchThreshold,
        joinedAt: m.joinedAt,
      })),
      availability: availabilities.map((a) => ({
        groupId: a.group.id,
        groupName: a.group.name,
        date: toDateString(a.date),
      })),
    };

    return new NextResponse(JSON.stringify(payload, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": 'attachment; filename="meetupmate-export.json"',
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
