import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-lg px-6 py-10 prose prose-zinc">
      <Link href="/" className="text-sm text-emerald-700 no-underline">
        Home
      </Link>
      <h1 className="mt-4 text-2xl font-bold">Privacy policy</h1>
      <p className="text-sm text-zinc-600">Last updated: May 2026</p>

      <h2 className="mt-6 text-lg font-semibold">What we store</h2>
      <ul className="list-disc pl-5 text-sm text-zinc-700">
        <li>Account: email, display name, and authentication records.</li>
        <li>Groups: name, membership, and match rules you configure.</li>
        <li>Availability: calendar days you mark as free, per group.</li>
        <li>Invites: hashed tokens (not the raw link) with expiry.</li>
      </ul>

      <h2 className="mt-6 text-lg font-semibold">What we do not do</h2>
      <ul className="list-disc pl-5 text-sm text-zinc-700">
        <li>No import of Google/Apple calendars in v1.</li>
        <li>No third-party analytics or advertising trackers in the app.</li>
        <li>No selling of personal data.</li>
      </ul>

      <h2 className="mt-6 text-lg font-semibold">Your rights</h2>
      <p className="text-sm text-zinc-700">
        From Settings you can export all data tied to your account or delete
        your account, which removes sessions, memberships, availability, and
        groups you solely own (cascade rules apply via the database).
      </p>

      <h2 className="mt-6 text-lg font-semibold">Hosting</h2>
      <p className="text-sm text-zinc-700">
        When self-hosted, you control region and retention. For cloud deploys,
        choose a region close to your users and configure database backups.
      </p>
    </main>
  );
}
