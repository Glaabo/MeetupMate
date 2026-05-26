import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { AvailabilityEditor } from "./availability-editor";

type Props = { params: Promise<{ id: string }> };

export default async function AvailabilityPage({ params }: Props) {
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
        title={`My availability — ${membership.group.name}`}
        backHref={`/groups/${id}`}
      />
      <AvailabilityEditor groupId={id} groupName={membership.group.name} />
    </>
  );
}
