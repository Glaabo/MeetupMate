"use client";

import { useState, useTransition } from "react";
import { disableCalendarFeed, rotateCalendarFeed } from "@/lib/actions/account";
import { IconSync } from "@/components/icons";

export function CalendarSync({ hasFeed }: { hasFeed: boolean }) {
  const [url, setUrl] = useState<string | null>(null);
  const [active, setActive] = useState(hasFeed);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function generate() {
    setError(null);
    startTransition(async () => {
      const result = await rotateCalendarFeed();
      if (result.error) setError(result.error);
      else {
        setUrl(result.url ?? null);
        setActive(true);
      }
    });
  }

  function disable() {
    setError(null);
    startTransition(async () => {
      await disableCalendarFeed();
      setUrl(null);
      setActive(false);
    });
  }

  async function copy() {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section className="card p-5">
      <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-ink-dim">
        <IconSync className="h-4 w-4" /> Calendar sync
      </h2>
      <p className="mt-1 text-sm text-ink-dim">
        Subscribe from Google or Apple Calendar and your groups&apos; match days appear there
        automatically as all-day events.
      </p>
      <p className="mt-2 rounded-lg bg-brand/5 px-3 py-2 text-xs leading-relaxed text-ink-dim">
        Privacy trade-off: availability is end-to-end encrypted, so the server can&apos;t build
        this feed on its own. Enabling sync lets your device publish the <em>match days it
        computed</em> (group name + date — never who is free when) to the server so your
        calendar app can fetch them. Open a group occasionally to refresh the feed. Disabling
        sync erases all published days immediately.
      </p>

      {url ? (
        <div className="mt-3 flex flex-col gap-3">
          <code className="block break-all rounded-xl border border-edge bg-surface-2 px-3 py-2.5 text-xs text-ink-dim">
            {url}
          </code>
          <button type="button" onClick={copy} className="btn-primary text-sm">
            {copied ? "Copied!" : "Copy feed URL"}
          </button>
          <div className="rounded-xl bg-surface-2 p-3 text-xs leading-relaxed text-ink-dim">
            <p>
              <span className="font-semibold text-ink">Google Calendar:</span> Settings → Add
              calendar → <em>From URL</em> → paste the link.
            </p>
            <p className="mt-1.5">
              <span className="font-semibold text-ink">Apple Calendar:</span> File → New Calendar
              Subscription (Mac) or Settings → Accounts → Add Subscribed Calendar (iPhone) →
              paste the link.
            </p>
            <p className="mt-1.5 text-ink-faint">
              Keep this URL private — anyone who has it can see your match days. You can rotate
              or disable it anytime.
            </p>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={generate}
          disabled={pending}
          className="btn-primary mt-3 w-full text-sm"
        >
          {pending ? "Working…" : active ? "Rotate feed URL (invalidates the old one)" : "Create my calendar feed"}
        </button>
      )}

      {active && (
        <button
          type="button"
          onClick={disable}
          disabled={pending}
          className="btn-ghost mt-2 w-full text-sm"
        >
          Disable feed
        </button>
      )}
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </section>
  );
}
