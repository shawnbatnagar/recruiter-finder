"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function signInWithGoogle() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  async function signInWithEmail(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
    } else {
      setStatus("sent");
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 items-center justify-center px-6 sm:px-10">
      <div className="w-full max-w-sm border border-rule bg-paper-dim px-8 py-10">
        <p className="font-mono text-xs tracking-[0.2em] text-ink-soft uppercase">
          Sign in
        </p>
        <h1 className="mt-2 text-2xl font-medium">Access the index</h1>

        <button
          onClick={signInWithGoogle}
          className="mt-8 w-full border border-rule py-3 font-mono text-xs tracking-[0.15em] text-ink uppercase transition-colors hover:bg-accent hover:text-paper"
        >
          Continue with Google
        </button>

        <div className="my-6 flex items-center gap-3 font-mono text-[11px] text-ink-soft">
          <div className="h-px flex-1 bg-rule" />
          or
          <div className="h-px flex-1 bg-rule" />
        </div>

        <form onSubmit={signInWithEmail} className="flex flex-col gap-3">
          <input
            type="email"
            required
            placeholder="you@school.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-rule bg-transparent px-3 py-3 font-mono text-sm text-ink placeholder:text-ink-soft/70 focus:outline-none"
          />
          <button
            type="submit"
            className="border border-ink bg-ink py-3 font-mono text-xs tracking-[0.15em] text-paper uppercase transition-colors hover:bg-accent hover:border-accent"
          >
            Send magic link
          </button>
        </form>

        {status === "sent" && (
          <p className="mt-4 font-mono text-xs text-positive">
            Check your email for a sign-in link.
          </p>
        )}
        {status === "error" && (
          <p className="mt-4 font-mono text-xs text-accent">{errorMessage}</p>
        )}
      </div>
    </main>
  );
}
