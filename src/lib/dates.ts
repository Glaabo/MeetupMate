import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";

export function parseMonthParam(month: string | null): Date {
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return startOfMonth(new Date());
  }
  return startOfMonth(parseISO(`${month}-01`));
}

export function monthKey(date: Date): string {
  return format(date, "yyyy-MM");
}

export function toDateString(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function calendarGridDays(month: Date): Date[] {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end });
}

export function prevMonth(date: Date): Date {
  return addMonths(date, -1);
}

export function nextMonth(date: Date): Date {
  return addMonths(date, 1);
}

export { isSameDay, isSameMonth, format };
