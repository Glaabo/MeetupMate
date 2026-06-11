"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { saveAvailabilityBlob } from "@/lib/actions/availability";
import { publishFeedEvents } from "@/lib/actions/feed";
import { decryptJson, encryptJson, verifyGroupKey, isValidKeyFormat } from "@/lib/crypto";
import { getGroupKey, storeGroupKey } from "@/lib/group-keys";
import {
  daysInMonth,
  firstWeekday,
  formatISODate,
  MONTH_NAMES,
  todayISO,
  WEEKDAY_NAMES,
} from "@/lib/dates";
import {
  aggregateByDate,
  computeMatches,
  requiredCount,
  type AvailabilityMap,
  type DayStatus,
  type MemberAvailability,
} from "@/lib/match";
import { IconKey, IconLock, IconTarget } from "@/components/icons";

type Person = { userId: string; name: string };

type Props = {
  groupId: string;
  groupName: string;
  myUserId: string;
  matchThreshold: number;
  keyVerifier: string | null;
  members: Person[];
  blobs: { userId: string; name: string; ciphertext: string }[];
  feedEnabled: boolean;
};

type Phase = "loading" | "locked" | "ready";

export function GroupCalendar({
  groupId,
  groupName,
  myUserId,
  matchThreshold,
  keyVerifier,
  members,
  blobs,
  feedEnabled,
}: Props) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [groupKey, setGroupKey] = useState<string | null>(null);
  const [otherMaps, setOtherMaps] = useState<MemberAvailability[]>([]);
  const [myMap, setMyMap] = useState<AvailabilityMap>({});
  const [error, setError] = useState<string | null>(null);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [selected, setSelected] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  /** Verifies a key and decrypts all member blobs. Pure: no state changes. */
  async function tryDecrypt(
    key: string,
  ): Promise<{ others: MemberAvailability[]; mine: AvailabilityMap } | null> {
    if (keyVerifier && !(await verifyGroupKey(key, keyVerifier))) return null;
    if (!keyVerifier && !isValidKeyFormat(key)) return null;

    const others: MemberAvailability[] = [];
    let mine: AvailabilityMap = {};
    for (const blob of blobs) {
      const map = await decryptJson<AvailabilityMap>(key, blob.ciphertext);
      if (!map) continue; // encrypted with a different key or corrupt — skip
      if (blob.userId === myUserId) mine = map;
      else others.push({ userId: blob.userId, name: blob.name, map });
    }
    return { others, mine };
  }

  async function unlockWith(key: string): Promise<boolean> {
    const data = await tryDecrypt(key);
    if (!data) return false;
    setGroupKey(key);
    storeGroupKey(groupId, key);
    setOtherMaps(data.others);
    setMyMap(data.mine);
    setPhase("ready");
    return true;
  }

  useEffect(() => {
    const stored = getGroupKey(groupId);
    tryDecrypt(stored ?? "").then((data) => {
      if (!data || !stored) {
        setPhase("locked");
        return;
      }
      setGroupKey(stored);
      setOtherMaps(data.others);
      setMyMap(data.mine);
      setPhase("ready");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  const needed = requiredCount(matchThreshold, members.length);
  const today = todayISO();

  const allMaps = useMemo<MemberAvailability[]>(
    () => [...otherMaps, { userId: myUserId, name: "You", map: myMap }],
    [otherMaps, myUserId, myMap],
  );
  const byDate = useMemo(() => aggregateByDate(allMaps), [allMaps]);
  const matches = useMemo(
    () => computeMatches(allMaps, matchThreshold, members.length, today),
    [allMaps, matchThreshold, members.length, today],
  );

  // Opt-in calendar sync: publish locally computed match days for my feed.
  const lastPublished = useRef<string | null>(null);
  useEffect(() => {
    if (!feedEnabled || phase !== "ready") return;
    const events = matches.slice(0, 60).map((m) => ({
      date: m.date,
      title:
        m.freeCount === members.length
          ? `${groupName}: everyone is free`
          : `${groupName}: ${m.freeCount}/${members.length} free`,
    }));
    const fingerprint = JSON.stringify(events);
    if (fingerprint === lastPublished.current) return;
    lastPublished.current = fingerprint;
    publishFeedEvents(groupId, events).catch(() => {
      lastPublished.current = null;
    });
  }, [feedEnabled, phase, matches, groupId, groupName, members.length]);

  function applyStatus(date: string, status: DayStatus | null) {
    if (!groupKey) return;
    const previous = myMap[date] ?? null;
    if (previous === status) return;
    setError(null);

    const nextMap: AvailabilityMap = { ...myMap };
    if (status === null) delete nextMap[date];
    else nextMap[date] = status;
    setMyMap(nextMap);

    startTransition(async () => {
      const ciphertext = await encryptJson(groupKey, nextMap);
      const result = await saveAvailabilityBlob(groupId, ciphertext);
      if (result.error) {
        setMyMap(myMap);
        setError(result.error);
      }
    });
  }

  if (phase === "loading") {
    return (
      <div className="card flex items-center justify-center p-10 text-sm text-ink-dim">
        Decrypting calendar…
      </div>
    );
  }

  if (phase === "locked") {
    return <UnlockCard onUnlock={unlockWith} />;
  }

  /* ---------------- calendar grid ---------------- */

  const total = daysInMonth(year, month);
  const offset = firstWeekday(year, month);
  const mm = String(month).padStart(2, "0");

  function dayInfo(date: string) {
    const day = byDate.get(date) ?? { free: [], maybe: [] };
    const mine = myMap[date] ?? null;
    const freeCount = day.free.length;
    const isMatch = needed > 0 && freeCount >= needed;
    return { day, mine, freeCount, maybeCount: day.maybe.length, isMatch };
  }

  function shiftMonth(delta: number) {
    const index = year * 12 + (month - 1) + delta;
    setYear(Math.floor(index / 12));
    setMonth((index % 12) + 1);
    setSelected(null);
  }

  const selectedInfo = selected ? dayInfo(selected) : null;
  const selectedNoReply = selected
    ? members.filter(
        (m) =>
          m.userId !== myUserId &&
          !selectedInfo?.day.free.some((p) => p.userId === m.userId) &&
          !selectedInfo?.day.maybe.some((p) => p.userId === m.userId),
      )
    : [];

  return (
    <div className="flex flex-col gap-4">
      <div className="card flex items-center justify-between px-3 py-2">
        <button
          type="button"
          onClick={() => shiftMonth(-1)}
          aria-label="Previous month"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-dim transition-colors hover:bg-brand/5 hover:text-ink"
        >
          ←
        </button>
        <span className="font-semibold">
          {MONTH_NAMES[month - 1]} {year}
        </span>
        <button
          type="button"
          onClick={() => shiftMonth(1)}
          aria-label="Next month"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-dim transition-colors hover:bg-brand/5 hover:text-ink"
        >
          →
        </button>
      </div>

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
            const dayNumber = i + 1;
            const date = `${year}-${mm}-${String(dayNumber).padStart(2, "0")}`;
            const { mine, freeCount, maybeCount, isMatch } = dayInfo(date);
            const isToday = date === today;
            const isPast = date < today;
            const isSelected = date === selected;
            const othersCount =
              freeCount - (mine === "free" ? 1 : 0) + maybeCount - (mine === "maybe" ? 1 : 0);

            return (
              <button
                key={date}
                type="button"
                onClick={() => setSelected(isSelected ? null : date)}
                aria-label={formatISODate(date)}
                aria-pressed={isSelected}
                className={[
                  "relative flex aspect-square flex-col items-center justify-center rounded-xl border text-sm transition-all duration-150",
                  "hover:scale-105 active:scale-95",
                  isMatch
                    ? "border-brand bg-brand text-cream shadow-[0_4px_14px_rgba(29,80,58,0.35)] hover:border-brand-2"
                    : mine === "free"
                      ? "border-free/60 bg-free/10 hover:border-free"
                      : mine === "maybe"
                        ? "border-maybe/60 bg-maybe/10 hover:border-maybe"
                        : "border-edge bg-surface hover:border-edge-strong",
                  isSelected ? "ring-2 ring-brand-2 ring-offset-2 ring-offset-bg" : "",
                  isPast ? "opacity-40" : "",
                ].join(" ")}
              >
                <span className={`font-semibold ${isToday && !isMatch ? "brand-text" : ""}`}>
                  {dayNumber}
                </span>
                <span className="mt-0.5 flex h-2 items-center gap-0.5">
                  {mine === "free" && (
                    <span className={`h-1.5 w-1.5 rounded-full ${isMatch ? "bg-cream" : "bg-free"}`} />
                  )}
                  {mine === "maybe" && (
                    <span className={`h-1.5 w-1.5 rounded-full ${isMatch ? "bg-cream" : "bg-maybe"}`} />
                  )}
                  {othersCount > 0 && (
                    <span
                      className={`text-[9px] font-bold leading-none ${
                        isMatch ? "text-cream/80" : "text-ink-dim"
                      }`}
                    >
                      +{othersCount}
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
                  ? "border-brand/40 bg-brand/10 text-ink"
                  : "border-edge-strong bg-surface-2 text-ink-dim hover:text-ink"
              }`}
            >
              ✕ Busy
            </button>
          </div>

          <div className="flex flex-col gap-1.5 text-sm">
            {selectedInfo.day.free.filter((p) => p.userId !== myUserId).length > 0 && (
              <p>
                <span className="font-medium text-free">Free:</span>{" "}
                <span className="text-ink-dim">
                  {selectedInfo.day.free
                    .filter((p) => p.userId !== myUserId)
                    .map((p) => p.name)
                    .join(", ")}
                </span>
              </p>
            )}
            {selectedInfo.day.maybe.filter((p) => p.userId !== myUserId).length > 0 && (
              <p>
                <span className="font-medium text-maybe">Maybe:</span>{" "}
                <span className="text-ink-dim">
                  {selectedInfo.day.maybe
                    .filter((p) => p.userId !== myUserId)
                    .map((p) => p.name)
                    .join(", ")}
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

      <section className="card p-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-ink-dim">
          <IconTarget className="h-4 w-4" /> Upcoming matches
        </h2>
        {matches.length === 0 ? (
          <p className="mt-2 text-sm text-ink-faint">
            No matching days yet. Mark your free days and invite more friends from the group
            settings.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {matches.slice(0, 5).map((m) => (
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
    </div>
  );
}

/* ------------------------------------------------------------------ */

function UnlockCard({ onUnlock }: { onUnlock: (key: string) => Promise<boolean> }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleUnlock() {
    setError(null);
    setPending(true);
    const ok = await onUnlock(value.trim());
    if (!ok) {
      setError("That key doesn't match this group. Check for typos or ask for a new invite link.");
    }
    setPending(false);
  }

  return (
    <div className="card flex flex-col items-center gap-4 p-8 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10 text-brand">
        <IconLock className="h-7 w-7" />
      </span>
      <div>
        <h2 className="text-lg font-bold">This calendar is encrypted</h2>
        <p className="mt-1 text-sm text-ink-dim">
          Availability is end-to-end encrypted — even the server can&apos;t read it. This device
          doesn&apos;t have the group key yet. Open a current invite link from a member, or paste
          the group key below (any member can copy it from the group settings).
        </p>
      </div>
      <div className="flex w-full flex-col gap-2">
        <label className="flex items-center gap-2 rounded-xl border border-edge-strong bg-surface px-3">
          <IconKey className="h-4 w-4 shrink-0 text-ink-faint" />
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Paste group key"
            className="w-full bg-transparent py-2.5 text-sm outline-none placeholder:text-ink-faint"
          />
        </label>
        <button
          type="button"
          onClick={handleUnlock}
          disabled={pending || value.trim().length === 0}
          className="btn-primary text-sm"
        >
          {pending ? "Checking…" : "Unlock calendar"}
        </button>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
