import type { Metadata } from "next";
import { CreateGroupForm } from "@/components/create-group-form";
import { GroupList, type GroupListEntry } from "@/components/group-list";
import { getBlobsForGroups, getGroupsForUser } from "@/lib/data/groups";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Your groups" };

export default async function GroupsPage() {
  const me = await requireUser();
  const myGroups = await getGroupsForUser(me.id);
  const blobsByGroup = await getBlobsForGroups(myGroups.map((g) => g.id));

  const entries: GroupListEntry[] = myGroups.map((g) => ({
    ...g,
    blobs: (blobsByGroup.get(g.id) ?? []).map((b) => ({
      userId: b.userId,
      ciphertext: b.ciphertext,
    })),
  }));

  return (
    <main className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Hey {me.name.split(" ")[0]}</h1>
        <p className="mt-1 text-sm text-ink-dim">
          {myGroups.length === 0
            ? "Create your first group to start finding days together."
            : "Pick a group to mark your free days."}
        </p>
      </div>

      {entries.length > 0 && <GroupList groups={entries} />}

      <CreateGroupForm firstGroup={myGroups.length === 0} />
    </main>
  );
}
