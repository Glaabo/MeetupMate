import Link from "next/link";
import { requireUser } from "@/lib/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireUser();

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-4 pb-12 sm:px-6">
      <header className="sticky top-0 z-20 -mx-4 mb-4 border-b border-edge bg-bg/80 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6">
        <div className="flex items-center justify-between">
          <Link href="/groups" className="text-lg font-bold tracking-tight">
            Meetup<span className="brand-text">Mate</span>
          </Link>
          <Link
            href="/settings"
            aria-label="Account settings"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-edge-strong text-ink-dim transition-colors hover:bg-brand/5 hover:text-ink"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" />
            </svg>
          </Link>
        </div>
      </header>
      {children}
    </div>
  );
}
