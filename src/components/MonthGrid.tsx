"use client";

import {
  calendarGridDays,
  format,
  isSameDay,
  isSameMonth,
  toDateString,
} from "@/lib/dates";

export type DayInfo = {
  availableCount: number;
  memberCount: number;
  meetsThreshold: boolean;
  users: { id: string; name: string }[];
};

type Props = {
  month: Date;
  mode: "edit" | "view";
  selectedDates?: Set<string>;
  dayInfo?: Map<string, DayInfo>;
  onToggleDate?: (dateStr: string) => void;
  onSelectDay?: (dateStr: string, info: DayInfo | undefined) => void;
};

export function MonthGrid({
  month,
  mode,
  selectedDates,
  dayInfo,
  onToggleDate,
  onSelectDay,
}: Props) {
  const days = calendarGridDays(month);
  const weekDayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="w-full">
      <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-medium text-zinc-500">
        {weekDayLabels.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const dateStr = toDateString(day);
          const inMonth = isSameMonth(day, month);
          const selected = selectedDates?.has(dateStr);
          const info = dayInfo?.get(dateStr);
          const countLabel =
            info && info.memberCount > 0
              ? `${info.availableCount}/${info.memberCount}`
              : null;

          let cellClass =
            "flex min-h-14 flex-col items-center justify-center rounded-lg border text-sm transition-colors ";
          if (!inMonth) {
            cellClass += "border-transparent text-zinc-300 ";
          } else if (mode === "edit") {
            cellClass += selected
              ? "border-emerald-600 bg-emerald-100 text-emerald-900 "
              : "border-zinc-200 bg-white text-zinc-800 active:bg-zinc-100 ";
          } else {
            const meets = info?.meetsThreshold;
            const partial =
              info && info.availableCount > 0 && !info.meetsThreshold;
            cellClass += meets
              ? "border-emerald-600 bg-emerald-100 text-emerald-900 "
              : partial
                ? "border-amber-400 bg-amber-50 text-amber-900 "
                : "border-zinc-200 bg-white text-zinc-700 ";
          }

          return (
            <button
              key={dateStr}
              type="button"
              disabled={!inMonth}
              className={cellClass}
              onClick={() => {
                if (!inMonth) return;
                if (mode === "edit" && onToggleDate) {
                  onToggleDate(dateStr);
                } else if (mode === "view" && onSelectDay) {
                  onSelectDay(dateStr, info);
                }
              }}
            >
              <span className="font-semibold">{format(day, "d")}</span>
              {mode === "view" && countLabel && inMonth && (
                <span className="mt-0.5 text-[10px] leading-none">{countLabel}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}
