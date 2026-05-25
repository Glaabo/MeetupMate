import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { jsonError, requireApiSession } from "@/lib/api";
import { headers } from "next/headers";

export async function DELETE() {
  try {
    const session = await requireApiSession();
    const userId = session.user.id;

    await prisma.user.delete({ where: { id: userId } });

    await auth.api.signOut({ headers: await headers() });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
