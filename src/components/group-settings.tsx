"use client";

import { useActionState, useState, useTransition } from "react";
import {
  createInvite,
  deleteGroup,
  leaveGroup,
  removeMember,
  updateGroup,
  type FormState,
} from "@/lib/actions/groups";

const EMOJI_CHOICES = ["📅", "🍻", "⚽", "🎲", "🎬", "🏔️", "🍝", "🎮", "🧗", "🏖️"];

/* ------------------------------------------------------------------ */

export function InviteSection({ groupId }: { groupId: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  function generate() {
    setError(null);
    startTransition(async () => {
      const result = await createInvite(groupId);
      if (result.error) setError(result.error);
      else setUrl(result.url ?? null);
    });
  }

  async function copy() {
    if (!url) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Join my MeetupMate group", url });
        return;
      } catch {
        // fall through to clipboard
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section className="card p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-dim">
        Invite friends
      </h2>
      <p className="mt-1 text-sm text-ink-dim">
        Links are valid for 7 days. Anyone with the link can join this group.
      </p>

      {url ? (
        <div className="mt-3 flex flex-col gap-2">
          <code className="block truncate rounded-xl border border-edge bg-surface-2 px-3 py-2.5 text-xs text-ink-dim">
            {url}
          </code>
          <div className="flex gap-2">
            <button type="button" onClick={copy} className="btn-primary flex-1 text-sm">
              {copied ? "Copied!" : "Copy / share link"}
            </button>
            <button
              type="button"
              onClick={generate}
              disabled={pending}
              className="btn-ghost text-sm"
            >
              New link
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={generate}
          disabled={pending}
          className="btn-primary mt-3 w-full text-sm"
        >
          {pending ? "Creating…" : "Create invite link"}
        </button>
      )}
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </section>
  );
}

/* ------------------------------------------------------------------ */

export function RemoveMemberButton({
  groupId,
  userId,
  name,
}: {
  groupId: string;
  userId: string;
  name: string;
}) {
  const [pending, startTransition] = useTransition();

  function handleRemove() {
    if (!confirm(`Remove ${name} from the group? Their marked days will stay hidden until they rejoin.`)) return;
    startTransition(async () => {
      await removeMember(groupId, userId);
    });
  }

  return (
    <button
      type="button"
      onClick={handleRemove}
      disabled={pending}
      className="rounded-lg px-2.5 py-1 text-xs font-semibold text-danger transition-colors hover:bg-danger/10"
    >
      Remove
    </button>
  );
}

/* ------------------------------------------------------------------ */

export function GroupEditForm({
  groupId,
  name,
  emoji,
  matchThreshold,
  memberCount,
}: {
  groupId: string;
  name: string;
  emoji: string;
  matchThreshold: number;
  memberCount: number;
}) {
  const [selectedEmoji, setSelectedEmoji] = useState(emoji);
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    updateGroup.bind(null, groupId),
    null,
  );

  const emojis = EMOJI_CHOICES.includes(emoji) ? EMOJI_CHOICES : [emoji, ...EMOJI_CHOICES];

  return (
    <form action={formAction} className="card flex flex-col gap-4 p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-dim">
        Edit group
      </h2>

      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Group name
        <input name="name" defaultValue={name} required maxLength={60} className="input-base" />
      </label>

      <div className="flex flex-col gap-1.5 text-sm font-medium">
        Icon
        <input type="hidden" name="emoji" value={selectedEmoji} />
        <div className="flex flex-wrap gap-2">
          {emojis.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setSelectedEmoji(e)}
              aria-pressed={selectedEmoji === e}
              className={`flex h-10 w-10 items-center justify-center rounded-xl border text-xl transition-all hover:scale-110 ${
                selectedEmoji === e
                  ? "border-brand bg-brand/15"
                  : "border-edge bg-surface-2 hover:border-edge-strong"
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Members needed for a match
        <select name="matchThreshold" defaultValue={matchThreshold} className="input-base">
          <option value={0}>Everyone in the group</option>
          {Array.from({ length: Math.max(memberCount, 2) - 1 }).map((_, i) => (
            <option key={i + 2} value={i + 2}>
              At least {i + 2} people
            </option>
          ))}
        </select>
      </label>

      {state?.error && (
        <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}

/* ------------------------------------------------------------------ */

export function DangerZone({
  groupId,
  isOwner,
  groupName,
}: {
  groupId: string;
  isOwner: boolean;
  groupName: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleLeave() {
    if (!confirm(`Leave “${groupName}”? Your marked days in this group will be removed.`)) return;
    setError(null);
    startTransition(async () => {
      const result = await leaveGroup(groupId);
      if (result?.error) setError(result.error);
    });
  }

  function handleDelete() {
    if (
      !confirm(
        `Delete “${groupName}” for everyone? This removes the shared calendar and all marked days. This cannot be undone.`,
      )
    )
      return;
    setError(null);
    startTransition(async () => {
      const result = await deleteGroup(groupId);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <section className="card flex flex-col gap-3 border-danger/20 p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-danger">Danger zone</h2>
      <button type="button" onClick={handleLeave} disabled={pending} className="btn-danger">
        Leave group
      </button>
      {isOwner && (
        <button type="button" onClick={handleDelete} disabled={pending} className="btn-danger">
          Delete group for everyone
        </button>
      )}
      {error && <p className="text-sm text-danger">{error}</p>}
    </section>
  );
}
