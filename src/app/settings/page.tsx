"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { authClient } from "@/lib/auth-client";

export default function SettingsPage() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);

  async function exportData() {
    const res = await fetch("/api/user/export");
    if (!res.ok) {
      setMessage("Export failed");
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "meetupmate-export.json";
    a.click();
    URL.revokeObjectURL(url);
    setMessage("Export downloaded");
  }

  async function deleteAccount() {
    if (
      !confirm(
        "Delete your account and all availability data? This cannot be undone.",
      )
    ) {
      return;
    }
    const res = await fetch("/api/user/delete", { method: "DELETE" });
    if (!res.ok) {
      setMessage("Delete failed");
      return;
    }
    await authClient.signOut();
    router.push("/");
    router.refresh();
  }

  async function signOut() {
    await authClient.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <>
      <AppHeader title="Settings" backHref="/groups" />
      <main className="mx-auto max-w-lg px-4 py-6">
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={exportData}
            className="rounded-lg border border-zinc-300 px-4 py-3 text-left text-sm font-medium"
          >
            Download my data (JSON)
          </button>
          <Link
            href="/privacy"
            className="rounded-lg border border-zinc-300 px-4 py-3 text-sm font-medium"
          >
            Privacy policy
          </Link>
          <button
            type="button"
            onClick={signOut}
            className="rounded-lg border border-zinc-300 px-4 py-3 text-left text-sm font-medium"
          >
            Sign out
          </button>
          <button
            type="button"
            onClick={deleteAccount}
            className="rounded-lg border border-red-300 px-4 py-3 text-left text-sm font-medium text-red-700"
          >
            Delete account
          </button>
        </div>
        {message && (
          <p className="mt-4 text-sm text-zinc-600">{message}</p>
        )}
      </main>
    </>
  );
}
