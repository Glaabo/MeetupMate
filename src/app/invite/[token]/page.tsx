"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function InviteAcceptPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "auth" | "done" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function run() {
      const session = await authClient.getSession();
      if (!session.data?.user) {
        setStatus("auth");
        setMessage("Sign in to join this group.");
        return;
      }
      try {
        const res = await fetch(`/api/invites/${params.token}/accept`, {
          method: "POST",
        });
        const data = await res.json();
        if (!res.ok) {
          setStatus("error");
          setMessage(data.error ?? "Could not accept invite");
          return;
        }
        setStatus("done");
        router.push(`/groups/${data.groupId}`);
        router.refresh();
      } catch {
        setStatus("error");
        setMessage("Something went wrong");
      }
    }
    run();
  }, [params.token, router]);

  return (
    <main className="mx-auto flex min-h-full max-w-lg flex-col justify-center px-6 py-12">
      {status === "loading" && <p>Joining group…</p>}
      {status === "auth" && (
        <>
          <p>{message}</p>
          <Link
            href={`/login?next=/invite/${params.token}`}
            className="mt-4 rounded-lg bg-emerald-600 px-4 py-3 text-center font-medium text-white"
          >
            Sign in
          </Link>
        </>
      )}
      {status === "error" && (
        <>
          <p className="text-red-600">{message}</p>
          <Link href="/groups" className="mt-4 text-emerald-700 underline">
            Your groups
          </Link>
        </>
      )}
    </main>
  );
}
