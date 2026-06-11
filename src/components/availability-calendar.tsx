"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { setAvailability, type DayStatus } from "@/lib/actions/availability";
import { daysInMonth, firstWeekday, formatISODate, todayISO, WEEKDAY_NAMES } from "@/lib/dates";

type Person = { userId: string; name: string };
type DayData = { free: Person[]; maybe: Person[] };

type Props = {
  groupId: string;
  year: number;
  month: number;
  myUserId: string;
  members: Person[];
  needed: number;
  days: Record<string, DayData>;
};

export function AvailabilityCalendar({
  groupId,
  year,
  month,
  myUserId,
  members,
  needed,
  days,
}: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // My optimistic status per date, layered over the server data.
  const [myStatus, setMyStatus] = useState<Record<string, DayStatus>>(() => {
    const initial: Record<string, DayStatus> = {};
    for (const [date, data] of Object.entries(days)) {
      if (data.free.some((p) => p.userId === myUserId)) initial[date] = "free";
      else if (data.maybe.some((p) => p.userId === myUserId)) initial[date] = "maybe";
    }
    return initial;
  });

  // Other members' availability, derived once from the server data.
  const others = useMemo(() => {
    const map: Record<string, DayData> = {};
    for (const [date, data] of Object.entries(days)) {
      map[date] = {
        free: data.free.filter((p) => p.userId !== myUserId),
        maybe: data.maybe.filter((p) => p.userId !== myUserId),
      };
    }
    return map;
  }, [days, myUserId]);

  const today = todayISO();
  const total = daysInMonth(year, month);
  const offset = firstWeekday(year, month);
  const mm = String(month).padStart(2, "0");

  function dayInfo(date: string) {
    const other = others[date] ?? { free: [], maybe: [] };
    const mine = myStatus[date] ?? null;
    const freeCount = other.free.length + (mine === "free" ? 1 : 0);
    const maybeCount = other.maybe.length + (mine === "maybe" ? 1 : 0);
    const isMatch = needed > 0 && freeCount >= needed;
    return { other, mine, freeCount, maybeCount, isMatch };
  }

  function applyStatus(date: string, status: DayStatus) {
    const previous = myStatus[date] ?? null;
    if (previous === status) return;
    setError(null);
    setMyStatus((s) => ({ ...s, [date]: status }));
    startTransition(async () => {
      const result = await setAvailability(groupId, date, status);
      if (result.error) {
        setMyStatus((s) => ({ ...s, [date]: previous }));
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  const selectedInfo = selected ? dayInfo(selected) : null;
  const selectedNoReply = selected
    ? members.filter(
        (m) =>
          m.userId !== myUserId &&
          !others[selected]?.free.some((p) => p.userId === m.userId) &&
          !others[selected]?.maybe.some((p) => p.userId === m.userId),
      )
    : [];

  return (
    <div className="flex flex-col gap-4">
      <div className="card p-3 sm:p-4">
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
          {WEEKDAY_NAMES.map((d) => (
            <span key={d} className="py-1">
              {d}
            </span>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {Array.from({ length: offset }).map((_, i) => (
            <span key={`pad-${i}`} />
          ))}
          {Array.from({ length: total }).map((_, i) => {
            const day = i + 1;
            const date = `${year}-${mm}-${String(day).padStart(2, "0")}`;
            const { mine, freeCount, maybeCount, isMatch } = dayInfo(date);
            const isToday = date === today;
            const isPast = date < today;
            const isSelected = date === selected;

            return (
              <button
                key={date}
                type="button"
                onClick={() => setSelected(isSelected ? null : date)}
                aria-label={formatISODate(date)}
                aria-pressed={isSelected}
                className={[
                  "relative flex aspect-square flex-col items-center justify-center rounded-xl border text-sm transition-all duration-150",
                  "hover:scale-105 hover:border-edge-strong active:scale-95",
                  isMatch
                    ? "border-match/60 bg-match/15 shadow-[0_0_12px_rgba(34,211,238,0.25)]"
                    : mine === "free"
                      ? "border-free/50 bg-free/10"
                      : mine === "maybe"
                        ? "border-maybe/50 bg-maybe/10"
                        : "border-edge bg-surface-2",
                  isSelected ? "ring-2 ring-brand" : "",
                  isPast ? "opacity-40" : "",
                ].join(" ")}
              >
                <span className={`font-semibold ${isToday ? "brand-text" : ""}`}>{day}</span>
                <span className="mt-0.5 flex h-2 items-center gap-0.5">
                  {mine === "free" && <span className="h-1.5 w-1.5 rounded-full bg-free" />}
                  {mine === "maybe" && <span className="h-1.5 w-1.5 rounded-full bg-maybe" />}
                  {freeCount - (mine === "free" ? 1 : 0) + maybeCount - (mine === "maybe" ? 1 : 0) >
                    0 && (
                    <span className="text-[9px] font-bold leading-none text-ink-dim">
                      +{freeCount - (mine === "free" ? 1 : 0) + maybeCount - (mine === "maybe" ? 1 : 0)}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-edge pt-3 text-[11px] text-ink-dim">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-free" /> You&apos;re free
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-maybe" /> Maybe
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-match" /> Everyone matches
          </span>
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {selected && selectedInfo ? (
        <div className="card flex flex-col gap-3 p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{formatISODate(selected)}</h3>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                selectedInfo.isMatch ? "bg-match/15 text-match" : "bg-surface-2 text-ink-dim"
              }`}
            >
              {selectedInfo.freeCount}/{members.length} free
              {selectedInfo.isMatch ? " · match!" : ""}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => applyStatus(selected, "free")}
              aria-pressed={selectedInfo.mine === "free"}
              className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all hover:scale-[1.03] active:scale-95 ${
                selectedInfo.mine === "free"
                  ? "border-free bg-free/20 text-free"
                  : "border-edge-strong bg-surface-2 text-ink-dim hover:text-ink"
              }`}
            >
              ✓ Free
            </button>
            <button
              type="button"
              onClick={() => applyStatus(selected, "maybe")}
              aria-pressed={selectedInfo.mine === "maybe"}
              className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all hover:scale-[1.03] active:scale-95 ${
                selectedInfo.mine === "maybe"
                  ? "border-maybe bg-maybe/20 text-maybe"
                  : "border-edge-strong bg-surface-2 text-ink-dim hover:text-ink"
              }`}
            >
              ~ Maybe
            </button>
            <button
              type="button"
              onClick={() => applyStatus(selected, null)}
              aria-pressed={selectedInfo.mine === null}
              className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all hover:scale-[1.03] active:scale-95 ${
                selectedInfo.mine === null
                  ? "border-edge-strong bg-white/10 text-ink"
                  : "border-edge-strong bg-surface-2 text-ink-dim hover:text-ink"
              }`}
            >
              ✕ Busy
            </button>
          </div>

          <div className="flex flex-col gap-1.5 text-sm">
            {selectedInfo.other.free.length > 0 && (
              <p>
                <span className="font-medium text-free">Free:</span>{" "}
                <span className="text-ink-dim">
                  {selectedInfo.other.free.map((p) => p.name).join(", ")}
                </span>
              </p>
            )}
            {selectedInfo.other.maybe.length > 0 && (
              <p>
                <span className="font-medium text-maybe">Maybe:</span>{" "}
                <span className="text-ink-dim">
                  {selectedInfo.other.maybe.map((p) => p.name).join(", ")}
                </span>
              </p>
            )}
            {selectedNoReply.length > 0 && (
              <p>
                <span className="font-medium text-ink-faint">No reply:</span>{" "}
                <span className="text-ink-faint">
                  {selectedNoReply.map((p) => p.name).join(", ")}
                </span>
              </p>
            )}
          </div>
        </div>
      ) : (
        <p className="text-center text-sm text-ink-faint">
          Tap a day to set your availability and see who&apos;s free.
        </p>
      )}
    </div>
  );
}
