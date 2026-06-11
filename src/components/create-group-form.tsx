"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createGroup } from "@/lib/actions/groups";
import { encryptJson, generateGroupKey, KEY_VERIFIER_SENTINEL } from "@/lib/crypto";
import { storeGroupKey } from "@/lib/group-keys";
import { GROUP_ICONS, IconLock } from "@/components/icons";

export function CreateGroupForm({ firstGroup }: { firstGroup: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(firstGroup);
  const [icon, setIcon] = useState<string>("calendar");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn-ghost border-dashed">
        + New group
      </button>
    );
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const name = String(new FormData(e.currentTarget).get("name") ?? "").trim();

    startTransition(async () => {
      // The group key is generated here, in the browser, and never sent to
      // the server — only an encrypted sentinel for later key verification.
      const key = await generateGroupKey();
      const keyVerifier = await encryptJson(key, KEY_VERIFIER_SENTINEL);
      const result = await createGroup({ name, icon, keyVerifier });
      if (result.error || !result.groupId) {
        setError(result.error ?? "Something went wrong.");
        return;
      }
      storeGroupKey(result.groupId, key);
      router.push(`/groups/${result.groupId}` as never);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="card flex flex-col gap-4 p-5">
      <h2 className="font-semibold">New group</h2>

      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Group name
        <input
          name="name"
          required
          maxLength={60}
          placeholder="e.g. Friday Football, Book Club…"
          className="input-base"
          autoFocus={!firstGroup}
        />
      </label>

      <div className="flex flex-col gap-1.5 text-sm font-medium">
        Icon
        <div className="flex flex-wrap gap-2">
          {GROUP_ICONS.map(({ slug, label, Component }) => (
            <button
              key={slug}
              type="button"
              onClick={() => setIcon(slug)}
              aria-pressed={icon === slug}
              aria-label={label}
              title={label}
              className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-all hover:scale-110 ${
                icon === slug
                  ? "border-brand bg-brand/15 text-brand"
                  : "border-edge bg-surface-2 text-ink-dim hover:border-edge-strong hover:text-ink"
              }`}
            >
              <Component className="h-5 w-5" />
            </button>
          ))}
        </div>
      </div>

      <p className="flex items-start gap-2 rounded-xl bg-brand/5 px-3 py-2.5 text-xs leading-relaxed text-ink-dim">
        <IconLock className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
        A secret group key is created on this device. Availability is end-to-end encrypted with
        it — the server can never read who&apos;s free when. The key travels to friends inside
        your invite links.
      </p>

      {error && (
        <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button type="submit" disabled={pending} className="btn-primary flex-1">
          {pending ? "Creating…" : "Create group"}
        </button>
        {!firstGroup && (
          <button type="button" onClick={() => setOpen(false)} className="btn-ghost">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
