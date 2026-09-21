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
          <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
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
            <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-brand-blue hover:text-brand-blueLight dark:text-blue-400 font-medium transition-colors"
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
              className="animate-fade-slide-up text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 rounded-lg p-2.5 mt-1"
            >
              {error}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-brand-navy hover:bg-brand-blue text-white rounded-lg px-4 py-2.5 text-sm font-semibold shadow-sm transition-all duration-150 active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2 mt-1"
        >
          {isSubmitting && <Spinner className="size-4" />}
          {isSubmitting ? "Signing in…" : "Sign in"}
        </button>

        <div className="flex items-center justify-center pt-1">
          <p className="text-xs text-text-secondary">
            Need compliance access?{" "}
            <Link
              href="/signup"
              className="text-brand-blue dark:text-blue-400 font-semibold hover:underline"
            >
              Create account →
            </Link>
          </p>
        </div>
      </form>

      {/* Demo Personas for Quick Access */}
      <div className="border-border border-t pt-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
            One-Click Demo Roles
          </span>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/30">
            Instant Sandbox
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleDemoLogin("admin@aml.local")}
            className="group flex flex-col items-center justify-center rounded-xl border border-border bg-slate-50/70 dark:bg-slate-900/50 p-2.5 text-center transition-all hover:border-brand-navy hover:bg-white dark:hover:bg-slate-800 shadow-xs hover:shadow-sm active:scale-95 disabled:opacity-50"
          >
            <span className="text-xs font-bold text-text-primary group-hover:text-brand-navy dark:group-hover:text-brand-blueLight">
              Admin
            </span>
            <span className="text-[10px] text-text-secondary mt-0.5">Full System</span>
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleDemoLogin("analyst@aml.local")}
            className="group flex flex-col items-center justify-center rounded-xl border border-border bg-slate-50/70 dark:bg-slate-900/50 p-2.5 text-center transition-all hover:border-brand-blue hover:bg-white dark:hover:bg-slate-800 shadow-xs hover:shadow-sm active:scale-95 disabled:opacity-50"
          >
            <span className="text-xs font-bold text-text-primary group-hover:text-brand-blue">
              Analyst
            </span>
            <span className="text-[10px] text-text-secondary mt-0.5">Alert Triage</span>
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleDemoLogin("operator@aml.local")}
            className="group flex flex-col items-center justify-center rounded-xl border border-border bg-slate-50/70 dark:bg-slate-900/50 p-2.5 text-center transition-all hover:border-slate-500 hover:bg-white dark:hover:bg-slate-800 shadow-xs hover:shadow-sm active:scale-95 disabled:opacity-50"
          >
            <span className="text-xs font-bold text-text-primary group-hover:text-slate-900 dark:group-hover:text-white">
              Operator
            </span>
            <span className="text-[10px] text-text-secondary mt-0.5">Data Ingest</span>
          </button>
        </div>
      </div>
    </div>
  );
}
