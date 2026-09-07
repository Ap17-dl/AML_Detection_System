import type { Metadata } from "next";

import { LoginForm } from "@/app/login/LoginForm";

export const metadata: Metadata = { title: "Sign in — AML Detection Platform" };

export default function LoginPage() {
  return (
    <div className="bg-bg flex min-h-screen items-center justify-center p-4">
      <div className="rounded-card border-border bg-surface w-full max-w-sm border p-8 shadow-sm">
        <p className="text-display text-text-primary mb-1">Sign in</p>
        <p className="text-body text-text-secondary mb-6">
          AML Detection Platform
        </p>
        <LoginForm />
      </div>
    </div>
  );
}
