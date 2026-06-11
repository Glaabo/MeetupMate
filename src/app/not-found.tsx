import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="text-4xl">🧭</span>
      <h1 className="text-2xl font-bold">Page not found</h1>
      <p className="text-sm text-ink-dim">
        This page doesn&apos;t exist, or you don&apos;t have access to it.
      </p>
      <Link href="/groups" className="btn-primary mt-2">
        Go to my groups
      </Link>
    </main>
  );
}
