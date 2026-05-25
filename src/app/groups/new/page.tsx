"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";

export default function NewGroupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [matchAll, setMatchAll] = useState(true);
  const [minMembers, setMinMembers] = useState(2);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          matchThreshold: matchAll ? 0 : minMembers,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.toString() ?? "Failed to create group");
      router.push(`/groups/${data.group.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <AppHeader title="New group" backHref="/groups" />
      <main className="mx-auto max-w-lg px-4 py-6">
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-1 text-sm">
            Group name
            <input
              className="rounded-lg border border-zinc-300 px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={100}
            />
          </label>
          <fieldset className="rounded-lg border border-zinc-200 p-4 text-sm">
            <legend className="px-1 font-medium">Highlight days when</legend>
            <label className="mt-2 flex items-center gap-2">
              <input
                type="radio"
                checked={matchAll}
                onChange={() => setMatchAll(true)}
              />
              Everyone is available
            </label>
            <label className="mt-2 flex items-center gap-2">
              <input
                type="radio"
                checked={!matchAll}
                onChange={() => setMatchAll(false)}
              />
              At least
              <input
                type="number"
                min={1}
                className="w-16 rounded border border-zinc-300 px-2 py-1"
                value={minMembers}
                onChange={(e) => setMinMembers(Number(e.target.value))}
                disabled={matchAll}
              />
              members are available
            </label>
          </fieldset>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-emerald-600 py-3 font-medium text-white disabled:opacity-60"
          >
            {loading ? "Creating…" : "Create group"}
          </button>
        </form>
      </main>
    </>
  );
}
