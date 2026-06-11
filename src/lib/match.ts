/** Shared matching logic. Runs client-side: the server can't read availability. */

export type DayStatus = "free" | "maybe";

/** A member's decrypted availability: ISO date -> status. */
export type AvailabilityMap = Record<string, DayStatus>;

/** How many free members a day needs to count as a match. */
export function requiredCount(matchThreshold: number, memberCount: number): number {
  return matchThreshold === 0 ? memberCount : Math.min(matchThreshold, memberCount);
}

export type MemberAvailability = {
  userId: string;
  name: string;
  map: AvailabilityMap;
};

/** Aggregates decrypted member maps into per-day free/maybe lists. */
export function aggregateByDate(
  members: MemberAvailability[],
): Map<string, { free: { userId: string; name: string }[]; maybe: { userId: string; name: string }[] }> {
  const byDate = new Map<
    string,
    { free: { userId: string; name: string }[]; maybe: { userId: string; name: string }[] }
  >();
  for (const member of members) {
    for (const [date, status] of Object.entries(member.map)) {
      let day = byDate.get(date);
      if (!day) {
        day = { free: [], maybe: [] };
        byDate.set(date, day);
      }
      day[status].push({ userId: member.userId, name: member.name });
    }
  }
  return byDate;
}

/** Match days (>= fromDate), sorted ascending. */
export function computeMatches(
  members: MemberAvailability[],
  matchThreshold: number,
  memberCount: number,
  fromDate: string,
): { date: string; freeCount: number }[] {
  const needed = requiredCount(matchThreshold, memberCount);
  if (needed <= 0) return [];
  const counts = new Map<string, number>();
  for (const member of members) {
    for (const [date, status] of Object.entries(member.map)) {
      if (status === "free" && date >= fromDate) {
        counts.set(date, (counts.get(date) ?? 0) + 1);
      }
    }
  }
  return [...counts.entries()]
    .filter(([, count]) => count >= needed)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, freeCount]) => ({ date, freeCount }));
}
