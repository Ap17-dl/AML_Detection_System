"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { EyeIcon, EyeOffIcon, Spinner } from "@/components/ui/icons";
import { createClient } from "@/lib/supabase/client";

const INPUT_CLASSES =
  "text-body rounded-md border border-border bg-surface px-3 py-2 text-text-primary transition-colors outline-none focus:border-accent focus:ring-2 focus:ring-accent/30";

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
        // Check dev-login as fallback
        const devRes = await fetch(`${apiBase}/api/v1/auth/dev-login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }).catch(() => null);

        if (devRes && devRes.ok) {
          const data = await devRes.json();
          document.cookie = `aml_dev_token=${data.access_token}; path=/; max-age=604800; SameSite=Lax`;
          setIsSubmitting(false);
          router.push("/dashboard");
          router.refresh();
          return;
        }

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
            className={INPUT_CLASSES}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-label text-text-secondary">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
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
              className="text-text-secondary hover:text-text-primary focus-visible:text-accent absolute inset-y-0 right-0 flex w-10 items-center justify-center transition-colors focus:outline-none"
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
              className="animate-fade-slide-up text-caption text-risk-high"
            >
              {error}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="text-body bg-accent focus-visible:ring-accent focus-visible:ring-offset-surface mt-2 flex items-center justify-center gap-2 rounded-md px-4 py-2 font-medium text-white transition-all duration-150 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 hover:enabled:-translate-y-px hover:enabled:shadow-md active:enabled:translate-y-0 disabled:opacity-60"
        >
          {isSubmitting && <Spinner className="size-4" />}
          {isSubmitting ? "Signing in…" : "Sign in"}
        </button>

        <div className="flex items-center justify-between">
          <Link
            href="/forgot-password"
            className="text-caption text-text-secondary hover:text-accent transition-colors"
          >
            Forgot password?
          </Link>
          <Link
            href="/signup"
            className="text-caption text-accent font-medium transition-colors hover:underline"
          >
            Create account →
          </Link>
        </div>
      </form>

      {/* Demo Personas for Quick Access */}
      <div className="border-border border-t pt-4">
        <p className="text-caption text-text-secondary mb-2 text-center">
          Or sign in instantly with a demo role:
        </p>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleDemoLogin("admin@aml.local")}
            className="text-caption border-border bg-bg text-text-primary hover:border-accent hover:text-accent rounded border px-2 py-1.5 text-center font-medium transition-colors disabled:opacity-50"
          >
            Admin
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleDemoLogin("analyst@aml.local")}
            className="text-caption border-border bg-bg text-text-primary hover:border-accent hover:text-accent rounded border px-2 py-1.5 text-center font-medium transition-colors disabled:opacity-50"
          >
            Analyst
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleDemoLogin("operator@aml.local")}
            className="text-caption border-border bg-bg text-text-primary hover:border-accent hover:text-accent rounded border px-2 py-1.5 text-center font-medium transition-colors disabled:opacity-50"
          >
            Operator
          </button>
        </div>
      </div>
    </div>
  );
}
