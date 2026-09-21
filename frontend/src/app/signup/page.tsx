import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { SignUpForm } from "@/app/signup/SignUpForm";

export const metadata: Metadata = {
  title: "Create Account — AML Sentinel Surveillance Platform",
  description:
    "Register compliance officer or data operator credentials for AML Sentinel.",
};

export default function SignUpPage() {
  return (
    <div className="bg-brand-bgLight dark:bg-bg selection:bg-brand-gold selection:text-brand-navy flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Top Header link */}
      <div className="mx-auto mb-6 flex w-full max-w-5xl items-center justify-between px-4">
        <Link
          href="/"
          className="text-text-secondary hover:text-brand-navy inline-flex items-center gap-2 text-xs font-semibold transition-colors dark:hover:text-white"
        >
          <span className="material-symbols-outlined text-[16px]">
            arrow_back
          </span>
          <span>Return to AML Sentinel Home</span>
        </Link>
        <span className="font-mono text-[11px] text-slate-400">
          NODE: SURVEILLANCE-REGISTRATION
        </span>
      </div>

      <div className="mx-auto w-full max-w-5xl px-4">
        <div className="border-border bg-surface grid grid-cols-1 overflow-hidden rounded-2xl border shadow-xl lg:grid-cols-12">
          {/* Left: Security Accreditation Column */}
          <div className="bg-brand-navy relative flex flex-col justify-between overflow-hidden p-8 text-white lg:col-span-5 lg:p-10">
            <div className="bg-brand-blue/20 pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full blur-3xl" />
            <div className="bg-brand-gold/10 pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full blur-3xl" />

            <div className="relative z-10">
              <div className="mb-6 flex items-center gap-3">
                <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-white/10 p-1.5 ring-1 ring-white/20 backdrop-blur-sm">
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
                  <span className="text-brand-gold text-[11px] font-medium tracking-wide">
                    Staff Onboarding
                  </span>
                </div>
              </div>

              <h2 className="mb-3 text-2xl font-bold tracking-tight text-white">
                Join the Compliance Operations Team
              </h2>
              <p className="mb-8 text-xs leading-relaxed text-slate-300">
                Request an authorized seat in the surveillance operations
                center. Select your role to gain immediate sandbox access or
                link to your organization&apos;s workspace.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="text-brand-gold flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/10">
                    <span className="material-symbols-outlined text-[18px]">
                      verified
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-white">
                      Role-Based Access Control
                    </h3>
                    <p className="text-[11px] text-slate-300">
                      Strict least-privilege scoping across alerts, SARs, and
                      batch ingest.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="text-brand-gold flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/10">
                    <span className="material-symbols-outlined text-[18px]">
                      history_edu
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-white">
                      Immutable Audit Logging
                    </h3>
                    <p className="text-[11px] text-slate-300">
                      Every case note, triage action, and SAR export is
                      cryptographically logged.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative z-10 mt-8 flex items-center justify-between border-t border-white/10 pt-6 text-[11px] text-slate-300">
              <span className="inline-flex items-center gap-1.5 font-medium">
                <span className="material-symbols-outlined text-brand-gold text-[16px]">
                  security
                </span>
                FinCEN & FATF Compliant
              </span>
              <span className="font-mono text-[10px] text-slate-400">
                Enterprise
              </span>
            </div>
          </div>

          {/* Right: Registration Form */}
          <div className="flex flex-col justify-center p-8 lg:col-span-7 lg:p-12">
            <div className="mb-6">
              <span className="text-brand-blue text-[11px] font-bold tracking-wider uppercase dark:text-blue-400">
                Authorized Personnel
              </span>
              <h2 className="text-text-primary mt-1 text-2xl font-bold tracking-tight">
                Create Account
              </h2>
              <p className="text-text-secondary mt-1 text-xs">
                Configure your surveillance credentials and select your
                operational role.
              </p>
            </div>

            <SignUpForm />
          </div>
        </div>
      </div>
    </div>
  );
}
