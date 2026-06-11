"use client";

import { useActionState, useState } from "react";
import { createGroup, type FormState } from "@/lib/actions/groups";

const EMOJI_CHOICES = ["📅", "🍻", "⚽", "🎲", "🎬", "🏔️", "🍝", "🎮", "🧗", "🏖️"];

export function CreateGroupForm({ firstGroup }: { firstGroup: boolean }) {
  const [open, setOpen] = useState(firstGroup);
  const [emoji, setEmoji] = useState("📅");
  const [state, formAction, pending] = useActionState<FormState, FormData>(createGroup, null);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn-ghost border-dashed">
        + New group
      </button>
    );
  }

  return (
    <form action={formAction} className="card flex flex-col gap-4 p-5">
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
        <input type="hidden" name="emoji" value={emoji} />
        <div className="flex flex-wrap gap-2">
          {EMOJI_CHOICES.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setEmoji(e)}
              aria-pressed={emoji === e}
              className={`flex h-10 w-10 items-center justify-center rounded-xl border text-xl transition-all hover:scale-110 ${
                emoji === e
                  ? "border-brand bg-brand/15"
                  : "border-edge bg-surface-2 hover:border-edge-strong"
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      {state?.error && (
        <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
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
