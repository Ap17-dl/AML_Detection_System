import type { Metadata } from "next";
import Link from "next/link";

import { LoginForm } from "@/app/login/LoginForm";
import { ArrowBackIcon, LockIcon, NetworkIcon, ShieldCheckIcon, ZapIcon } from "@/components/ui/icons";
import { SentinelLogo } from "@/components/ui/SentinelLogo";

export const metadata: Metadata = {
  title: "Sign in — AML Sentinel Surveillance Platform",
  description:
    "Secure institutional login for AML Sentinel surveillance and fraud detection.",
};

export default function LoginPage() {
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
          NODE: US-EAST-SURVEILLANCE
        </span>
      </div>

      <div className="mx-auto w-full max-w-4xl px-4">
        <div className="border-border bg-surface grid grid-cols-1 overflow-hidden rounded-2xl border shadow-sm lg:grid-cols-12">
          {/* Left: Brand & Intelligence Column */}
          <div className="border-border relative flex flex-col justify-between border-b p-8 lg:col-span-5 lg:border-r lg:border-b-0 lg:p-10">
            <div>
              <div className="mb-8">
                <SentinelLogo size={24} subtitle="FINANCIAL INTELLIGENCE" />
              </div>

              <h2 className="text-text-primary mb-3 text-xl font-bold tracking-tight">
                Autonomous AML Surveillance
              </h2>
              <p className="text-text-secondary mb-8 text-xs leading-relaxed">
                High-precision financial intelligence combining Graph Neural
                Networks, sub-second transaction triage, and automated SAR
                dossier compilation.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="border-border bg-surface-hover text-text-primary flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border">
                    <NetworkIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-text-primary text-xs font-semibold">
                      Graph Topology Analysis
                    </h3>
                    <p className="text-text-secondary text-[11px]">
                      Multi-hop layering, smurfing, and synthetic shell networks.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="border-border bg-surface-hover text-text-primary flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border">
                    <ZapIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-text-primary text-xs font-semibold">
                      Sub-Second Inference
                    </h3>
                    <p className="text-text-secondary text-[11px]">
                      Prioritizes critical anomalies with 70% false-positive
                      reduction.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="border-border bg-surface-hover text-text-primary flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border">
                    <ShieldCheckIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-text-primary text-xs font-semibold">
                      Audit-Defensible Dossiers
                    </h3>
                    <p className="text-text-secondary text-[11px]">
                      FinCEN-ready narrative dossiers generated with auditable
                      evidence.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Compliance Badge */}
            <div className="border-border mt-8 flex items-center justify-between border-t pt-6 text-[11px] text-text-secondary">
              <span className="inline-flex items-center gap-1.5 font-medium">
                <LockIcon className="h-3.5 w-3.5" />
                256-bit TLS • SOC2 Type II
              </span>
              <span className="font-mono text-[10px] text-text-muted">
                v2.4.0
              </span>
            </div>
          </div>

          {/* Right: Authentication Form */}
          <div className="flex flex-col justify-center p-8 lg:col-span-7 lg:p-10">
            <div className="mb-6">
              <span className="text-brand-blue text-[11px] font-semibold tracking-wider uppercase">
                Access Portal
              </span>
              <h1 className="text-text-primary mt-1 text-2xl font-bold tracking-tight">
                Sign in to Sentinel
              </h1>
              <p className="text-text-secondary mt-1 text-xs">
                Enter your credentials to access the active compliance triage queue.
              </p>
            </div>

            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}
