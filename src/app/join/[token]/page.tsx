import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { groups, invites } from "@/db/schema";
import { JoinButton } from "@/components/join-button";
import { getMembership } from "@/lib/data/groups";
import { hashToken } from "@/lib/ids";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Join group" };

async function findValidInvite(token: string) {
  const rows = await db
    .select({
      groupId: invites.groupId,
      expiresAt: invites.expiresAt,
      groupName: groups.name,
      groupEmoji: groups.emoji,
    })
    .from(invites)
    .innerJoin(groups, eq(groups.id, invites.groupId))
    .where(eq(invites.tokenHash, hashToken(token)))
    .limit(1);

  const invite = rows[0];
  if (!invite || invite.expiresAt.getTime() < Date.now()) return null;
  return invite;
}

export default async function JoinPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const session = await getSession();

  if (!session) {
    redirect(`/login?next=${encodeURIComponent(`/join/${token}`)}`);
  }

  const invite = await findValidInvite(token);

  if (invite) {
    const membership = await getMembership(invite.groupId, session.user.id);
    if (membership) redirect(`/groups/${invite.groupId}`);
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center px-6 py-10 text-center">
      <div className="photo-backdrop" style={{ backgroundImage: "url(/images/beach.webp)" }} />
      {invite ? (
        <div className="card flex w-full flex-col items-center gap-4 p-8">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-2 text-3xl">
            {invite.groupEmoji}
          </span>
          <div>
            <h1 className="text-xl font-bold">You&apos;re invited!</h1>
            <p className="mt-1 text-sm text-ink-dim">
              Join <span className="font-semibold text-ink">{invite.groupName}</span>
              {" to share which days you're free."}
            </p>
          </div>
          <JoinButton token={token} />
          <Link href="/groups" className="text-sm text-ink-dim hover:text-ink">
            Not now
          </Link>
        </div>
      ) : (
        <div className="card flex w-full flex-col items-center gap-4 p-8">
          <span className="text-3xl">😕</span>
          <h1 className="text-xl font-bold">Invite link expired</h1>
          <p className="text-sm text-ink-dim">
            This invite link is invalid or has expired. Ask your friend to send you a new one.
          </p>
          <Link href="/groups" className="btn-primary">
            Go to my groups
          </Link>
        </div>
      )}
    </main>
  );
}
