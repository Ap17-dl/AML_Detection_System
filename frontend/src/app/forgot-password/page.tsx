import type { Metadata } from "next";
import Link from "next/link";

import { ForgotPasswordForm } from "@/app/forgot-password/ForgotPasswordForm";
import { ArrowBackIcon, LockIcon } from "@/components/ui/icons";
import { SentinelLogo } from "@/components/ui/SentinelLogo";

export const metadata: Metadata = {
  title: "Reset Password — AML Sentinel Surveillance Platform",
  description: "Secure account recovery for AML Sentinel compliance personnel.",
};

export default function ForgotPasswordPage() {
  return (
    <div className="bg-bg text-text-primary flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors">
      <div className="mx-auto w-full max-w-md px-4">
        {/* Return to login */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/login"
            className="text-text-secondary hover:text-text-primary inline-flex items-center gap-1.5 text-xs font-medium transition-colors"
          >
            <ArrowBackIcon className="h-4 w-4" />
            <span>Back to sign in</span>
          </Link>
          <span className="font-mono text-[11px] text-text-muted">
            RECOVERY
          </span>
        </div>

        {/* Card */}
        <div className="border-border bg-surface overflow-hidden rounded-2xl border p-8 shadow-sm">
          <div className="mb-6">
            <SentinelLogo size={22} subtitle="CREDENTIAL RECOVERY" />
          </div>

          <div className="mb-6">
            <h1 className="text-text-primary text-xl font-bold tracking-tight">
              Reset Password
            </h1>
            <p className="text-text-secondary mt-1 text-xs">
              Enter your corporate email address and we&apos;ll send instructions to reset your password.
            </p>
          </div>

          <ForgotPasswordForm />
        </div>

        {/* Security badge footer */}
        <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-[11px] text-text-muted">
          <LockIcon className="h-3 w-3" />
          Encrypted recovery channel
        </p>
      </div>
    </div>
  );
}
