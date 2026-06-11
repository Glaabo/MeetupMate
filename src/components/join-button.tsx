"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { joinGroup } from "@/lib/actions/groups";
import { verifyGroupKey, isValidKeyFormat } from "@/lib/crypto";
import { storeGroupKey } from "@/lib/group-keys";
import { IconKey } from "@/components/icons";

export function JoinButton({
  token,
  keyVerifier,
}: {
  token: string;
  keyVerifier: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [hasKey, setHasKey] = useState<boolean | null>(null);

  // The group key arrives in the URL #fragment, which the server never sees.
  useEffect(() => {
    (async () => {
      const match = location.hash.match(/^#k=([A-Za-z0-9_-]+)$/);
      const key = match?.[1] ?? null;
      if (!key || !isValidKeyFormat(key)) {
        setHasKey(false);
        return;
      }
      if (keyVerifier && !(await verifyGroupKey(key, keyVerifier))) {
        setHasKey(false);
        return;
      }
      setHasKey(true);
    })();
  }, [keyVerifier]);

  function handleJoin() {
    setError(null);
    startTransition(async () => {
      const result = await joinGroup(token);
      if (result.error || !result.groupId) {
        setError(result.error ?? "Something went wrong.");
        return;
      }
      const match = location.hash.match(/^#k=([A-Za-z0-9_-]+)$/);
      if (hasKey && match?.[1]) {
        storeGroupKey(result.groupId, match[1]);
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
      {hasKey === false && (
        <p className="flex items-start gap-2 rounded-lg border border-maybe/40 bg-maybe/10 px-3 py-2 text-left text-xs text-ink-dim">
          <IconKey className="mt-0.5 h-4 w-4 shrink-0" />
          This link doesn&apos;t include the group&apos;s encryption key. You can still join, but
          you&apos;ll need to paste the key (any member can copy it from the group settings) to
          see the calendar.
        </p>
      )}
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
