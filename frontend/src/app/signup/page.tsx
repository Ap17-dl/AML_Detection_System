import type { Metadata } from "next";
import Link from "next/link";

import { SignUpForm } from "@/app/signup/SignUpForm";
import {
  ArrowBackIcon,
  LockIcon,
  NetworkIcon,
  ShieldCheckIcon,
  UsersIcon,
} from "@/components/ui/icons";
import { SentinelLogo } from "@/components/ui/SentinelLogo";

export const metadata: Metadata = {
  title: "Provision Account — AML Sentinel Banking Portal",
  description:
    "Register compliance officer or settlement operator credentials for AML Sentinel Banking Systems.",
};

export default function SignUpPage() {
  return (
    <div className="bg-bg text-text-primary flex min-h-screen flex-col justify-center py-12 transition-colors sm:px-6 lg:px-8">
      {/* Top Header link */}
      <div className="mx-auto mb-6 flex w-full max-w-4xl items-center justify-between px-4">
        <Link
          href="/"
          className="text-text-secondary hover:text-text-primary inline-flex items-center gap-2 text-xs font-semibold transition-colors"
        >
          <ArrowBackIcon className="h-4 w-4" />
          <span>Return to Institutional Overview</span>
        </Link>
        <span className="text-text-muted font-mono text-[11px] font-semibold">
          PROVISIONING: REGULATED-NODE
        </span>
      </div>

      <div className="mx-auto w-full max-w-4xl px-4">
        <div className="border-border bg-surface grid grid-cols-1 overflow-hidden rounded-2xl border shadow-sm lg:grid-cols-12">
          {/* Left: Security Accreditation Column */}
          <div className="border-border relative flex flex-col justify-between border-b bg-slate-50/50 p-8 lg:col-span-5 lg:border-r lg:border-b-0 lg:p-10 dark:bg-slate-900/30">
            <div>
              <div className="mb-8">
                <SentinelLogo size={24} subtitle="INSTITUTIONAL BANKING" />
              </div>

              <h2 className="text-text-primary mb-3 text-xl font-bold tracking-tight">
                Authorized Personnel Clearance
              </h2>
              <p className="text-text-secondary mb-8 text-xs leading-relaxed font-normal">
                Configure your surveillance credentials to access the active
                correspondent queue or link into your banking institution&apos;s
                enterprise workspace.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="border-border bg-surface text-brand-blue flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border shadow-2xs">
                    <UsersIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-text-primary text-xs font-bold">
                      Role-Based Access Control
                    </h3>
                    <p className="text-text-secondary text-[11px] font-normal">
                      Strict least-privilege scoping across alerts, SARs, and
                      batch settlement ingest.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="border-border bg-surface text-brand-blue flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border shadow-2xs">
                    <NetworkIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-text-primary text-xs font-bold">
                      Cryptographic Audit Trail
                    </h3>
                    <p className="text-text-secondary text-[11px] font-normal">
                      Every triage decision, note, and SAR export is
                      cryptographically signed.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="border-border bg-surface text-brand-blue flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border shadow-2xs">
                    <ShieldCheckIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-text-primary text-xs font-bold">
                      Federal Banking Standards
                    </h3>
                    <p className="text-text-secondary text-[11px] font-normal">
                      Full alignment with FinCEN, FFIEC, FATF, and Basel
                      Committee standards.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-border text-text-secondary mt-8 flex items-center justify-between border-t pt-6 text-[11px] font-medium">
              <span className="inline-flex items-center gap-1.5">
                <LockIcon className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                SOC2 Type II Certified
              </span>
              <span className="text-text-muted font-mono text-[10px] font-bold">
                FFIEC-v2.4
              </span>
            </div>
          </div>

          {/* Right: Registration Form */}
          <div className="flex flex-col justify-center p-8 lg:col-span-7 lg:p-10">
            <div className="mb-6">
              <span className="text-brand-blue text-[11px] font-bold tracking-wider uppercase">
                Account Provisioning
              </span>
              <h1 className="text-text-primary mt-1 text-2xl font-extrabold tracking-tight">
                Request Clearance
              </h1>
              <p className="text-text-secondary mt-1 text-xs font-normal">
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
