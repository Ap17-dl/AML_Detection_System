"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { EyeIcon, EyeOffIcon, Spinner } from "@/components/ui/icons";
import { createClient } from "@/lib/supabase/client";

const INPUT_CLASSES =
  "text-sm rounded-lg border border-border bg-surface px-3.5 py-2.5 text-text-primary transition-all duration-150 outline-none focus:border-brand-blue focus:ring-3 focus:ring-brand-blue/15 placeholder:text-slate-400";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const apiBase =
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

    // If demo account email, authenticate directly via dev-login
    if (email.endsWith("@aml.local")) {
      try {
        const res = await fetch(`${apiBase}/api/v1/auth/dev-login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        if (res.ok) {
          const data = await res.json();
          document.cookie = `aml_dev_token=${data.access_token}; path=/; max-age=604800; SameSite=Lax`;
          setIsSubmitting(false);
          router.push("/dashboard");
          router.refresh();
          return;
        }
      } catch {
        // Fall back to Supabase
      }
    }

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setIsSubmitting(false);
        setError("Incorrect email or password.");
        return;
      }
    } catch {
      setIsSubmitting(false);
      setError("Unable to authenticate with server. Try demo personas below.");
      return;
    }

    setIsSubmitting(false);
    router.push("/dashboard");
    router.refresh();
  }

  async function handleDemoLogin(demoEmail: string) {
    setError(null);
    setIsSubmitting(true);
    const apiBase =
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
    try {
      const res = await fetch(`${apiBase}/api/v1/auth/dev-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: demoEmail }),
      });
      if (res.ok) {
        const data = await res.json();
        document.cookie = `aml_dev_token=${data.access_token}; path=/; max-age=604800; SameSite=Lax`;
        router.push("/dashboard");
        router.refresh();
        return;
      }
      setError("Failed to sign in with persona.");
    } catch {
      setError("Backend server is not running at " + apiBase);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="email"
            className="text-text-secondary text-xs font-semibold tracking-wider uppercase"
          >
            Email
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
            className={INPUT_CLASSES}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="text-text-secondary text-xs font-semibold tracking-wider uppercase"
            >
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-brand-blue hover:text-brand-blueLight text-xs font-medium transition-colors dark:text-blue-400"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••••••"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={`${INPUT_CLASSES} w-full pr-10`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((shown) => !shown)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              className="text-text-secondary hover:text-text-primary focus-visible:text-brand-blue absolute inset-y-0 right-0 flex w-10 items-center justify-center transition-colors focus:outline-none"
            >
              {showPassword ? (
                <EyeOffIcon className="size-4" />
              ) : (
                <EyeIcon className="size-4" />
              )}
            </button>
          </div>
          {error && (
            <p
              role="alert"
              className="animate-fade-slide-up mt-1 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs font-medium text-rose-600 dark:border-rose-800/40 dark:bg-rose-950/40 dark:text-rose-400"
            >
              {error}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-brand-navy hover:bg-brand-blue mt-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-150 active:scale-[0.99] disabled:opacity-60"
        >
          {isSubmitting && <Spinner className="size-4" />}
          {isSubmitting ? "Signing in…" : "Sign in"}
        </button>

        <div className="flex items-center justify-center pt-1">
          <p className="text-text-secondary text-xs">
            Need compliance access?{" "}
            <Link
              href="/signup"
              className="text-brand-blue font-semibold hover:underline dark:text-blue-400"
            >
              Create account →
            </Link>
          </p>
        </div>
      </form>

      {/* Demo Personas for Quick Access */}
      <div className="border-border border-t pt-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-text-secondary text-[11px] font-semibold tracking-wider uppercase">
            One-Click Demo Roles
          </span>
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:border-emerald-800/30 dark:bg-emerald-950/40 dark:text-emerald-400">
            Instant Sandbox
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleDemoLogin("admin@aml.local")}
            className="group border-border hover:border-brand-navy flex flex-col items-center justify-center rounded-xl border bg-slate-50/70 p-2.5 text-center shadow-xs transition-all hover:bg-white hover:shadow-sm active:scale-95 disabled:opacity-50 dark:bg-slate-900/50 dark:hover:bg-slate-800"
          >
            <span className="text-text-primary group-hover:text-brand-navy dark:group-hover:text-brand-blueLight text-xs font-bold">
              Admin
            </span>
            <span className="text-text-secondary mt-0.5 text-[10px]">
              Full System
            </span>
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleDemoLogin("analyst@aml.local")}
            className="group border-border hover:border-brand-blue flex flex-col items-center justify-center rounded-xl border bg-slate-50/70 p-2.5 text-center shadow-xs transition-all hover:bg-white hover:shadow-sm active:scale-95 disabled:opacity-50 dark:bg-slate-900/50 dark:hover:bg-slate-800"
          >
            <span className="text-text-primary group-hover:text-brand-blue text-xs font-bold">
              Analyst
            </span>
            <span className="text-text-secondary mt-0.5 text-[10px]">
              Alert Triage
            </span>
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleDemoLogin("operator@aml.local")}
            className="group border-border flex flex-col items-center justify-center rounded-xl border bg-slate-50/70 p-2.5 text-center shadow-xs transition-all hover:border-slate-500 hover:bg-white hover:shadow-sm active:scale-95 disabled:opacity-50 dark:bg-slate-900/50 dark:hover:bg-slate-800"
          >
            <span className="text-text-primary text-xs font-bold group-hover:text-slate-900 dark:group-hover:text-white">
              Operator
            </span>
            <span className="text-text-secondary mt-0.5 text-[10px]">
              Data Ingest
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
