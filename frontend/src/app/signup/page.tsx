import type { Metadata } from "next";
import Link from "next/link";

import { SignUpForm } from "@/app/signup/SignUpForm";
import { ArrowBackIcon, LockIcon, NetworkIcon, ShieldCheckIcon, UsersIcon } from "@/components/ui/icons";
import { SentinelLogo } from "@/components/ui/SentinelLogo";

export const metadata: Metadata = {
  title: "Create Account — AML Sentinel Surveillance Platform",
  description:
    "Register compliance officer or data operator credentials for AML Sentinel.",
};

export default function SignUpPage() {
  return (
    <div className="bg-bg text-text-primary flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors">
      {/* Top Header link */}
      <div className="mx-auto mb-6 flex w-full max-w-4xl items-center justify-between px-4">
        <Link
          href="/"
          className="text-text-secondary hover:text-text-primary inline-flex items-center gap-2 text-xs font-medium transition-colors"
        >
          <ArrowBackIcon className="h-4 w-4" />
          <span>Back to Home</span>
        </Link>
        <span className="font-mono text-[11px] text-text-muted">
          NODE: REGISTRATION-CLUSTER
        </span>
      </div>

      <div className="mx-auto w-full max-w-4xl px-4">
        <div className="border-border bg-surface grid grid-cols-1 overflow-hidden rounded-2xl border shadow-sm lg:grid-cols-12">
          {/* Left: Security Accreditation Column */}
          <div className="border-border relative flex flex-col justify-between border-b p-8 lg:col-span-5 lg:border-r lg:border-b-0 lg:p-10">
            <div>
              <div className="mb-8">
                <SentinelLogo size={24} subtitle="STAFF ONBOARDING" />
              </div>

              <h2 className="text-text-primary mb-3 text-xl font-bold tracking-tight">
                Authorized Personnel Access
              </h2>
              <p className="text-text-secondary mb-8 text-xs leading-relaxed">
                Configure your surveillance credentials to access the active
                queue or link into your institution&apos;s workspace.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="border-border bg-surface-hover text-text-primary flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border">
                    <UsersIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-text-primary text-xs font-semibold">
                      Role-Scoped Authorization
                    </h3>
                    <p className="text-text-secondary text-[11px]">
                      Strict least-privilege scoping across alerts, SARs, and batch ingestion.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="border-border bg-surface-hover text-text-primary flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border">
                    <NetworkIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-text-primary text-xs font-semibold">
                      Immutable Audit Trail
                    </h3>
                    <p className="text-text-secondary text-[11px]">
                      Every triage decision, note, and SAR export is cryptographically logged.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="border-border bg-surface-hover text-text-primary flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border">
                    <ShieldCheckIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-text-primary text-xs font-semibold">
                      Regulatory Compliance
                    </h3>
                    <p className="text-text-secondary text-[11px]">
                      Direct alignment with FinCEN, FATF, and EU 6AMLD standards.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-border mt-8 flex items-center justify-between border-t pt-6 text-[11px] text-text-secondary">
              <span className="inline-flex items-center gap-1.5 font-medium">
                <LockIcon className="h-3.5 w-3.5" />
                SOC2 Type II Certified
              </span>
              <span className="font-mono text-[10px] text-text-muted">
                v2.4.0
              </span>
            </div>
          </div>

          {/* Right: Registration Form */}
          <div className="flex flex-col justify-center p-8 lg:col-span-7 lg:p-10">
            <div className="mb-6">
              <span className="text-brand-blue text-[11px] font-semibold tracking-wider uppercase">
                Account Provisioning
              </span>
              <h1 className="text-text-primary mt-1 text-2xl font-bold tracking-tight">
                Create Account
              </h1>
              <p className="text-text-secondary mt-1 text-xs">
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
