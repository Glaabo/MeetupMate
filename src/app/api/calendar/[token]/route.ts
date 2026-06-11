import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { calendarFeeds, feedEvents } from "@/db/schema";
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
 * Personal iCal feed. Availability is end-to-end encrypted, so the server
 * cannot compute matches itself — this feed only contains match days that the
 * user's own device published after they explicitly enabled calendar sync.
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

  const events = await db
    .select({ groupId: feedEvents.groupId, date: feedEvents.date, title: feedEvents.title })
    .from(feedEvents)
    .where(eq(feedEvents.userId, feed.userId))
    .orderBy(asc(feedEvents.date));

  const now = `${new Date().toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`;
  const today = new Date().toISOString().slice(0, 10);

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

  for (const event of events) {
    if (event.date < today) continue;
    lines.push(
      "BEGIN:VEVENT",
      `UID:${event.groupId}-${event.date}@meetupmate`,
      `DTSTAMP:${now}`,
      `DTSTART;VALUE=DATE:${icsDate(event.date)}`,
      `DTEND;VALUE=DATE:${icsDate(nextDay(event.date))}`,
      `SUMMARY:${icsEscape(event.title)}`,
      "TRANSP:TRANSPARENT",
      "END:VEVENT",
    );
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
