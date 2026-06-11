import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export default async function LandingPage() {
  const session = await getSession();
  if (session) redirect("/groups");

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-6 py-10">
      <div className="photo-backdrop" style={{ backgroundImage: "url(/images/forest.webp)" }} />
      <header className="flex items-center justify-between">
        <span className="text-xl font-bold tracking-tight">
          Meetup<span className="brand-text">Mate</span>
        </span>
        <Link href="/login" className="btn-ghost px-4 py-2 text-sm">
          Sign in
        </Link>
      </header>

      <section className="flex flex-1 flex-col items-center justify-center gap-6 py-16 text-center">
        <span className="card px-3 py-1 text-xs font-medium text-ink-dim">
          Plan less. Meet more.
        </span>
        <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
          Find days that work <span className="brand-text">for everyone</span>
        </h1>
        <p className="max-w-md text-base text-ink-dim">
          Mark the days you&apos;re free, invite your friends, and instantly see
          which days the whole group can meet — no more endless group-chat polls.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/signup" className="btn-primary px-8 py-3">
            Get started — it&apos;s free
          </Link>
          <Link href="/login" className="btn-ghost px-8 py-3">
            I have an account
          </Link>
        </div>
      </section>

      <section className="grid gap-4 pb-10 sm:grid-cols-3">
        {[
          {
            emoji: "🗓️",
            title: "Mark free days",
            text: "Tap days you're free or could make work — per group.",
          },
          {
            emoji: "✨",
            title: "See matches",
            text: "Days where everyone is free light up automatically.",
          },
          {
            emoji: "🔒",
            title: "Private by design",
            text: "Invite-only groups, no tracking, export or delete anytime.",
          },
        ].map((f) => (
          <div
            key={f.title}
            className="card p-5 transition-transform duration-200 hover:-translate-y-1 hover:border-edge-strong"
          >
            <div className="text-2xl">{f.emoji}</div>
            <h2 className="mt-2 font-semibold">{f.title}</h2>
            <p className="mt-1 text-sm text-ink-dim">{f.text}</p>
          </div>
        ))}
      </section>

      <footer className="flex items-center justify-center gap-4 pb-4 text-xs text-ink-faint">
        <Link href="/privacy" className="hover:text-ink-dim">
          Privacy
        </Link>
        <span>·</span>
        <span>Open source (MIT)</span>
      </footer>
    </main>
  );
}
