import { eq } from "drizzle-orm";
import { db } from "@/db";
import { calendarFeeds } from "@/db/schema";
import { getFutureMatchesForUser } from "@/lib/data/groups";
import { hashToken } from "@/lib/ids";

function icsEscape(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

/** "2026-07-14" -> "20260714" */
function icsDate(iso: string): string {
  return iso.replaceAll("-", "");
}

function nextDay(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

/**
 * Personal iCal feed with every group's match days as all-day events.
 * Google Calendar ("From URL") and Apple Calendar ("New Calendar
 * Subscription") can subscribe to this endpoint and refresh automatically.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token: rawToken } = await params;
  const token = rawToken.endsWith(".ics") ? rawToken.slice(0, -4) : rawToken;

  const rows = await db
    .select()
    .from(calendarFeeds)
    .where(eq(calendarFeeds.tokenHash, hashToken(token)))
    .limit(1);
  const feed = rows[0];
  if (!feed) {
    return new Response("Not found", { status: 404 });
  }

  const groupMatches = await getFutureMatchesForUser(feed.userId);
  const now = `${new Date().toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`;

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//MeetupMate//Match Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:MeetupMate",
    "X-WR-CALDESC:Days where your groups can meet",
    "REFRESH-INTERVAL;VALUE=DURATION:PT6H",
    "X-PUBLISHED-TTL:PT6H",
  ];

  for (const group of groupMatches) {
    for (const match of group.matches) {
      const summary =
        match.freeCount === group.memberCount
          ? `${group.emoji} ${group.name}: everyone is free!`
          : `${group.emoji} ${group.name}: ${match.freeCount}/${group.memberCount} free`;
      lines.push(
        "BEGIN:VEVENT",
        `UID:${group.groupId}-${match.date}@meetupmate`,
        `DTSTAMP:${now}`,
        `DTSTART;VALUE=DATE:${icsDate(match.date)}`,
        `DTEND;VALUE=DATE:${icsDate(nextDay(match.date))}`,
        `SUMMARY:${icsEscape(summary)}`,
        "TRANSP:TRANSPARENT",
        "END:VEVENT",
      );
    }
  }

  lines.push("END:VCALENDAR");

  return new Response(lines.join("\r\n") + "\r\n", {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="meetupmate.ics"',
      "Cache-Control": "private, max-age=300",
    },
  });
}
