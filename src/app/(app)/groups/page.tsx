import type { Metadata } from "next";
import Link from "next/link";
import { CreateGroupForm } from "@/components/create-group-form";
import { getGroupsForUser } from "@/lib/data/groups";
import { formatISODate } from "@/lib/dates";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Your groups" };

export default async function GroupsPage() {
  const me = await requireUser();
  const myGroups = await getGroupsForUser(me.id);

  return (
    <main className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Hey {me.name.split(" ")[0]} 👋</h1>
        <p className="mt-1 text-sm text-ink-dim">
          {myGroups.length === 0
            ? "Create your first group to start finding days together."
            : "Pick a group to mark your free days."}
        </p>
      </div>

      {myGroups.length > 0 && (
        <ul className="flex flex-col gap-3">
          {myGroups.map((g) => (
            <li key={g.id}>
              <Link
                href={`/groups/${g.id}`}
                className="card group flex items-center gap-4 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-edge-strong hover:shadow-[0_8px_30px_rgba(29,80,58,0.15)]"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-2xl">
                  {g.emoji}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{g.name}</span>
                  <span className="mt-0.5 block text-sm text-ink-dim">
                    {g.memberCount} {g.memberCount === 1 ? "member" : "members"}
                    {g.role === "owner" && " · you own this"}
                  </span>
                </span>
                <span className="text-right">
                  {g.nextMatch ? (
                    <>
                      <span className="block text-xs font-medium uppercase tracking-wide text-match">
                        Next match
                      </span>
                      <span className="block text-sm font-semibold">
                        {formatISODate(g.nextMatch)}
                      </span>
                    </>
                  ) : (
                    <span className="text-xs text-ink-faint">No match yet</span>
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <CreateGroupForm firstGroup={myGroups.length === 0} />
    </main>
  );
}
