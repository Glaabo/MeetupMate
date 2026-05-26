import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { prisma } from "@/lib/db";
import { effectiveMatchThreshold } from "@/lib/permissions";
import { requireSession } from "@/lib/session";
import { InvitePanel } from "./invite-panel";

type Props = { params: Promise<{ id: string }> };

export default async function GroupPage({ params }: Props) {
  const session = await requireSession();
  const { id } = await params;

  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: id, userId: session.user.id } },
    include: {
      group: {
        include: {
          _count: { select: { members: true } },
          members: {
            include: { user: { select: { name: true, id: true } } },
          },
        },
      },
    },
  });

  if (!membership) notFound();

  const { group } = membership;
  const threshold = effectiveMatchThreshold(
    group.matchThreshold,
    group._count.members,
  );

  return (
    <>
      <AppHeader title={group.name} backHref="/groups" />
      <main className="mx-auto max-w-lg px-4 py-6">
        <p className="mb-4 text-sm text-zinc-600">
          Match when at least <strong>{threshold}</strong> of{" "}
          <strong>{group._count.members}</strong> members are free.
        </p>

        <div className="mb-6 flex flex-col gap-2">
          <Link
            href={`/groups/${id}/calendar`}
            className="rounded-lg bg-emerald-600 px-4 py-3 text-center font-medium text-white"
          >
            Open shared calendar
          </Link>
          <Link
            href={`/groups/${id}/availability`}
            className="rounded-lg border border-zinc-300 px-4 py-3 text-center font-medium"
          >
            Edit my availability
          </Link>
        </div>

        <InvitePanel groupId={id} />

        <section className="mt-8">
          <h2 className="text-sm font-semibold text-zinc-700">Members</h2>
          <ul className="mt-2 divide-y divide-zinc-100 rounded-lg border border-zinc-200 bg-white">
            {group.members.map((m) => (
              <li key={m.user.id} className="px-4 py-2 text-sm">
                {m.user.name}
                {m.role === "OWNER" && (
                  <span className="ml-2 text-xs text-zinc-500">owner</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      </main>
    </>
  );
}
