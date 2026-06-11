import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  DangerZone,
  GroupEditForm,
  InviteSection,
  RemoveMemberButton,
} from "@/components/group-settings";
import { getGroupForMember, getMembers } from "@/lib/data/groups";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Group settings" };

export default async function GroupSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const me = await requireUser();
  const { id } = await params;

  const result = await getGroupForMember(id, me.id);
  if (!result) notFound();
  const { group, membership } = result;
  const members = await getMembers(id);
  const isOwner = membership.role === "owner";

  return (
    <main className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <Link
          href={`/groups/${id}`}
          aria-label="Back to calendar"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-edge-strong text-ink-dim transition-colors hover:bg-white/5 hover:text-ink"
        >
          ←
        </Link>
        <div>
          <h1 className="text-xl font-bold">
            {group.emoji} {group.name}
          </h1>
          <p className="text-xs text-ink-dim">Group settings</p>
        </div>
      </div>

      <InviteSection groupId={id} />

      <section className="card p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-dim">
          Members ({members.length})
        </h2>
        <ul className="mt-3 flex flex-col gap-2">
          {members.map((m) => (
            <li
              key={m.userId}
              className="flex items-center justify-between rounded-xl bg-surface-2 px-4 py-2.5"
            >
              <span className="min-w-0">
                <span className="block truncate font-medium">
                  {m.name}
                  {m.userId === me.id && <span className="text-ink-faint"> (you)</span>}
                </span>
                <span className="text-xs text-ink-faint">
                  {m.role === "owner" ? "Owner" : "Member"}
                </span>
              </span>
              {isOwner && m.userId !== me.id && (
                <RemoveMemberButton groupId={id} userId={m.userId} name={m.name} />
              )}
            </li>
          ))}
        </ul>
      </section>

      {isOwner && (
        <GroupEditForm
          groupId={id}
          name={group.name}
          emoji={group.emoji}
          matchThreshold={group.matchThreshold}
          memberCount={members.length}
        />
      )}

      <DangerZone groupId={id} isOwner={isOwner} groupName={group.name} />
    </main>
  );
}
