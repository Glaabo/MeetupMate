"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { GroupIcon, IconLock, IconTarget } from "@/components/icons";
import { decryptJson } from "@/lib/crypto";
import { getGroupKey } from "@/lib/group-keys";
import { formatISODate, todayISO } from "@/lib/dates";
import { computeMatches, type AvailabilityMap, type MemberAvailability } from "@/lib/match";

export type GroupListEntry = {
  id: string;
  name: string;
  icon: string;
  role: "owner" | "member";
  memberCount: number;
  matchThreshold: number;
  blobs: { userId: string; ciphertext: string }[];
};

type Preview = { state: "locked" } | { state: "none" } | { state: "match"; date: string };

export function GroupList({ groups }: { groups: GroupListEntry[] }) {
  const [previews, setPreviews] = useState<Record<string, Preview>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const today = todayISO();
      const next: Record<string, Preview> = {};
      for (const group of groups) {
        const key = getGroupKey(group.id);
        if (!key) {
          next[group.id] = { state: "locked" };
          continue;
        }
        const members: MemberAvailability[] = [];
        for (const blob of group.blobs) {
          const map = await decryptJson<AvailabilityMap>(key, blob.ciphertext);
          if (map) members.push({ userId: blob.userId, name: "", map });
        }
        if (members.length === 0 && group.blobs.length > 0) {
          next[group.id] = { state: "locked" };
          continue;
        }
        const matches = computeMatches(members, group.matchThreshold, group.memberCount, today);
        next[group.id] = matches.length > 0 ? { state: "match", date: matches[0].date } : { state: "none" };
      }
      if (!cancelled) setPreviews(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [groups]);

  return (
    <ul className="flex flex-col gap-3">
      {groups.map((g) => {
        const preview = previews[g.id];
        return (
          <li key={g.id}>
            <Link
              href={`/groups/${g.id}`}
              className="card group flex items-center gap-4 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-edge-strong hover:shadow-[0_8px_30px_rgba(29,80,58,0.15)]"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                <GroupIcon icon={g.icon} className="h-6 w-6" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{g.name}</span>
                <span className="mt-0.5 block text-sm text-ink-dim">
                  {g.memberCount} {g.memberCount === 1 ? "member" : "members"}
                  {g.role === "owner" && " · you own this"}
                </span>
              </span>
              <span className="text-right">
                {preview?.state === "match" ? (
                  <>
                    <span className="flex items-center justify-end gap-1 text-xs font-medium uppercase tracking-wide text-match">
                      <IconTarget className="h-3.5 w-3.5" /> Next match
                    </span>
                    <span className="block text-sm font-semibold">{formatISODate(preview.date)}</span>
                  </>
                ) : preview?.state === "locked" ? (
                  <span className="flex items-center gap-1 text-xs text-ink-faint">
                    <IconLock className="h-3.5 w-3.5" /> Encrypted
                  </span>
                ) : preview?.state === "none" ? (
                  <span className="text-xs text-ink-faint">No match yet</span>
                ) : null}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
