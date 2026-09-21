"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { EyeIcon, EyeOffIcon, Spinner } from "@/components/ui/icons";
import { createClient } from "@/lib/supabase/client";

const INPUT_CLASSES =
  "text-sm rounded-lg border border-border bg-surface px-3.5 py-2.5 text-text-primary transition-all duration-150 outline-none focus:border-brand-blue focus:ring-3 focus:ring-brand-blue/15 placeholder:text-slate-400";

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
      <div className="flex flex-col gap-4 py-4 text-center">
        <div className="bg-brand-blue/10 text-brand-blue ring-brand-blue/20 mx-auto flex size-14 items-center justify-center rounded-2xl ring-1">
          <span className="material-symbols-outlined text-3xl">
            mark_email_read
          </span>
        </div>
        <h2 className="text-text-primary text-xl font-bold">
          Check your email
        </h2>
        <p className="text-text-secondary mx-auto max-w-sm text-sm leading-relaxed">
          We&apos;ve sent a confirmation link to{" "}
          <span className="text-text-primary font-semibold">{email}</span>.
          Please click the link to verify your compliance credentials and sign
          in.
        </p>
        <Link
          href="/login"
          className="bg-brand-navy hover:bg-brand-blue mt-3 inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-150"
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
          className="animate-fade-slide-up rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700 dark:border-rose-800/40 dark:bg-rose-950/40 dark:text-rose-400"
        >
          {error}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="fullName"
          className="text-text-secondary text-xs font-semibold tracking-wider uppercase"
        >
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
        <label
          htmlFor="email"
          className="text-text-secondary text-xs font-semibold tracking-wider uppercase"
        >
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
        <label
          htmlFor="roleId"
          className="text-text-secondary text-xs font-semibold tracking-wider uppercase"
        >
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
        <p className="text-text-secondary text-[11px]">
          Need Administrator access? You can request it from the host after
          signing in.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="password"
          className="text-text-secondary text-xs font-semibold tracking-wider uppercase"
        >
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
            placeholder="At least 6 characters"
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
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="confirmPassword"
          className="text-text-secondary text-xs font-semibold tracking-wider uppercase"
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
            placeholder="Re-enter password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className={`${INPUT_CLASSES} w-full pr-10`}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((shown) => !shown)}
            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            aria-pressed={showConfirmPassword}
            className="text-text-secondary hover:text-text-primary focus-visible:text-brand-blue absolute inset-y-0 right-0 flex w-10 items-center justify-center transition-colors focus:outline-none"
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
        className="bg-brand-navy hover:bg-brand-blue mt-2 flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-150 active:scale-[0.99] disabled:opacity-60"
      >
        {isSubmitting && <Spinner className="size-4" />}
        {isSubmitting ? "Creating account…" : "Create account"}
      </button>

      <p className="text-text-secondary pt-1 text-center text-xs">
        Already have credentials?{" "}
        <Link
          href="/login"
          className="text-brand-blue font-semibold hover:underline dark:text-blue-400"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
