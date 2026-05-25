import Link from "next/link";

export function AppHeader({
  title,
  backHref,
}: {
  title: string;
  backHref?: string;
}) {
  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-lg items-center gap-3">
        {backHref && (
          <Link
            href={backHref}
            className="text-sm font-medium text-emerald-700"
          >
            Back
          </Link>
        )}
        <h1 className="flex-1 truncate text-lg font-semibold">{title}</h1>
        <Link href="/settings" className="text-sm text-zinc-600">
          Settings
        </Link>
      </div>
    </header>
  );
}
