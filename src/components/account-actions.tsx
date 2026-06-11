"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteAccount } from "@/lib/actions/account";
import { authClient } from "@/lib/auth-client";

export function AccountActions() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSignOut() {
    startTransition(async () => {
      await authClient.signOut();
      router.push("/");
      router.refresh();
    });
  }

  function handleDelete() {
    if (
      !confirm(
        "Permanently delete your account?\n\nAll your marked days are removed. Groups you own are handed to another member, or deleted if you're the only one. This cannot be undone.",
      )
    )
      return;
    setError(null);
    startTransition(async () => {
      const result = await deleteAccount();
      if (result?.error) setError(result.error);
    });
  }

  return (
    <section className="card flex flex-col gap-3 p-5">
      <button type="button" onClick={handleSignOut} disabled={pending} className="btn-ghost">
        Sign out
      </button>
      <button type="button" onClick={handleDelete} disabled={pending} className="btn-danger">
        Delete account &amp; all data
      </button>
      {error && <p className="text-sm text-danger">{error}</p>}
    </section>
  );
}
