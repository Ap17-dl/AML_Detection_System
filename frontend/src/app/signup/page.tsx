import type { Metadata } from "next";

import { SignUpForm } from "@/app/signup/SignUpForm";

export const metadata: Metadata = {
  title: "Create account — AML Detection Platform",
};

export default function SignUpPage() {
  return (
    <div className="bg-bg flex min-h-screen items-center justify-center p-4">
      <div className="animate-fade-slide-up rounded-card border-border bg-surface w-full max-w-md border p-8 shadow-sm">
        <p className="text-display text-text-primary mb-1">Create account</p>
        <p className="text-body text-text-secondary mb-6">
          AML Detection Platform
        </p>
        <SignUpForm />
      </div>
    </div>
  );
}
