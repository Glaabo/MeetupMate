import Link from "next/link";
import { notFound } from "next/navigation";
import { AvailabilityCalendar } from "@/components/availability-calendar";
import {
  getGroupAvailability,
  getGroupForMember,
  getMembers,
  getUpcomingMatches,
  requiredCount,
} from "@/lib/data/groups";
import { formatISODate, MONTH_NAMES, monthRange } from "@/lib/dates";
import { requireUser } from "@/lib/session";

function parseMonth(value: string | undefined): { year: number; month: number } {
  if (value && /^\d{4}-\d{2}$/.test(value)) {
    const year = Number(value.slice(0, 4));
    const month = Number(value.slice(5, 7));
    if (year >= 2000 && year <= 2100 && month >= 1 && month <= 12) {
      return { year, month };
    }
  }
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

function monthParam(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export default async function GroupPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ month?: string }>;
}) {
  const me = await requireUser();
  const { id } = await params;
  const { month: monthQuery } = await searchParams;

  const result = await getGroupForMember(id, me.id);
  if (!result) notFound();
  const { group, membership } = result;

  const { year, month } = parseMonth(monthQuery);
  const { start, end } = monthRange(year, month);

  const [members, byDate, matches] = await Promise.all([
    getMembers(id),
    getGroupAvailability(id, start, end),
    (async () => {
      const m = await getMembers(id);
      return getUpcomingMatches(id, group.matchThreshold, m.length);
    })(),
  ]);

  const needed = requiredCount(group.matchThreshold, members.length);

  const prev = month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
  const next = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };

  const days: Record<string, { free: { userId: string; name: string }[]; maybe: { userId: string; name: string }[] }> = {};
  for (const [date, value] of byDate) days[date] = value;

  return (
    <main className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-xl">
            {group.emoji}
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold">{group.name}</h1>
            <p className="text-xs text-ink-dim">
              {members.length} {members.length === 1 ? "member" : "members"} · match at{" "}
              {needed} free
            </p>
          </div>
        </div>
        <Link
          href={`/groups/${id}/settings`}
          aria-label="Group settings"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-edge-strong text-ink-dim transition-colors hover:bg-white/5 hover:text-ink"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </Link>
      </div>

      <div className="card flex items-center justify-between px-3 py-2">
        <Link
          href={`/groups/${id}?month=${monthParam(prev.year, prev.month)}`}
          aria-label="Previous month"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-dim transition-colors hover:bg-white/5 hover:text-ink"
        >
          ←
        </Link>
        <span className="font-semibold">
          {MONTH_NAMES[month - 1]} {year}
        </span>
        <Link
          href={`/groups/${id}?month=${monthParam(next.year, next.month)}`}
          aria-label="Next month"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-dim transition-colors hover:bg-white/5 hover:text-ink"
        >
          →
        </Link>
      </div>

      <AvailabilityCalendar
        key={`${id}-${year}-${month}`}
        groupId={id}
        year={year}
        month={month}
        myUserId={me.id}
        members={members.map((m) => ({ userId: m.userId, name: m.name }))}
        needed={needed}
        days={days}
      />

      <section className="card p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-dim">
          Upcoming matches
        </h2>
        {matches.length === 0 ? (
          <p className="mt-2 text-sm text-ink-faint">
            No matching days yet. Mark your free days and invite{" "}
            {membership.role === "owner" ? "your friends" : "more friends"} from the
            group settings.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {matches.map((m) => (
              <li
                key={m.date}
                className="flex items-center justify-between rounded-xl border border-match/30 bg-match/10 px-4 py-2.5"
              >
                <span className="font-semibold text-match">{formatISODate(m.date)}</span>
                <span className="text-sm text-ink-dim">
                  {m.freeCount}/{members.length} free
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
