import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { SignUpForm } from "@/app/signup/SignUpForm";

export const metadata: Metadata = {
  title: "Create Account — AML Sentinel Surveillance Platform",
  description: "Register compliance officer or data operator credentials for AML Sentinel.",
};

export default function SignUpPage() {
  return (
    <div className="bg-brand-bgLight dark:bg-bg flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-brand-gold selection:text-brand-navy">
      {/* Top Header link */}
      <div className="mx-auto w-full max-w-5xl px-4 mb-6 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-text-secondary hover:text-brand-navy dark:hover:text-white transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Return to AML Sentinel Home</span>
        </Link>
        <span className="text-[11px] font-mono text-slate-400">
          NODE: SURVEILLANCE-REGISTRATION
        </span>
      </div>

      <div className="mx-auto w-full max-w-5xl px-4">
        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xl grid grid-cols-1 lg:grid-cols-12">
          {/* Left: Security Accreditation Column */}
          <div className="bg-brand-navy p-8 lg:p-10 lg:col-span-5 text-white flex flex-col justify-between relative overflow-hidden">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand-blue/20 blur-3xl pointer-events-none" />
            <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-brand-gold/10 blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-white/10 p-1.5 backdrop-blur-sm ring-1 ring-white/20">
                  <Image
                    src="/landing/logo.jpg"
                    alt="AML Sentinel"
                    width={48}
                    height={48}
                    className="h-full w-full object-contain"
                    priority
                  />
                </div>
                <div>
                  <h1 className="text-xl font-extrabold tracking-tight text-white">
                    AML Sentinel
                  </h1>
                  <span className="text-[11px] font-medium tracking-wide text-brand-gold">
                    Staff Onboarding
                  </span>
                </div>
              </div>

              <h2 className="text-2xl font-bold tracking-tight text-white mb-3">
                Join the Compliance Operations Team
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed mb-8">
                Request an authorized seat in the surveillance operations center. Select your role to gain immediate sandbox access or link to your organization&apos;s workspace.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10 text-brand-gold ring-1 ring-white/10">
                    <span className="material-symbols-outlined text-[18px]">verified</span>
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-white">Role-Based Access Control</h3>
                    <p className="text-[11px] text-slate-300">Strict least-privilege scoping across alerts, SARs, and batch ingest.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10 text-brand-gold ring-1 ring-white/10">
                    <span className="material-symbols-outlined text-[18px]">history_edu</span>
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-white">Immutable Audit Logging</h3>
                    <p className="text-[11px] text-slate-300">Every case note, triage action, and SAR export is cryptographically logged.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative z-10 mt-8 pt-6 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-300">
              <span className="inline-flex items-center gap-1.5 font-medium">
                <span className="material-symbols-outlined text-brand-gold text-[16px]">security</span>
                FinCEN & FATF Compliant
              </span>
              <span className="font-mono text-[10px] text-slate-400">Enterprise</span>
            </div>
          </div>

          {/* Right: Registration Form */}
          <div className="p-8 lg:p-12 lg:col-span-7 flex flex-col justify-center">
            <div className="mb-6">
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-blue dark:text-blue-400">
                Authorized Personnel
              </span>
              <h2 className="text-2xl font-bold tracking-tight text-text-primary mt-1">
                Create Account
              </h2>
              <p className="text-xs text-text-secondary mt-1">
                Configure your surveillance credentials and select your operational role.
              </p>
            </div>

            <SignUpForm />
          </div>
        </div>
      </div>
    </div>
  );
}
