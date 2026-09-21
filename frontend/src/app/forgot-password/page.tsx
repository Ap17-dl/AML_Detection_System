import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { ForgotPasswordForm } from "@/app/forgot-password/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Reset Password — AML Sentinel Surveillance Platform",
  description: "Secure account recovery for AML Sentinel compliance personnel.",
};

export default function ForgotPasswordPage() {
  return (
    <div className="bg-brand-bgLight dark:bg-bg selection:bg-brand-gold selection:text-brand-navy flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-md px-4">
        {/* Return to login */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/login"
            className="text-text-secondary hover:text-brand-navy inline-flex items-center gap-1.5 text-xs font-semibold transition-colors dark:hover:text-white"
          >
            <span className="material-symbols-outlined text-[16px]">
              arrow_back
            </span>
            <span>Back to sign in</span>
          </Link>
          <span className="font-mono text-[11px] text-slate-400">
            SECURITY RECOVERY
          </span>
        </div>

        {/* Card */}
        <div className="border-border bg-surface overflow-hidden rounded-2xl border p-8 shadow-xl">
          <div className="mb-6 flex items-center gap-3">
            <div className="bg-brand-navy relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl p-1 shadow-sm ring-1 ring-white/10">
              <Image
                src="/landing/logo.jpg"
                alt="AML Sentinel"
                width={36}
                height={36}
                className="h-full w-full object-contain"
                priority
              />
            </div>
            <div>
              <h1 className="text-text-primary text-lg font-bold tracking-tight">
                AML Sentinel
              </h1>
              <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                Account Recovery
              </span>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-text-primary text-xl font-bold tracking-tight">
              Reset Password
            </h2>
            <p className="text-text-secondary mt-1 text-xs">
              Enter your registered corporate email address and we&apos;ll
              dispatch encrypted recovery credentials.
            </p>
          </div>

          <ForgotPasswordForm />
        </div>

        {/* Security badge footer */}
        <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-[11px] text-slate-400">
          <span className="material-symbols-outlined text-brand-gold text-[14px]">
            lock
          </span>
          End-to-end encrypted recovery channel
        </p>
      </div>
    </div>
  );
}
