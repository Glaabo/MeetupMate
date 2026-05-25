"use client";

import { useState } from "react";

export function InvitePanel({ groupId }: { groupId: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function createInvite() {
    setLoading(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error("Failed");
      setUrl(data.url);
    } finally {
      setLoading(false);
    }
  }

  async function copyUrl() {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-4">
      <h2 className="text-sm font-semibold">Invite friends</h2>
      <p className="mt-1 text-xs text-zinc-500">
        Links expire after 7 days. Only share with people you trust.
      </p>
      <button
        type="button"
        onClick={createInvite}
        disabled={loading}
        className="mt-3 w-full rounded-lg border border-emerald-600 py-2 text-sm font-medium text-emerald-700 disabled:opacity-60"
      >
        {loading ? "Generating…" : "Generate invite link"}
      </button>
      {url && (
        <div className="mt-3">
          <p className="break-all text-xs text-zinc-600">{url}</p>
          <button
            type="button"
            onClick={copyUrl}
            className="mt-2 text-sm font-medium text-emerald-700 underline"
          >
            {copied ? "Copied!" : "Copy link"}
          </button>
        </div>
      )}
    </section>
  );
}
