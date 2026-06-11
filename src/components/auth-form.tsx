"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { LogoMark } from "@/components/icons";

function AuthFormInner({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const next = searchParams.get("next");
  const callbackPath = next && next.startsWith("/") ? next : "/groups";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));

    const result =
      mode === "signup"
        ? await authClient.signUp.email({
            name: String(form.get("name")),
            email,
            password,
          })
        : await authClient.signIn.email({ email, password });

    if (result.error) {
      setError(result.error.message ?? "Something went wrong. Please try again.");
      setPending(false);
      return;
    }
    router.push(callbackPath as never);
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6 py-10">
      <div className="photo-backdrop" style={{ backgroundImage: "url(/images/forest.webp)" }} />
      <Link href="/" className="mb-8 flex items-center justify-center gap-2 text-xl font-bold tracking-tight">
        <LogoMark className="h-6 w-6 text-brand" />
        <span>
          Meetup<span className="brand-text">Mate</span>
        </span>
      </Link>

      <div className="card p-6 sm:p-8">
        <h1 className="text-2xl font-bold">
          {mode === "signup" ? "Create your account" : "Welcome back"}
        </h1>
        <p className="mt-1 text-sm text-ink-dim">
          {mode === "signup"
            ? "Only a name, email and password — nothing else."
            : "Sign in to see your groups."}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          {mode === "signup" && (
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Display name
              <input
                name="name"
                required
                maxLength={50}
                autoComplete="name"
                placeholder="How your friends know you"
                className="input-base"
              />
            </label>
          )}
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Email
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="input-base"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Password
            <input
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              placeholder={mode === "signup" ? "At least 8 characters" : "Your password"}
              className="input-base"
            />
          </label>

          {error && (
            <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}

          <button type="submit" disabled={pending} className="btn-primary mt-2">
            {pending ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
          </button>
        </form>
      </div>

      <p className="mt-6 text-center text-sm text-ink-dim">
        {mode === "signup" ? (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-brand hover:underline">
              Sign in
            </Link>
          </>
        ) : (
          <>
            New here?{" "}
            <Link href="/signup" className="font-semibold text-brand hover:underline">
              Create an account
            </Link>
          </>
        )}
      </p>
    </main>
  );
}

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  return (
    <Suspense>
      <AuthFormInner mode={mode} />
    </Suspense>
  );
}
