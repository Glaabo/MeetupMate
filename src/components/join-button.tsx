"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { joinGroup } from "@/lib/actions/groups";

export function JoinButton({ token }: { token: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleJoin() {
    setError(null);
    startTransition(async () => {
      const result = await joinGroup(token);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push(`/groups/${result.groupId}` as never);
      router.refresh();
    });
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <button type="button" onClick={handleJoin} disabled={pending} className="btn-primary w-full">
        {pending ? "Joining…" : "Join group"}
      </button>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
