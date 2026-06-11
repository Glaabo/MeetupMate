import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-xl px-6 py-10">
      <Link href="/" className="text-sm text-ink-dim hover:text-ink">
        ← Back
      </Link>
      <h1 className="mt-4 text-3xl font-bold">Privacy</h1>
      <p className="mt-2 text-ink-dim">
        FreeDay is built to be private by default. Here is exactly what it stores and why.
      </p>

      <div className="mt-8 flex flex-col gap-6 text-sm leading-relaxed text-ink-dim [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-ink">
        <section>
          <h2>What we store</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Your display name and email address (for signing in).</li>
            <li>A salted hash of your password — never the password itself.</li>
            <li>The groups you belong to and the days you mark as free or maybe.</li>
          </ul>
        </section>

        <section>
          <h2>What we don&apos;t do</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>No analytics, no ad networks, no third-party trackers, no cookies beyond your session.</li>
            <li>No IP addresses stored with your sessions.</li>
            <li>Your availability is only visible to members of the same group — never publicly.</li>
            <li>Invite links are stored only as cryptographic hashes and expire after 7 days.</li>
          </ul>
        </section>

        <section>
          <h2>Your rights &amp; control</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              Export everything we store about you as JSON from{" "}
              <Link href="/settings" className="text-brand hover:underline">
                Settings
              </Link>
              .
            </li>
            <li>Delete your account at any time — all of your data is removed immediately.</li>
            <li>When you leave a group, your marked days in that group are deleted.</li>
          </ul>
        </section>

        <section>
          <h2>Hosting</h2>
          <p className="mt-2">
            FreeDay is self-hostable open-source software (MIT license). The data lives in a
            single database controlled by whoever runs the server — ideally you or a friend you
            trust. Always serve the app over HTTPS.
          </p>
        </section>
      </div>
    </main>
  );
}
