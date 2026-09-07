import type { Metadata } from "next";

import { ForgotPasswordForm } from "@/app/forgot-password/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Reset password — AML Detection Platform",
};

export default function ForgotPasswordPage() {
  return (
    <div className="bg-bg flex min-h-screen items-center justify-center p-4">
      <div className="rounded-card border-border bg-surface w-full max-w-sm border p-8 shadow-sm">
        <p className="text-display text-text-primary mb-1">Reset password</p>
        <p className="text-body text-text-secondary mb-6">
          Enter your email and we&apos;ll send you a reset link.
        </p>
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
