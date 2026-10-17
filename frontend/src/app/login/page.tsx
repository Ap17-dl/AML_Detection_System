import type { Metadata } from "next";
import Link from "next/link";

import { LoginForm } from "@/app/login/LoginForm";
import {
  ArrowBackIcon,
  LockIcon,
  NetworkIcon,
  ShieldCheckIcon,
  ZapIcon,
} from "@/components/ui/icons";
import { SentinelLogo } from "@/components/ui/SentinelLogo";

export const metadata: Metadata = {
  title: "Institutional Sign In — AML Sentinel Banking Portal",
  description:
    "Secure institutional client login for AML Sentinel correspondent banking surveillance.",
};

export default function LoginPage() {
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
          CLEARING RAIL: US-EAST-FEDWIRE
        </span>
      </div>

      <div className="mx-auto w-full max-w-4xl px-4">
        <div className="border-border bg-surface grid grid-cols-1 overflow-hidden rounded-2xl border shadow-sm lg:grid-cols-12">
          {/* Left: Brand & Accreditation Column */}
          <div className="border-border relative flex flex-col justify-between border-b bg-slate-50/50 p-8 lg:col-span-5 lg:border-r lg:border-b-0 lg:p-10 dark:bg-slate-900/30">
            <div>
              <div className="mb-8">
                <SentinelLogo size={24} subtitle="INSTITUTIONAL BANKING" />
              </div>

              <h2 className="text-text-primary mb-3 text-xl font-bold tracking-tight">
                Correspondent Banking Surveillance
              </h2>
              <p className="text-text-secondary mb-8 text-xs leading-relaxed font-normal">
                Continuous financial intelligence combining Graph Neural
                Networks, sub-second ledger scoring, and automated FinCEN Form
                111 SAR dossiers.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="border-border bg-surface text-brand-blue flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border shadow-2xs">
                    <NetworkIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-text-primary text-xs font-bold">
                      Correspondent Topology
                    </h3>
                    <p className="text-text-secondary text-[11px] font-normal">
                      Multi-hop layering, nested accounts, and circular
                      correspondent flows.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="border-border bg-surface text-brand-blue flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border shadow-2xs">
                    <ZapIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-text-primary text-xs font-bold">
                      Sub-Second Settlement Triage
                    </h3>
                    <p className="text-text-secondary text-[11px] font-normal">
                      Scores transactions with under 18ms latency and 70%
                      false-positive reduction.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="border-border bg-surface text-brand-blue flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border shadow-2xs">
                    <ShieldCheckIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-text-primary text-xs font-bold">
                      Examiner Defensible Filings
                    </h3>
                    <p className="text-text-secondary text-[11px] font-normal">
                      Cryptographically stamped SAR dossiers aligned with FinCEN
                      and FATF standards.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Compliance Badge */}
            <div className="border-border text-text-secondary mt-8 flex items-center justify-between border-t pt-6 text-[11px] font-medium">
              <span className="inline-flex items-center gap-1.5">
                <LockIcon className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                256-bit TLS • SOC2 Type II
              </span>
              <span className="text-text-muted font-mono text-[10px] font-bold">
                FFIEC-v2.4
              </span>
            </div>
          </div>

          {/* Right: Authentication Form */}
          <div className="flex flex-col justify-center p-8 lg:col-span-7 lg:p-10">
            <div className="mb-6">
              <span className="text-brand-blue text-[11px] font-bold tracking-wider uppercase">
                Institutional Access Portal
              </span>
              <h1 className="text-text-primary mt-1 text-2xl font-extrabold tracking-tight">
                Client Sign In
              </h1>
              <p className="text-text-secondary mt-1 text-xs font-normal">
                Enter your compliance officer credentials to access the live
                triage queue.
              </p>
            </div>

            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}
