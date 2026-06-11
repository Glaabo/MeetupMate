import { eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { calendarFeeds } from "@/db/schema";
import { GroupCalendar } from "@/components/group-calendar";
import { GroupIcon, IconGear } from "@/components/icons";
import { getAvailabilityBlobs, getGroupForMember, getMembers } from "@/lib/data/groups";
import { requiredCount } from "@/lib/match";
import { requireUser } from "@/lib/session";

export default async function GroupPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireUser();
  const { id } = await params;

  const result = await getGroupForMember(id, me.id);
  if (!result) notFound();
  const { group } = result;

  const [members, blobs, feeds] = await Promise.all([
    getMembers(id),
    getAvailabilityBlobs(id),
    db
      .select({ id: calendarFeeds.id })
      .from(calendarFeeds)
      .where(eq(calendarFeeds.userId, me.id))
      .limit(1),
  ]);

  const needed = requiredCount(group.matchThreshold, members.length);

  return (
    <main className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <GroupIcon icon={group.icon} className="h-6 w-6" />
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
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-edge-strong text-ink-dim transition-colors hover:bg-brand/5 hover:text-ink"
        >
          <IconGear className="h-[17px] w-[17px]" />
        </Link>
      </div>

      <GroupCalendar
        groupId={id}
        groupName={group.name}
        myUserId={me.id}
        matchThreshold={group.matchThreshold}
        keyVerifier={group.keyVerifier}
        members={members.map((m) => ({ userId: m.userId, name: m.name }))}
        blobs={blobs}
        feedEnabled={feeds.length > 0}
      />
    </main>
  );
}
