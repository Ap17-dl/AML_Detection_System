"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { EyeIcon, EyeOffIcon, Spinner } from "@/components/ui/icons";
import { createClient } from "@/lib/supabase/client";

const INPUT_CLASSES =
  "text-body rounded-md border border-border bg-surface px-3 py-2 text-text-primary transition-colors outline-none focus:border-accent focus:ring-2 focus:ring-accent/30";

export function SignUpForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState("2");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmationRequired, setConfirmationRequired] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            role_id: Number(roleId),
          },
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (signUpError) {
        setIsSubmitting(false);
        setError(signUpError.message || "Failed to create account.");
        return;
      }

      if (data.session) {
        setIsSubmitting(false);
        router.push("/dashboard");
        router.refresh();
        return;
      }

      // Supabase requires email verification
      setIsSubmitting(false);
      setConfirmationRequired(true);
    } catch {
      setIsSubmitting(false);
      setError("Unable to connect to authentication server. Please try again.");
    }
  }

  if (confirmationRequired) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-accent/10 text-accent">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-6"
            aria-hidden="true"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <h2 className="text-h3 font-semibold text-text-primary">
          Check your email
        </h2>
        <p className="text-body text-text-secondary">
          We&apos;ve sent a confirmation link to{" "}
          <span className="font-medium text-text-primary">{email}</span>. Please
          click the link to verify your account and sign in.
        </p>
        <Link
          href="/login"
          className="text-body bg-accent mt-2 flex items-center justify-center rounded-md px-4 py-2 font-medium text-white transition-all hover:-translate-y-px hover:shadow-md"
        >
          Return to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {error && (
        <div
          role="alert"
          className="animate-fade-slide-up rounded-md border border-risk-high/30 bg-risk-high/10 p-3 text-caption text-risk-high"
        >
          {error}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="fullName" className="text-label text-text-secondary">
          Full name
        </label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          autoComplete="name"
          required
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          placeholder="e.g. Alex Morgan"
          className={INPUT_CLASSES}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-label text-text-secondary">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="alex@example.com"
          className={INPUT_CLASSES}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="roleId" className="text-label text-text-secondary">
          Platform role
        </label>
        <select
          id="roleId"
          name="roleId"
          value={roleId}
          onChange={(event) => setRoleId(event.target.value)}
          className={`${INPUT_CLASSES} cursor-pointer`}
        >
          <option value="2">AML Compliance Analyst (Alerts & Cases)</option>
          <option value="3">Data Operator (Batch Ingestion)</option>
        </select>
        <p className="text-caption text-text-secondary">
          Need Administrator access? You can request it from the host after signing in.
        </p>
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
            autoComplete="new-password"
            required
            minLength={6}
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
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="confirmPassword"
          className="text-label text-text-secondary"
        >
          Confirm password
        </label>
        <div className="relative">
          <input
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            minLength={6}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className={`${INPUT_CLASSES} w-full pr-10`}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((shown) => !shown)}
            aria-label={
              showConfirmPassword ? "Hide password" : "Show password"
            }
            aria-pressed={showConfirmPassword}
            className="text-text-secondary hover:text-text-primary focus-visible:text-accent absolute inset-y-0 right-0 flex w-10 items-center justify-center transition-colors focus:outline-none"
          >
            {showConfirmPassword ? (
              <EyeOffIcon className="size-4" />
            ) : (
              <EyeIcon className="size-4" />
            )}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="text-body bg-accent focus-visible:ring-accent focus-visible:ring-offset-surface mt-2 flex items-center justify-center gap-2 rounded-md px-4 py-2 font-medium text-white transition-all duration-150 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 hover:enabled:-translate-y-px hover:enabled:shadow-md active:enabled:translate-y-0 disabled:opacity-60"
      >
        {isSubmitting && <Spinner className="size-4" />}
        {isSubmitting ? "Creating account…" : "Create account"}
      </button>

      <p className="text-caption text-text-secondary text-center">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-accent hover:underline transition-colors"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
