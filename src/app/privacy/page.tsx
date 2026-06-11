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
        MeetupMate is built so that even the people running the server can&apos;t see your
        availability. Here is exactly how that works and what is stored.
      </p>

      <div className="mt-8 flex flex-col gap-6 text-sm leading-relaxed text-ink-dim [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-ink">
        <section>
          <h2>End-to-end encrypted availability</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              Every group has a secret key that is generated in your browser and never sent to
              the server. It travels to friends inside the invite link&apos;s #fragment, which
              browsers don&apos;t transmit to servers.
            </li>
            <li>
              The days you mark are encrypted on your device (AES-256-GCM) before they leave
              it. The server stores only unreadable ciphertext — it cannot see who is free
              when, and neither can the person hosting the app.
            </li>
            <li>
              Matching days are computed on your device after decrypting your group&apos;s
              data locally.
            </li>
            <li>
              The flip side: if every member loses the group key, the marked days are
              unrecoverable. You can back up the key from the group settings.
            </li>
          </ul>
        </section>

        <section>
          <h2>What the server does store</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Your display name and email address (for signing in).</li>
            <li>A salted hash of your password — never the password itself.</li>
            <li>Group names, who belongs to which group, and encrypted availability blobs.</li>
            <li>Invite links and calendar-feed URLs as cryptographic hashes only.</li>
          </ul>
        </section>

        <section>
          <h2>Calendar sync is an explicit trade-off</h2>
          <p className="mt-2">
            If you enable calendar sync, your device publishes the match days it computed
            (group name + date — never individual availability) to the server in readable
            form, so Google or Apple Calendar can fetch your feed. This is off by default,
            clearly labelled, and disabling it erases all published days immediately.
          </p>
        </section>

        <section>
          <h2>What we don&apos;t do</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>No analytics, no ad networks, no third-party requests, no cookies beyond your session.</li>
            <li>No IP addresses stored with your sessions.</li>
            <li>No plaintext availability — anywhere, ever, for anyone.</li>
          </ul>
        </section>

        <section>
          <h2>Your rights &amp; control</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              Export everything the server stores about you as JSON from{" "}
              <Link href="/settings" className="text-brand hover:underline">
                Settings
              </Link>
              .
            </li>
            <li>Delete your account at any time — all of your data is removed immediately.</li>
            <li>When you leave a group, your encrypted blob for that group is deleted.</li>
          </ul>
        </section>

        <section>
          <h2>Hosting</h2>
          <p className="mt-2">
            MeetupMate is self-hostable open-source software (MIT license). Thanks to
            end-to-end encryption you don&apos;t need to trust the host with your schedule —
            but the host still sees account emails and group membership, so pick someone you
            trust and always serve the app over HTTPS.
          </p>
        </section>
      </div>
    </main>
  );
}
