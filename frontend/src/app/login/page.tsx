import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { LoginForm } from "@/app/login/LoginForm";

export const metadata: Metadata = {
  title: "Sign in — AML Sentinel Surveillance Platform",
  description: "Secure institutional login for AML Sentinel surveillance and fraud detection.",
};

export default function LoginPage() {
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
          NODE: SURVEILLANCE-US-EAST
        </span>
      </div>

      <div className="mx-auto w-full max-w-5xl px-4">
        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xl grid grid-cols-1 lg:grid-cols-12">
          {/* Left: Brand & Intelligence Column */}
          <div className="bg-brand-navy p-8 lg:p-10 lg:col-span-5 text-white flex flex-col justify-between relative overflow-hidden">
            {/* Background ambient glow */}
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
                    Enterprise Surveillance
                  </span>
                </div>
              </div>

              <h2 className="text-2xl font-bold tracking-tight text-white mb-3">
                Autonomous Anti-Money Laundering Defense
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed mb-8">
                Institutional-grade financial intelligence engine combining Graph Neural Networks, sub-second transaction scoring, and automated SAR dossier generation.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10 text-brand-gold ring-1 ring-white/10">
                    <span className="material-symbols-outlined text-[18px]">hub</span>
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-white">Graph Topology Intelligence</h3>
                    <p className="text-[11px] text-slate-300">Detects multi-hop layering, smurfing, and synthetic shell networks.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10 text-brand-gold ring-1 ring-white/10">
                    <span className="material-symbols-outlined text-[18px]">bolt</span>
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-white">Sub-Second Triage Engine</h3>
                    <p className="text-[11px] text-slate-300">Prioritizes high-risk anomalies with 60% false-positive reduction.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10 text-brand-gold ring-1 ring-white/10">
                    <span className="material-symbols-outlined text-[18px]">verified_user</span>
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-white">Audit-Ready SAR Files</h3>
                    <p className="text-[11px] text-slate-300">Generates FinCEN-ready narrative dossiers in one click.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Compliance Badge */}
            <div className="relative z-10 mt-8 pt-6 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-300">
              <span className="inline-flex items-center gap-1.5 font-medium">
                <span className="material-symbols-outlined text-brand-gold text-[16px]">lock</span>
                256-bit TLS • SOC2 Type II
              </span>
              <span className="font-mono text-[10px] text-slate-400">v2.4.0</span>
            </div>
          </div>

          {/* Right: Authentication Form */}
          <div className="p-8 lg:p-12 lg:col-span-7 flex flex-col justify-center">
            <div className="mb-6">
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-blue dark:text-blue-400">
                Institutional Access
              </span>
              <h2 className="text-2xl font-bold tracking-tight text-text-primary mt-1">
                Sign in to Portal
              </h2>
              <p className="text-xs text-text-secondary mt-1">
                Enter your compliance officer credentials to access the live triage queue.
              </p>
            </div>

            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}
