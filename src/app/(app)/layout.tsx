import Link from "next/link";
import { IconPerson, LogoMark } from "@/components/icons";
import { requireUser } from "@/lib/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireUser();

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-4 pb-12 sm:px-6">
      <header className="sticky top-0 z-20 -mx-4 mb-4 border-b border-edge bg-bg/80 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6">
        <div className="flex items-center justify-between">
          <Link href="/groups" className="flex items-center gap-2 text-lg font-bold tracking-tight">
            <LogoMark className="h-5 w-5 text-brand" />
            <span>
              Meetup<span className="brand-text">Mate</span>
            </span>
          </Link>
          <Link
            href="/settings"
            aria-label="Account settings"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-edge-strong text-ink-dim transition-colors hover:bg-brand/5 hover:text-ink"
          >
            <IconPerson className="h-[18px] w-[18px]" />
          </Link>
        </div>
      </header>
      {children}
    </div>
  );
}
