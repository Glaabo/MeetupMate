import Link from "next/link";

export type GroupSummary = {
  id: string;
  name: string;
  memberCount: number;
};

export function GroupSwitcher({
  groups,
  currentGroupId,
}: {
  groups: GroupSummary[];
  currentGroupId?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      {groups.map((g) => (
        <Link
          key={g.id}
          href={`/groups/${g.id}`}
          className={`rounded-lg border px-4 py-3 text-left ${
            g.id === currentGroupId
              ? "border-emerald-600 bg-emerald-50"
              : "border-zinc-200 bg-white"
          }`}
        >
          <div className="font-medium">{g.name}</div>
          <div className="text-sm text-zinc-500">{g.memberCount} members</div>
        </Link>
      ))}
    </div>
  );
}
