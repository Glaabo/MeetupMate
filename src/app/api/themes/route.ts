import { NextResponse } from "next/server";
import { MEETUP_THEMES } from "@/lib/themes";

export async function GET() {
  return NextResponse.json({ themes: MEETUP_THEMES });
}
