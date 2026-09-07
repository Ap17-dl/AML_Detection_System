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

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setIsSubmitting(false);

    if (signInError) {
      setError("Incorrect email or password.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
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

      <Link
        href="/forgot-password"
        className="text-caption text-text-secondary hover:text-accent self-center transition-colors"
      >
        Forgot password?
      </Link>
    </form>
  );
}
