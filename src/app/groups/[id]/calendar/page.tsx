import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { GroupCalendar } from "./group-calendar";

type Props = { params: Promise<{ id: string }> };

export default async function CalendarPage({ params }: Props) {
  const session = await requireSession();
  const { id } = await params;

  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: id, userId: session.user.id } },
    include: { group: true },
  });
  if (!membership) notFound();

  return (
    <>
      <AppHeader
        title={`Calendar — ${membership.group.name}`}
        backHref={`/groups/${id}`}
      />
      <GroupCalendar groupId={id} />
    </>
  );
}
