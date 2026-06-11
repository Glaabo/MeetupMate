import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { calendarFeeds } from "@/db/schema";
import { AccountActions } from "@/components/account-actions";
import { CalendarSync } from "@/components/calendar-sync";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Account" };

export default async function SettingsPage() {
  const me = await requireUser();
  const feeds = await db
    .select({ id: calendarFeeds.id })
    .from(calendarFeeds)
    .where(eq(calendarFeeds.userId, me.id))
    .limit(1);

  return (
    <main className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold">Account</h1>
        <p className="mt-1 text-sm text-ink-dim">Manage your account and your data.</p>
      </div>

      <section className="card p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-dim">Profile</h2>
        <dl className="mt-3 flex flex-col gap-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-ink-dim">Name</dt>
            <dd className="font-medium">{me.name}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink-dim">Email</dt>
            <dd className="font-medium">{me.email}</dd>
          </div>
        </dl>
      </section>

      <CalendarSync hasFeed={feeds.length > 0} />

      <section className="card p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-dim">
          Your data
        </h2>
        <p className="mt-1 text-sm text-ink-dim">
          MeetupMate only stores your name, email, and the days you mark. No tracking, no
          analytics, no third parties. Read the{" "}
          <Link href="/privacy" className="text-brand hover:underline">
            privacy policy
          </Link>
          .
        </p>
        <a href="/api/account/export" download className="btn-ghost mt-3 w-full text-sm">
          Download my data (JSON)
        </a>
      </section>

      <AccountActions />
    </main>
  );
}
