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
      <div className="animate-fade-slide-up rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 text-center dark:border-emerald-800/40 dark:bg-emerald-950/40">
        <span className="material-symbols-outlined mb-2 text-3xl text-emerald-600 dark:text-emerald-400">
          check_circle
        </span>
        <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
          Reset Link Dispatched
        </p>
        <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">
          If an authorized account exists for that email, recovery instructions
          have been delivered.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="email"
          className="text-text-secondary text-xs font-semibold tracking-wider uppercase"
        >
          Compliance Account Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="officer@institution.com"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="border-border bg-surface text-text-primary focus:border-brand-blue focus:ring-brand-blue/15 rounded-lg border px-3.5 py-2.5 text-sm transition-all duration-150 outline-none placeholder:text-slate-400 focus:ring-3"
        />
        {status === "error" && (
          <p
            role="alert"
            className="animate-fade-slide-up mt-1 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs font-medium text-rose-700 dark:border-rose-800/40 dark:bg-rose-950/40 dark:text-rose-400"
          >
            Something went wrong. Please try again or contact your
            administrator.
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={status === "submitting"}
        className="bg-brand-navy hover:bg-brand-blue mt-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-150 active:scale-[0.99] disabled:opacity-60"
      >
        {status === "submitting" && <Spinner className="size-4" />}
        {status === "submitting" ? "Sending…" : "Send reset link"}
      </button>
    </form>
  );
}
