"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  DossierSealArt,
  ExplainableShapArt,
  HeroNetworkVectorArt,
  PipelineVectorArt,
  RealTimeRadarArt,
  TopologyClusterArt,
} from "@/components/landing/VectorArt";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { ArrowRightIcon, CheckIcon } from "@/components/ui/icons";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { SentinelLogo } from "@/components/ui/SentinelLogo";

interface LandingViewProps {
  isAuthenticated: boolean;
  userEmail: string | null;
}

const NAV_ITEMS = [
  { label: "Institutional Overview", href: "#home", id: "home" },
  { label: "Core Capabilities", href: "#features", id: "features" },
  { label: "Banking Rails", href: "#about", id: "about" },
  { label: "Capital Metrics", href: "#solutions", id: "solutions" },
  { label: "Advisory & Contact", href: "#contact", id: "contact" },
];

const SIMULATED_ALERTS = [
  {
    id: "ALT-9204",
    type: "Multi-Hop Correspondent Layering",
    amount: "$1,840,200",
    risk: "high" as const,
    time: "Just now",
    entity: "Correspondent Syndicate 0x8F..2A",
  },
  {
    id: "ALT-9203",
    type: "Rapid Velocity Structuring",
    amount: "$9,850 x 8 ACH",
    risk: "medium" as const,
    time: "2m ago",
    entity: "Apex Commercial Holdings LLC",
  },
  {
    id: "ALT-9202",
    type: "Sanctioned Remittance Corridor",
    amount: "$420,000",
    risk: "critical" as const,
    time: "5m ago",
    entity: "Vanguard Transit Co / Swift MT103",
  },
  {
    id: "ALT-9201",
    type: "Dormant Escrow Re-activation",
    amount: "$54,100",
    risk: "low" as const,
    time: "12m ago",
    entity: "Corporate Escrow #4910",
  },
];

export function LandingView({ isAuthenticated, userEmail }: LandingViewProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [scrolled, setScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState<"vector" | "stream">("vector");

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);

      const sectionIds = ["home", "features", "about", "solutions", "contact"];
      const scrollPosition = window.scrollY + 140;

      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const el = document.getElementById(sectionIds[i]);
        if (el) {
          const top = el.offsetTop;
          if (scrollPosition >= top) {
            setActiveSection(sectionIds[i]);
            break;
          }
        }
      }
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    id: string,
  ) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: id === "home" ? 0 : offsetPosition,
        behavior: "smooth",
      });
      setActiveSection(id);
      setMobileMenuOpen(false);
    }
  };

  return (
    <div className="bg-bg text-text-primary selection:bg-brand-blue/20 selection:text-text-primary min-h-screen transition-colors">
      {/* 1. CLEAN INSTITUTIONAL BANKING NAVIGATION BAR */}
      <header
        className={`sticky top-0 z-50 transition-all duration-200 ${
          scrolled
            ? "border-border bg-surface/95 border-b shadow-xs backdrop-blur-md"
            : "border-border/60 bg-surface/85 border-b backdrop-blur-sm"
        }`}
      >
        {/* Top Institutional Notification Ribbon */}
        <div className="border-border/50 flex items-center justify-between border-b bg-slate-900 px-6 py-1 text-[10.5px] font-medium tracking-wide text-slate-300">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              FEDERAL RESERVE &amp; FINCEN REPORTING PROTOCOL READY • FFIEC
              COMPLIANT
            </span>
            <span className="hidden font-mono text-[10px] text-slate-400 md:inline-block">
              CLEARING RAILS: 100% OPERATIONAL
            </span>
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-3">
          {/* Brand Logo */}
          <Link
            href="#home"
            onClick={(e) => handleNavClick(e, "home")}
            className="group flex items-center gap-3 focus:outline-none"
          >
            <SentinelLogo size={22} subtitle="INSTITUTIONAL BANKING" />
          </Link>

          {/* Navigation Links with Clean Banking Typography */}
          <nav className="hidden items-center gap-7 text-xs font-semibold md:flex">
            {NAV_ITEMS.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <a
                  key={item.id}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item.id)}
                  className={`transition-colors duration-150 ${
                    isActive
                      ? "text-brand-blue font-bold"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3">
            <ThemeToggle />

            {isAuthenticated ? (
              <div className="flex items-center gap-2.5">
                {userEmail && (
                  <span className="text-text-muted hidden font-mono text-[11px] xl:inline-block">
                    {userEmail}
                  </span>
                )}
                <Link
                  href="/dashboard"
                  className="bg-brand-blue hover:bg-brand-blueLight inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-xs font-semibold text-white shadow-xs transition-all active:scale-[0.98]"
                >
                  <span>Banking Portal</span>
                  <ArrowRightIcon className="h-3.5 w-3.5" />
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="text-text-secondary hover:text-text-primary px-3 py-1.5 text-xs font-semibold transition-colors"
                >
                  Client Sign In
                </Link>
                <Link
                  href="/signup"
                  className="bg-brand-blue hover:bg-brand-blueLight inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-xs font-semibold text-white shadow-xs transition-all active:scale-[0.98]"
                >
                  <span>Request Access</span>
                  <ArrowRightIcon className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="border-border text-text-secondary hover:text-text-primary flex h-8 w-8 items-center justify-center rounded-md border md:hidden"
              aria-label="Toggle navigation menu"
            >
              <span className="text-sm font-bold">
                {mobileMenuOpen ? "✕" : "☰"}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Nav */}
        {mobileMenuOpen && (
          <div className="border-border bg-surface border-b px-6 py-4 md:hidden">
            <div className="flex flex-col gap-2.5 text-xs font-semibold">
              {NAV_ITEMS.map((item) => (
                <a
                  key={item.id}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item.id)}
                  className="text-text-secondary hover:text-text-primary py-1.5"
                >
                  {item.label}
                </a>
              ))}
              <div className="border-border mt-2 flex flex-col gap-2 border-t pt-3">
                {isAuthenticated ? (
                  <Link
                    href="/dashboard"
                    className="bg-brand-blue hover:bg-brand-blueLight flex justify-center rounded-md py-2 text-xs font-semibold text-white"
                  >
                    Banking Portal
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="border-border text-text-primary flex justify-center rounded-md border py-2 text-xs font-medium"
                    >
                      Client Sign In
                    </Link>
                    <Link
                      href="/signup"
                      className="bg-brand-blue hover:bg-brand-blueLight flex justify-center rounded-md py-2 text-xs font-semibold text-white"
                    >
                      Request Access
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* 2. INSTITUTIONAL HERO SECTION WITH VECTOR ART */}
      <section
        className="bg-grid-minimal relative scroll-mt-20 overflow-hidden pt-12 pb-20 lg:pt-16 lg:pb-28"
        id="home"
      >
        <div className="ambient-glow-blue pointer-events-none absolute top-10 left-1/2 h-[450px] w-[700px] -translate-x-1/2 opacity-50 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-10">
            {/* Left Side: Institutional Value Proposition */}
            <div className="flex flex-col items-start lg:col-span-6">
              {/* Institutional Pill Badge */}
              <div className="border-border bg-surface text-text-primary mb-6 inline-flex items-center gap-2 rounded-full border px-3.5 py-1 text-xs font-semibold tracking-wide shadow-2xs">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <span className="font-bold tracking-tight">
                  TIER-1 BANKING DEFENSE
                </span>
                <span className="text-text-muted">•</span>
                <span className="text-text-secondary font-mono text-[11px]">
                  CORRESPONDENT AUDITABLE
                </span>
              </div>

              {/* Authoritative Display Headline */}
              <h1 className="text-text-primary mb-5 text-4xl leading-[1.15] font-extrabold tracking-tight sm:text-5xl lg:text-[50px]">
                Autonomous Anti-Money Laundering Defense for Modern Banking.
              </h1>

              {/* Balanced Subtitle */}
              <p className="text-text-secondary mb-8 max-w-xl text-base leading-relaxed font-normal sm:text-lg">
                Institutional-grade transaction surveillance combining Graph
                Neural Networks, sub-second ledger scoring, and automated SAR
                dossier generation for commercial banks, clearinghouses, and
                global payment rails.
              </p>

              {/* Clean Banking CTAs */}
              <div className="mb-10 flex w-full flex-wrap items-center gap-3 sm:w-auto">
                <Link
                  href={isAuthenticated ? "/dashboard" : "/signup"}
                  className="bg-brand-blue hover:bg-brand-blueLight inline-flex w-full items-center justify-center gap-2 rounded-md px-6 py-3 text-xs font-bold tracking-wide text-white shadow-xs transition-all active:scale-[0.98] sm:w-auto"
                >
                  <span>
                    {isAuthenticated
                      ? "Enter Banking Portal"
                      : "Provision Sandbox"}
                  </span>
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>

                <a
                  href="#features"
                  onClick={(e) => handleNavClick(e, "features")}
                  className="border-border bg-surface text-text-primary hover:bg-surface-hover inline-flex w-full items-center justify-center gap-2 rounded-md border px-6 py-3 text-xs font-semibold shadow-2xs transition-all active:scale-[0.98] sm:w-auto"
                >
                  <span>Inspect Banking Rails</span>
                </a>
              </div>

              {/* Metric Pillars */}
              <div className="border-border text-text-secondary flex w-full flex-wrap items-center gap-6 border-t pt-5 text-xs font-medium">
                <div className="flex items-center gap-1.5">
                  <CheckIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-text-primary font-semibold">
                    99.2% Precision
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-text-primary font-semibold">
                    SOC2 Type II
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-text-primary font-semibold">
                    &lt;18ms Clearance
                  </span>
                </div>
              </div>
            </div>

            {/* Right Side: Vector Art & Live Banking Surveillance Showcase */}
            <div className="relative lg:col-span-6">
              <div className="border-border bg-surface overflow-hidden rounded-xl border shadow-md transition-all">
                {/* Banking Terminal Chrome Header */}
                <div className="border-border flex items-center justify-between border-b bg-slate-900 px-4 py-3 text-white">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                    <span className="ml-2 font-mono text-[11px] text-slate-300">
                      fedwire://node-us-east/correspondent-mesh
                    </span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[10px] font-semibold text-emerald-400">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                    LEDGER ACTIVE
                  </div>
                </div>

                {/* Sub-header Switcher */}
                <div className="border-border bg-surface flex items-center justify-between border-b px-4 py-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setActiveTab("vector")}
                      className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                        activeTab === "vector"
                          ? "text-text-primary bg-slate-100 shadow-2xs dark:bg-slate-800"
                          : "text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      Topological Vector Mesh
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("stream")}
                      className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                        activeTab === "stream"
                          ? "text-text-primary bg-slate-100 shadow-2xs dark:bg-slate-800"
                          : "text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      Correspondent Triage Queue
                    </button>
                  </div>
                  <span className="text-text-muted font-mono text-[10px] font-bold">
                    FFIEC-GNN v2.4
                  </span>
                </div>

                {/* Content Area with Vector Art Intact */}
                {activeTab === "vector" ? (
                  <div className="bg-surface p-3">
                    <HeroNetworkVectorArt className="rounded-lg shadow-inner" />
                  </div>
                ) : (
                  <div className="divide-border bg-surface divide-y p-1">
                    {SIMULATED_ALERTS.map((alert) => (
                      <div
                        key={alert.id}
                        className="hover:bg-surface-hover flex items-center justify-between p-3.5 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <RiskBadge category={alert.risk} />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-text-primary text-xs font-bold">
                                {alert.type}
                              </span>
                              <span className="text-text-muted font-mono text-[10px]">
                                {alert.id}
                              </span>
                            </div>
                            <p className="text-text-secondary text-[11px] font-medium">
                              {alert.entity}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-text-primary font-mono text-xs font-bold">
                            {alert.amount}
                          </p>
                          <span className="text-text-muted font-mono text-[10px]">
                            {alert.time}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Footer status bar */}
                <div className="border-border bg-surface-hover/70 text-text-muted flex items-center justify-between border-t px-4 py-2.5 font-mono text-[10px]">
                  <span>Rail: ISO 20022 Correspondent Protocol</span>
                  <span>Scored: 50,000 tx/sec • 0 Drop</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. BANKING CAPABILITIES WITH VECTOR SPOT ART */}
      <section
        className="border-border relative scroll-mt-20 border-t py-20 lg:py-24"
        id="features"
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <span className="text-brand-blue text-[11px] font-bold tracking-wider uppercase">
              Institutional Capabilities
            </span>
            <h2 className="text-text-primary mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Engineered for Compliance Officers &amp; Chief Risk Executives
            </h2>
            <p className="text-text-secondary mt-3 text-sm leading-relaxed font-normal">
              Eliminate up to 70% of false positive noise across ACH, Fedwire,
              SWIFT, and SEPA rails without sacrificing audit defensibility.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Card 1 */}
            <div className="border-border bg-surface flex flex-col justify-between rounded-xl border p-6 shadow-xs transition-all duration-200 hover:border-slate-300 hover:shadow-md dark:hover:border-slate-700">
              <div>
                <div className="border-border mb-4 overflow-hidden rounded-lg border bg-slate-50 p-1 dark:bg-slate-900/60">
                  <RealTimeRadarArt />
                </div>
                <h3 className="text-text-primary mb-2 text-base font-bold">
                  Sub-Second Ledger Triage
                </h3>
                <p className="text-text-secondary text-xs leading-relaxed font-normal">
                  Real-time transaction scoring across multi-corridor velocity
                  clusters and threshold anomalies with under 18ms latency.
                </p>
              </div>
              <div className="border-border mt-6 border-t pt-3">
                <span className="text-text-muted font-mono text-[10px] font-semibold">
                  LATENCY &lt; 18MS • REAL-TIME ACH
                </span>
              </div>
            </div>

            {/* Card 2 */}
            <div className="border-border bg-surface flex flex-col justify-between rounded-xl border p-6 shadow-xs transition-all duration-200 hover:border-slate-300 hover:shadow-md dark:hover:border-slate-700">
              <div>
                <div className="border-border mb-4 overflow-hidden rounded-lg border bg-slate-50 p-1 dark:bg-slate-900/60">
                  <TopologyClusterArt />
                </div>
                <h3 className="text-text-primary mb-2 text-base font-bold">
                  Multi-Hop Topology
                </h3>
                <p className="text-text-secondary text-xs leading-relaxed font-normal">
                  Uncovers complex correspondent layering, circular fund loops,
                  and synthetic entity networks invisible to flat rule engines.
                </p>
              </div>
              <div className="border-border mt-6 border-t pt-3">
                <span className="text-text-muted font-mono text-[10px] font-semibold">
                  GNN SUBGRAPH RESOLUTION
                </span>
              </div>
            </div>

            {/* Card 3 */}
            <div className="border-border bg-surface flex flex-col justify-between rounded-xl border p-6 shadow-xs transition-all duration-200 hover:border-slate-300 hover:shadow-md dark:hover:border-slate-700">
              <div>
                <div className="border-border mb-4 overflow-hidden rounded-lg border bg-slate-50 p-1 dark:bg-slate-900/60">
                  <DossierSealArt />
                </div>
                <h3 className="text-text-primary mb-2 text-base font-bold">
                  FinCEN &amp; FATF Filings
                </h3>
                <p className="text-text-secondary text-xs leading-relaxed font-normal">
                  Automated narrative compilation drafts comprehensive SAR
                  dossiers with chronological evidence chains in a single click.
                </p>
              </div>
              <div className="border-border mt-6 border-t pt-3">
                <span className="text-text-muted font-mono text-[10px] font-semibold">
                  FORM 111 COMPLIANT EXPORT
                </span>
              </div>
            </div>

            {/* Card 4 */}
            <div className="border-border bg-surface flex flex-col justify-between rounded-xl border p-6 shadow-xs transition-all duration-200 hover:border-slate-300 hover:shadow-md dark:hover:border-slate-700">
              <div>
                <div className="border-border mb-4 overflow-hidden rounded-lg border bg-slate-50 p-1 dark:bg-slate-900/60">
                  <ExplainableShapArt />
                </div>
                <h3 className="text-text-primary mb-2 text-base font-bold">
                  Examiner Audit Trail
                </h3>
                <p className="text-text-secondary text-xs leading-relaxed font-normal">
                  Every alert risk classification is supported by clear SHAP
                  decision factors, ensuring total defensibility during bank
                  supervisory audits.
                </p>
              </div>
              <div className="border-border mt-6 border-t pt-3">
                <span className="text-text-muted font-mono text-[10px] font-semibold">
                  100% EXAMINER DEFENSIBLE
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. BANKING ARCHITECTURE & PIPELINE VECTOR ART */}
      <section
        className="border-border relative scroll-mt-20 border-t bg-slate-50/70 py-20 lg:py-28 dark:bg-slate-900/30"
        id="about"
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
            {/* Left Narrative */}
            <div className="lg:col-span-5">
              <span className="text-brand-blue text-[11px] font-bold tracking-wider uppercase">
                Core Banking Rails
              </span>
              <h2 className="text-text-primary mt-2 mb-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
                High-Throughput Intelligence for Capital Rails
              </h2>
              <p className="text-text-secondary mb-6 text-sm leading-relaxed font-normal">
                Legacy rules systems generate crushing backlogs of false alarms.
                AML Sentinel integrates natively into your core banking bus to
                verify and classify transactions with institutional accuracy.
              </p>

              <div className="space-y-3.5">
                <div className="border-border bg-surface flex items-start gap-3.5 rounded-lg border p-4 shadow-2xs">
                  <div className="border-border bg-surface-hover text-brand-blue flex h-7 w-7 shrink-0 items-center justify-center rounded-md border text-xs font-bold">
                    01
                  </div>
                  <div>
                    <h3 className="text-text-primary text-xs font-bold">
                      ISO 20022 Financial Messaging Support
                    </h3>
                    <p className="text-text-secondary mt-0.5 text-xs">
                      Native parsing for pacs.008, pacs.009, and camt.053
                      settlement messages.
                    </p>
                  </div>
                </div>

                <div className="border-border bg-surface flex items-start gap-3.5 rounded-lg border p-4 shadow-2xs">
                  <div className="border-border bg-surface-hover text-brand-blue flex h-7 w-7 shrink-0 items-center justify-center rounded-md border text-xs font-bold">
                    02
                  </div>
                  <div>
                    <h3 className="text-text-primary text-xs font-bold">
                      Graph Entity Resolution
                    </h3>
                    <p className="text-text-secondary mt-0.5 text-xs">
                      Deep cross-account mapping linking ultimate beneficial
                      owners, tax IDs, and IBANs.
                    </p>
                  </div>
                </div>

                <div className="border-border bg-surface flex items-start gap-3.5 rounded-lg border p-4 shadow-2xs">
                  <div className="border-border bg-surface-hover text-brand-blue flex h-7 w-7 shrink-0 items-center justify-center rounded-md border text-xs font-bold">
                    03
                  </div>
                  <div>
                    <h3 className="text-text-primary text-xs font-bold">
                      Cryptographic Case Ledger
                    </h3>
                    <p className="text-text-secondary mt-0.5 text-xs">
                      Every compliance officer note and disposition is sealed
                      with SHA-256 audit stamps.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Pipeline Vector Graphic Intact */}
            <div className="lg:col-span-7">
              <div className="border-border bg-surface rounded-xl border p-6 shadow-sm">
                <div className="border-border mb-4 flex items-center justify-between border-b pb-3">
                  <div>
                    <span className="text-text-primary text-xs font-bold">
                      Correspondent Clearance Pipeline
                    </span>
                    <p className="text-text-secondary text-[11px]">
                      Automated lifecycle from stream ingestion to SAR export
                    </p>
                  </div>
                  <span className="text-text-muted font-mono text-[10px] font-bold">
                    RAIL v4.2-PROD
                  </span>
                </div>

                {/* Vector Graphic Intact */}
                <div className="p-2">
                  <PipelineVectorArt />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. CAPITAL METRICS & BANKING SOLUTIONS */}
      <section
        className="border-border relative scroll-mt-20 border-t py-20 lg:py-24"
        id="solutions"
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="border-border grid grid-cols-2 gap-8 border-b pb-16 lg:grid-cols-4">
            <div>
              <p className="text-text-primary text-3xl font-extrabold tracking-tight tabular-nums sm:text-4xl">
                70%
              </p>
              <p className="text-text-secondary mt-1 text-xs font-semibold">
                False Positive Reduction
              </p>
            </div>
            <div>
              <p className="text-text-primary text-3xl font-extrabold tracking-tight tabular-nums sm:text-4xl">
                &lt;18ms
              </p>
              <p className="text-text-secondary mt-1 text-xs font-semibold">
                Settlement Clearance Latency
              </p>
            </div>
            <div>
              <p className="text-text-primary text-3xl font-extrabold tracking-tight tabular-nums sm:text-4xl">
                99.2%
              </p>
              <p className="text-text-secondary mt-1 text-xs font-semibold">
                Recall on Layering Loops
              </p>
            </div>
            <div>
              <p className="text-text-primary text-3xl font-extrabold tracking-tight tabular-nums sm:text-4xl">
                $14.2B+
              </p>
              <p className="text-text-secondary mt-1 text-xs font-semibold">
                Protected Capital Volume
              </p>
            </div>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="border-border bg-surface rounded-xl border p-6 shadow-2xs">
              <span className="text-brand-blue text-[10px] font-bold tracking-wider uppercase">
                Enterprise Segment
              </span>
              <h3 className="text-text-primary mt-1 mb-2 text-sm font-bold">
                Tier-1 Commercial Banks
              </h3>
              <p className="text-text-secondary text-xs leading-relaxed font-normal">
                Direct integration into core banking engines and correspondent
                gateways without disrupting existing FinCEN regulatory filing
                queues.
              </p>
            </div>
            <div className="border-border bg-surface rounded-xl border p-6 shadow-2xs">
              <span className="text-brand-blue text-[10px] font-bold tracking-wider uppercase">
                Digital Rails
              </span>
              <h3 className="text-text-primary mt-1 mb-2 text-sm font-bold">
                Regulated FinTechs &amp; Neobanks
              </h3>
              <p className="text-text-secondary text-xs leading-relaxed font-normal">
                Developer-first REST and webhook pipelines designed to scale
                risk surveillance seamlessly as cardholder accounts multiply.
              </p>
            </div>
            <div className="border-border bg-surface rounded-xl border p-6 shadow-2xs">
              <span className="text-brand-blue text-[10px] font-bold tracking-wider uppercase">
                Global Clearing
              </span>
              <h3 className="text-text-primary mt-1 mb-2 text-sm font-bold">
                Cross-Border Remittance
              </h3>
              <p className="text-text-secondary text-xs leading-relaxed font-normal">
                Multi-currency corridor scoring to instantly isolate sanctioned
                entities, nested correspondent accounts, and high-velocity
                smurfing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. INSTITUTIONAL BANKING CTA BANNER */}
      <section className="relative scroll-mt-20 px-6 py-20" id="demo">
        <div className="bg-brand-navy relative mx-auto max-w-5xl overflow-hidden rounded-2xl border border-slate-800 p-10 text-center text-white shadow-xl sm:p-14">
          {/* Subtle Ambient Radial within Banking Banner */}
          <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-blue-600/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-emerald-600/20 blur-3xl" />

          <div className="relative z-10">
            <span className="text-[11px] font-bold tracking-widest text-blue-400 uppercase">
              INSTITUTIONAL ONBOARDING
            </span>
            <h2 className="mt-2 mb-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Elevate Your Banking Surveillance Rails
            </h2>
            <p className="mx-auto mb-8 max-w-xl text-sm leading-relaxed font-normal text-slate-300">
              Experience graph-enhanced anti-money laundering surveillance
              configured directly against your institutional transaction
              taxonomy.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href={isAuthenticated ? "/dashboard" : "/signup"}
                className="inline-flex items-center gap-2 rounded-md bg-white px-6 py-3 text-xs font-bold text-slate-950 shadow-xs transition-all hover:bg-slate-100 active:scale-[0.98]"
              >
                <span>
                  {isAuthenticated
                    ? "Enter Banking Portal"
                    : "Provision Sandbox"}
                </span>
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
              <a
                href="#contact"
                onClick={(e) => handleNavClick(e, "contact")}
                className="inline-flex items-center gap-2 rounded-md border border-slate-700 bg-slate-800/80 px-6 py-3 text-xs font-semibold text-white transition-all hover:bg-slate-700 active:scale-[0.98]"
              >
                <span>Request Supervisory Briefing</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 7. CLEAN BANKING FOOTER */}
      <footer
        className="border-border bg-surface relative scroll-mt-20 border-t py-12 text-xs"
        id="contact"
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="border-border grid grid-cols-1 gap-8 border-b pb-12 md:grid-cols-4">
            <div className="md:col-span-2">
              <SentinelLogo size={22} subtitle="INSTITUTIONAL BANKING" />
              <p className="text-text-secondary mt-3 max-w-sm text-xs leading-relaxed font-normal">
                Institutional-grade financial crime intelligence platform
                engineered for tier-1 commercial banking, regulatory triage, and
                correspondent capital protection.
              </p>
              <div className="mt-4 flex items-center gap-2 font-mono text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>
                  All Banking Surveillance Nodes Active • 18ms Latency
                </span>
              </div>
            </div>

            <div>
              <h4 className="text-text-primary mb-3 text-xs font-bold tracking-wider uppercase">
                Banking Portal
              </h4>
              <ul className="text-text-secondary space-y-2 font-medium">
                <li>
                  <Link
                    href="/dashboard"
                    className="hover:text-text-primary transition-colors"
                  >
                    Dashboard Overview
                  </Link>
                </li>
                <li>
                  <Link
                    href="/alerts"
                    className="hover:text-text-primary transition-colors"
                  >
                    Correspondent Triage
                  </Link>
                </li>
                <li>
                  <Link
                    href="/network"
                    className="hover:text-text-primary transition-colors"
                  >
                    Graph Topology Explorer
                  </Link>
                </li>
                <li>
                  <Link
                    href="/reports"
                    className="hover:text-text-primary transition-colors"
                  >
                    FinCEN SAR Dossiers
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-text-primary mb-3 text-xs font-bold tracking-wider uppercase">
                Regulatory Standards
              </h4>
              <ul className="text-text-secondary space-y-2 font-medium">
                <li>
                  <span className="flex items-center gap-1.5">
                    <CheckIcon className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    SOC2 Type II Certified
                  </span>
                </li>
                <li>
                  <span className="flex items-center gap-1.5">
                    <CheckIcon className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    FinCEN Form 111 Auditable
                  </span>
                </li>
                <li>
                  <span className="flex items-center gap-1.5">
                    <CheckIcon className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    FATF Recommendation 16 (Travel Rule)
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="text-text-muted mt-8 flex flex-col items-center justify-between gap-4 font-mono text-[11px] sm:flex-row">
            <p>
              © {new Date().getFullYear()} AML Sentinel Banking Systems, Inc.
              All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <span>FEDWIRE / ACH CORRESPONDENT READY</span>
              <span>•</span>
              <span>AES-256 ENCRYPTION</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
