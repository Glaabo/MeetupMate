"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MonthGrid } from "@/components/MonthGrid";
import {
  format,
  monthKey,
  nextMonth,
  parseMonthParam,
  prevMonth,
} from "@/lib/dates";

export function AvailabilityEditor({
  groupId,
  groupName,
}: {
  groupId: string;
  groupName: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const month = parseMonthParam(searchParams.get("month"));
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(
      `/api/groups/${groupId}/availability?month=${monthKey(month)}`,
    );
    const data = await res.json();
    if (res.ok) {
      setSelected(new Set(data.dates));
    }
  }, [groupId, month]);

  useEffect(() => {
    void
    (async () => { await load(); })();
  }, [load]);

  function navigateMonth(next: Date) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", monthKey(next));
    router.push(`/groups/${groupId}/availability?${params.toString()}`);
  }

  async function toggleDate(dateStr: string) {
    const next = new Set(selected);
    if (next.has(dateStr)) next.delete(dateStr);
    else next.add(dateStr);
    setSelected(next);
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch(`/api/groups/${groupId}/availability`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month: monthKey(month),
          dates: [...next],
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      setStatus("Saved");
    } catch {
      setStatus("Could not save — try again");
      await load();
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-6">
      <p className="mb-4 text-sm text-zinc-600">
        Tap days you are free for <strong>{groupName}</strong>.
        {saving && " Saving…"}
        {status && !saving && (
          <span className="ml-2 text-emerald-700">{status}</span>
        )}
      </p>
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
        mode="edit"
        selectedDates={selected}
        onToggleDate={toggleDate}
      />
      <p className="mt-4 text-xs text-zinc-500">
        Green = you are available. Changes save automatically.
      </p>
    </main>
  );
}
