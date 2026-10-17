import type { Metadata } from "next";
import Link from "next/link";

import { ForgotPasswordForm } from "@/app/forgot-password/ForgotPasswordForm";
import { ArrowBackIcon, LockIcon } from "@/components/ui/icons";
import { SentinelLogo } from "@/components/ui/SentinelLogo";

export const metadata: Metadata = {
  title: "Credential Recovery — AML Sentinel Banking Portal",
  description: "Secure account recovery for AML Sentinel compliance personnel.",
};

export default function ForgotPasswordPage() {
  return (
    <div className="bg-bg text-text-primary flex min-h-screen flex-col justify-center py-12 transition-colors sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-md px-4">
        {/* Return to login */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/login"
            className="text-text-secondary hover:text-text-primary inline-flex items-center gap-1.5 text-xs font-semibold transition-colors"
          >
            <ArrowBackIcon className="h-4 w-4" />
            <span>Back to Client Sign In</span>
          </Link>
          <span className="text-text-muted font-mono text-[11px] font-bold">
            SECURE RECOVERY
          </span>
        </div>

        {/* Card */}
        <div className="border-border bg-surface overflow-hidden rounded-2xl border p-8 shadow-sm">
          <div className="mb-6">
            <SentinelLogo size={22} subtitle="INSTITUTIONAL BANKING" />
          </div>

          <div className="mb-6">
            <h1 className="text-text-primary text-xl font-extrabold tracking-tight">
              Reset Security Credentials
            </h1>
            <p className="text-text-secondary mt-1 text-xs font-normal">
              Enter your corporate banking email address and we&apos;ll send
              encrypted recovery instructions.
            </p>
          </div>

          <ForgotPasswordForm />
        </div>

        {/* Security badge footer */}
        <p className="text-text-muted mt-6 flex items-center justify-center gap-1.5 text-center text-[11px] font-medium">
          <LockIcon className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          Hardware Security Module (HSM) Encrypted Channel
        </p>
      </div>
    </div>
  );
}
