"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      if (isSignUp) {
        const { error } = await authClient.signUp.email({
          email,
          password,
          name: name || email.split("@")[0] || "User",
        });
        if (error) throw new Error(error.message);
      } else {
        const { error } = await authClient.signIn.email({ email, password });
        if (error) throw new Error(error.message);
      }
      router.push("/groups");
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleMagicSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const { error } = await authClient.signIn.magicLink({ email });
      if (error) throw new Error(error.message);
      setMessage(
        "If email is configured, check your inbox. Otherwise the link was logged on the server console (development).",
      );
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto min-h-full max-w-lg px-6 py-10">
      <Link href="/" className="text-sm text-emerald-700">
        Home
      </Link>
      <h1 className="mt-4 text-2xl font-bold">
        {isSignUp ? "Create account" : "Sign in"}
      </h1>

      <div className="mt-4 flex gap-2 text-sm">
        <button
          type="button"
          className={`rounded px-3 py-1 ${mode === "password" ? "bg-emerald-100 font-medium" : "bg-zinc-100"}`}
          onClick={() => setMode("password")}
        >
          Email & password
        </button>
        <button
          type="button"
          className={`rounded px-3 py-1 ${mode === "magic" ? "bg-emerald-100 font-medium" : "bg-zinc-100"}`}
          onClick={() => setMode("magic")}
        >
          Magic link
        </button>
      </div>

      {mode === "password" ? (
        <form className="mt-6 flex flex-col gap-4" onSubmit={handlePasswordSubmit}>
          {isSignUp && (
            <label className="flex flex-col gap-1 text-sm">
              Display name
              <input
                className="rounded-lg border border-zinc-300 px-3 py-2"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </label>
          )}
          <label className="flex flex-col gap-1 text-sm">
            Email
            <input
              type="email"
              className="rounded-lg border border-zinc-300 px-3 py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Password
            <input
              type="password"
              className="rounded-lg border border-zinc-300 px-3 py-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-emerald-600 py-3 font-medium text-white disabled:opacity-60"
          >
            {loading ? "Please wait…" : isSignUp ? "Sign up" : "Sign in"}
          </button>
        </form>
      ) : (
        <form className="mt-6 flex flex-col gap-4" onSubmit={handleMagicSubmit}>
          <label className="flex flex-col gap-1 text-sm">
            Email
            <input
              type="email"
              className="rounded-lg border border-zinc-300 px-3 py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-emerald-600 py-3 font-medium text-white disabled:opacity-60"
          >
            {loading ? "Sending…" : "Send magic link"}
          </button>
        </form>
      )}

      {message && (
        <p className="mt-4 rounded-lg bg-zinc-100 px-3 py-2 text-sm text-zinc-700">
          {message}
        </p>
      )}

      <button
        type="button"
        className="mt-6 text-sm text-emerald-700 underline"
        onClick={() => setIsSignUp((v) => !v)}
      >
        {isSignUp
          ? "Already have an account? Sign in"
          : "Need an account? Sign up"}
      </button>
    </main>
  );
}
