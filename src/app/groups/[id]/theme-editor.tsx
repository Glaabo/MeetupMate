"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ThemePicker, type ThemePickerValue } from "@/components/ThemePicker";
import type { MeetupTheme } from "@/generated/prisma/enums";

type Props = {
  groupId: string;
  initial: ThemePickerValue;
};

export function ThemeEditor({ groupId, initial }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<ThemePickerValue>(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/groups/${groupId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          theme: value.theme as MeetupTheme,
          boardGameId: value.boardGameId || null,
          penAndPaperId: value.penAndPaperId || null,
          themeNotes: value.themeNotes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          typeof data.error === "string" ? data.error : "Failed to save",
        );
      }
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm font-medium text-emerald-700 underline"
      >
        Change theme
      </button>
    );
  }

  return (
    <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50/50 p-4">
      <ThemePicker value={value} onChange={setValue} />
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={save}
          disabled={loading}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {loading ? "Saving…" : "Save theme"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
