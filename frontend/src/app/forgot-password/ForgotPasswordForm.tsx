"use client";

import { useState, type FormEvent } from "react";

import { Spinner } from "@/components/ui/icons";
import { createClient } from "@/lib/supabase/client";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "submitting" | "sent" | "error"
  >("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });

    setStatus(error ? "error" : "sent");
  }

  if (status === "sent") {
    return (
      <p className="animate-fade-slide-up text-body text-text-primary">
        If an account exists for that email, a reset link has been sent.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-label text-text-secondary">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="text-body border-border bg-surface text-text-primary focus:border-accent focus:ring-accent/30 rounded-md border px-3 py-2 transition-colors outline-none focus:ring-2"
        />
        {status === "error" && (
          <p
            role="alert"
            className="animate-fade-slide-up text-caption text-risk-high"
          >
            Something went wrong. Please try again.
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={status === "submitting"}
        className="text-body bg-accent focus-visible:ring-accent focus-visible:ring-offset-surface mt-2 flex items-center justify-center gap-2 rounded-md px-4 py-2 font-medium text-white transition-all duration-150 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 hover:enabled:-translate-y-px hover:enabled:shadow-md active:enabled:translate-y-0 disabled:opacity-60"
      >
        {status === "submitting" && <Spinner className="size-4" />}
        {status === "submitting" ? "Sending…" : "Send reset link"}
      </button>
    </form>
  );
}
