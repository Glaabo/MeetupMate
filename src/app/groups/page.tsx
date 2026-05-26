import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { GroupSwitcher } from "@/components/GroupSwitcher";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/session";

export default async function GroupsPage() {
  const session = await requireSession();

  const memberships = await prisma.groupMember.findMany({
    where: { userId: session.user.id },
    include: {
      group: { include: { _count: { select: { members: true } } } },
    },
    orderBy: { joinedAt: "desc" },
  });

  const groups = memberships.map((m) => ({
    id: m.group.id,
    name: m.group.name,
    memberCount: m.group._count.members,
  }));

  return (
    <>
      <AppHeader title="Your groups" />
      <main className="mx-auto max-w-lg px-4 py-6">
        <Link
          href="/groups/new"
          className="mb-6 block rounded-lg border border-dashed border-emerald-500 px-4 py-3 text-center font-medium text-emerald-700"
        >
          Create a group
        </Link>
        {groups.length === 0 ? (
          <p className="text-center text-zinc-500">
            No groups yet. Create one and invite friends.
          </p>
        ) : (
          <GroupSwitcher groups={groups} />
        )}
      </main>
    </>
  );
}
