import { NextResponse } from "next/server";
import { AuthError } from "@/lib/permissions";
import { getSession } from "@/lib/session";

export async function requireApiSession() {
  const session = await getSession();
  if (!session) {
    throw new AuthError("Unauthorized", 401);
  }
  return session;
}

export function jsonError(error: unknown) {
  if (error instanceof AuthError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  }
  console.error(error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
