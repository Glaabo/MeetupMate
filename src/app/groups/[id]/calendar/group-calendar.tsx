"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MonthGrid, type DayInfo } from "@/components/MonthGrid";
import {
  format,
  monthKey,
  nextMonth,
  parseMonthParam,
  prevMonth,
} from "@/lib/dates";

type CalendarResponse = {
  memberCount: number;
  matchThreshold: number;
  days: {
    date: string;
    availableCount: number;
    memberCount: number;
    meetsThreshold: boolean;
    users: { id: string; name: string }[];
  }[];
};

export function GroupCalendar({ groupId }: { groupId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const month = parseMonthParam(searchParams.get("month"));
  const [data, setData] = useState<CalendarResponse | null>(null);
  const [selectedDay, setSelectedDay] = useState<{
    date: string;
    info: DayInfo;
  } | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(
      `/api/groups/${groupId}/calendar?month=${monthKey(month)}`,
    );
    const json = await res.json();
    if (res.ok) setData(json);
  }, [groupId, month]);

  useEffect(() => {
    void
    (async () => { await load(); })();
  }, [load]);

  const dayInfo = new Map<string, DayInfo>();
  if (data) {
    for (const d of data.days) {
      dayInfo.set(d.date, {
        availableCount: d.availableCount,
        memberCount: d.memberCount,
        meetsThreshold: d.meetsThreshold,
        users: d.users,
      });
    }
  }

  function navigateMonth(next: Date) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", monthKey(next));
    router.push(`/groups/${groupId}/calendar?${params.toString()}`);
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-6">
      {data && (
        <p className="mb-4 text-sm text-zinc-600">
          <span className="inline-block h-3 w-3 rounded border border-emerald-600 bg-emerald-100 align-middle" />{" "}
          Meets match rule ({data.matchThreshold} of {data.memberCount}).{" "}
          <span className="inline-block h-3 w-3 rounded border border-amber-400 bg-amber-50 align-middle" />{" "}
          Partial overlap. Tap a day for names.
        </p>
      )}
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          className="rounded px-3 py-2 text-sm font-medium text-emerald-700"
          onClick={() => navigateMonth(prevMonth(month))}
        >
          Previous
        </button>
        <span className="font-semibold">{format(month, "MMMM yyyy")}</span>
        <button
          type="button"
          className="rounded px-3 py-2 text-sm font-medium text-emerald-700"
          onClick={() => navigateMonth(nextMonth(month))}
        >
          Next
        </button>
      </div>
      <MonthGrid
        month={month}
        mode="view"
        dayInfo={dayInfo}
        onSelectDay={(dateStr, info) => {
          if (info) setSelectedDay({ date: dateStr, info });
          else setSelectedDay(null);
        }}
      />
      {selectedDay && (
        <div className="mt-6 rounded-lg border border-zinc-200 bg-white p-4">
          <h3 className="font-medium">{selectedDay.date}</h3>
          <p className="text-sm text-zinc-600">
            {selectedDay.info.availableCount} of {selectedDay.info.memberCount}{" "}
            available
          </p>
          <ul className="mt-2 text-sm">
            {selectedDay.info.users.map((u) => (
              <li key={u.id}>{u.name}</li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
