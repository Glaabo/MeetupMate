"use client";

import { useActionState, useState, useSyncExternalStore, useTransition } from "react";
import {
  createInvite,
  deleteGroup,
  leaveGroup,
  removeMember,
  updateGroup,
  type FormState,
} from "@/lib/actions/groups";
import { getGroupKey } from "@/lib/group-keys";
import { GROUP_ICONS, IconKey, IconLink } from "@/components/icons";

/* ------------------------------------------------------------------ */

const noopSubscribe = () => () => {};

/** Reads the group key from localStorage without hydration mismatches. */
function useStoredGroupKey(groupId: string): string | null {
  return useSyncExternalStore(
    noopSubscribe,
    () => getGroupKey(groupId),
    () => null,
  );
}

export function InviteSection({ groupId }: { groupId: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();
  const hasKey = useStoredGroupKey(groupId) !== null;

  function generate() {
    setError(null);
    startTransition(async () => {
      const result = await createInvite(groupId);
      if (result.error || !result.url) {
        setError(result.error ?? "Something went wrong.");
        return;
      }
      // The group key rides along in the #fragment, which browsers never
      // send to any server — only the invited friend's device sees it.
      const key = getGroupKey(groupId);
      setUrl(key ? `${result.url}#k=${key}` : result.url);
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
      <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-ink-dim">
        <IconLink className="h-4 w-4" /> Invite friends
      </h2>
      <p className="mt-1 text-sm text-ink-dim">
        Links are valid for 7 days and carry the group&apos;s encryption key in a part of the
        URL that is never sent to the server. Share them privately.
      </p>

      {!hasKey && (
        <p className="mt-2 rounded-lg border border-maybe/40 bg-maybe/10 px-3 py-2 text-xs text-ink-dim">
          This device doesn&apos;t have the group key, so new invite links won&apos;t include
          it. Unlock the calendar first.
        </p>
      )}

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

export function GroupKeySection({ groupId }: { groupId: string }) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const key = useStoredGroupKey(groupId);

  async function copy() {
    if (!key) return;
    await navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section className="card p-5">
      <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-ink-dim">
        <IconKey className="h-4 w-4" /> Group key
      </h2>
      <p className="mt-1 text-sm text-ink-dim">
        The key that encrypts this group&apos;s availability. Save it somewhere safe (e.g. a
        password manager) — if every member loses it, the marked days can&apos;t be recovered,
        not even by the server.
      </p>
      {key ? (
        <div className="mt-3 flex flex-col gap-2">
          <code
            className={`block break-all rounded-xl border border-edge bg-surface-2 px-3 py-2.5 text-xs text-ink-dim ${
              revealed ? "" : "select-none blur-[5px]"
            }`}
          >
            {key}
          </code>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setRevealed((r) => !r)}
              className="btn-ghost flex-1 text-sm"
            >
              {revealed ? "Hide" : "Reveal"}
            </button>
            <button type="button" onClick={copy} className="btn-ghost flex-1 text-sm">
              {copied ? "Copied!" : "Copy key"}
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-3 rounded-lg border border-maybe/40 bg-maybe/10 px-3 py-2 text-xs text-ink-dim">
          This device doesn&apos;t have the key. Open a current invite link or paste the key on
          the calendar page.
        </p>
      )}
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
    if (!confirm(`Remove ${name} from the group? Their marked days will be deleted.`)) return;
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
  icon,
  matchThreshold,
  memberCount,
}: {
  groupId: string;
  name: string;
  icon: string;
  matchThreshold: number;
  memberCount: number;
}) {
  const [selectedIcon, setSelectedIcon] = useState(icon);
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    updateGroup.bind(null, groupId),
    null,
  );

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
        <input type="hidden" name="icon" value={selectedIcon} />
        <div className="flex flex-wrap gap-2">
          {GROUP_ICONS.map(({ slug, label, Component }) => (
            <button
              key={slug}
              type="button"
              onClick={() => setSelectedIcon(slug)}
              aria-pressed={selectedIcon === slug}
              aria-label={label}
              title={label}
              className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-all hover:scale-110 ${
                selectedIcon === slug
                  ? "border-brand bg-brand/15 text-brand"
                  : "border-edge bg-surface-2 text-ink-dim hover:border-edge-strong hover:text-ink"
              }`}
            >
              <Component className="h-5 w-5" />
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
