import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export default async function HomePage() {
  const session = await getSession();
  if (session) {
    redirect("/groups");
  }

  return (
    <main className="mx-auto flex min-h-full max-w-lg flex-col justify-center px-6 py-12">
      <h1 className="text-3xl font-bold tracking-tight">MeetupMate</h1>
      <p className="mt-3 text-zinc-600">
        Mark days you are free, invite friends to a group, and see when everyone
        can meet. Minimal data, no calendar scraping.
      </p>
      <div className="mt-8 flex flex-col gap-3">
        <Link
          href="/login"
          className="rounded-lg bg-emerald-600 px-4 py-3 text-center font-medium text-white"
        >
          Sign in
        </Link>
        <Link
          href="/privacy"
          className="text-center text-sm text-zinc-500 underline"
        >
          Privacy policy
        </Link>
      </div>
    </main>
  );
}
