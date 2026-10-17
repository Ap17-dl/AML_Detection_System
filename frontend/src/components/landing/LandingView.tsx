"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { ThemeToggle } from "@/components/layout/ThemeToggle";
import {
  ActivityIcon,
  ArrowRightIcon,
  CheckIcon,
  LockIcon,
  NetworkIcon,
  ReportsIcon,
  ShieldCheckIcon,
  ZapIcon,
} from "@/components/ui/icons";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { SentinelLogo } from "@/components/ui/SentinelLogo";

interface LandingViewProps {
  isAuthenticated: boolean;
  userEmail: string | null;
}

const NAV_ITEMS = [
  { label: "Overview", href: "#home", id: "home" },
  { label: "Capabilities", href: "#features", id: "features" },
  { label: "Architecture", href: "#about", id: "about" },
  { label: "Metrics", href: "#solutions", id: "solutions" },
  { label: "Contact", href: "#contact", id: "contact" },
];

const SIMULATED_ALERTS = [
  {
    id: "ALT-9204",
    type: "Multi-Hop Layering",
    amount: "$184,200",
    risk: "high" as const,
    time: "Just now",
    entity: "Syndicate 0x8F..2A",
  },
  {
    id: "ALT-9203",
    type: "Structuring Rapid Velocity",
    amount: "$9,850 x 8",
    risk: "medium" as const,
    time: "2m ago",
    entity: "Apex Holdings LLC",
  },
  {
    id: "ALT-9202",
    type: "High-Risk Remittance Corridor",
    amount: "$420,000",
    risk: "critical" as const,
    time: "5m ago",
    entity: "Vanguard Transit Co",
  },
  {
    id: "ALT-9201",
    type: "Dormant Account Re-activation",
    amount: "$54,100",
    risk: "low" as const,
    time: "12m ago",
    entity: "Private Node #4910",
  },
];

export function LandingView({ isAuthenticated, userEmail }: LandingViewProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [scrolled, setScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState<"stream" | "topology">("stream");

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
    <div className="bg-bg text-text-primary min-h-screen selection:bg-brand-blue/20 selection:text-text-primary transition-colors">
      {/* 1. MINIMALIST TOP NAVIGATION BAR */}
      <header
        className={`sticky top-0 z-50 transition-all duration-200 ${
          scrolled
            ? "border-b border-border/80 bg-surface/85 backdrop-blur-md shadow-2xs"
            : "border-b border-transparent bg-bg/70 backdrop-blur-sm"
        }`}
      >
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-3.5">
          {/* Brand Logo */}
          <Link
            href="#home"
            onClick={(e) => handleNavClick(e, "home")}
            className="group flex items-center gap-3 focus:outline-none"
          >
            <SentinelLogo size={22} subtitle="SURVEILLANCE" />
          </Link>

          {/* Navigation Links */}
          <nav className="hidden items-center gap-7 text-xs font-medium md:flex">
            {NAV_ITEMS.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <a
                  key={item.id}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item.id)}
                  className={`transition-colors duration-150 ${
                    isActive
                      ? "text-text-primary font-semibold"
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
                  <span className="hidden font-mono text-[11px] text-text-muted xl:inline-block">
                    {userEmail}
                  </span>
                )}
                <Link
                  href="/dashboard"
                  className="bg-text-primary text-surface hover:opacity-90 inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold shadow-xs transition-all active:scale-[0.98]"
                >
                  <span>Dashboard</span>
                  <ArrowRightIcon className="h-3.5 w-3.5" />
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="text-text-secondary hover:text-text-primary px-3 py-1.5 text-xs font-medium transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="bg-text-primary text-surface hover:opacity-90 inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold shadow-xs transition-all active:scale-[0.98]"
                >
                  <span>Get Started</span>
                  <ArrowRightIcon className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="border-border text-text-secondary hover:text-text-primary flex h-8 w-8 items-center justify-center rounded-lg border md:hidden"
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
            <div className="flex flex-col gap-2.5 text-xs font-medium">
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
                    className="bg-text-primary text-surface flex justify-center rounded-lg py-2 text-xs font-semibold"
                  >
                    Go to Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="border-border text-text-primary flex justify-center rounded-lg border py-2 text-xs font-medium"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/signup"
                      className="bg-text-primary text-surface flex justify-center rounded-lg py-2 text-xs font-semibold"
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* 2. HERO SECTION */}
      <section
        className="bg-grid-minimal relative scroll-mt-20 overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-32"
        id="home"
      >
        {/* Subtle Ambient Radial Lighting */}
        <div className="ambient-glow-blue pointer-events-none absolute top-10 left-1/2 -translate-x-1/2 h-[450px] w-[700px] blur-3xl opacity-50" />

        <div className="relative z-10 mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-10">
            {/* Left Side: Minimalist Value Proposition */}
            <div className="flex flex-col items-start lg:col-span-6">
              {/* Pill Status Badge */}
              <div className="border-border bg-surface/90 text-text-primary mb-6 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold tracking-wide shadow-2xs backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <span>AML Sentinel 2.4</span>
                <span className="text-text-muted">•</span>
                <span className="text-text-secondary font-mono">Graph Intelligence</span>
              </div>

              {/* Minimalist Display Headline */}
              <h1 className="text-text-primary mb-5 text-4xl leading-[1.15] font-extrabold tracking-tight sm:text-5xl lg:text-[54px]">
                Autonomous AML Detection Engineered for Precision.
              </h1>

              {/* Subtitle */}
              <p className="text-text-secondary mb-8 max-w-xl text-base leading-relaxed sm:text-lg">
                Harness explainable Graph Neural Networks and sub-second
                transaction scoring to eliminate false positives and produce
                audit-defensible SAR dossiers.
              </p>

              {/* CTAs */}
              <div className="mb-10 flex w-full flex-wrap items-center gap-3 sm:w-auto">
                <Link
                  href={isAuthenticated ? "/dashboard" : "/signup"}
                  className="bg-text-primary text-surface hover:opacity-90 inline-flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3 text-xs font-semibold tracking-wide shadow-sm transition-all active:scale-[0.98] sm:w-auto"
                >
                  <span>
                    {isAuthenticated ? "Launch Dashboard" : "Deploy Sandbox"}
                  </span>
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>

                <a
                  href="#features"
                  onClick={(e) => handleNavClick(e, "features")}
                  className="border-border bg-surface text-text-primary hover:bg-surface-hover inline-flex w-full items-center justify-center gap-2 rounded-lg border px-6 py-3 text-xs font-semibold transition-all active:scale-[0.98] sm:w-auto"
                >
                  <span>Explore Architecture</span>
                </a>
              </div>

              {/* Metric Pillars */}
              <div className="border-border flex w-full flex-wrap items-center gap-6 border-t pt-5 text-xs text-text-secondary">
                <div className="flex items-center gap-1.5 font-medium">
                  <CheckIcon className="h-4 w-4 text-emerald-500" />
                  <span>99.2% Precision</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium">
                  <CheckIcon className="h-4 w-4 text-emerald-500" />
                  <span>SOC2 Type II</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium">
                  <CheckIcon className="h-4 w-4 text-emerald-500" />
                  <span>&lt;18ms Latency</span>
                </div>
              </div>
            </div>

            {/* Right Side: High-Precision Live Terminal / UI Mockup */}
            <div className="relative lg:col-span-6">
              <div className="border-border bg-surface overflow-hidden rounded-xl border shadow-lg transition-all">
                {/* Window Chrome Header */}
                <div className="border-border bg-surface-hover/60 flex items-center justify-between border-b px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-border" />
                    <span className="h-2.5 w-2.5 rounded-full bg-border" />
                    <span className="h-2.5 w-2.5 rounded-full bg-border" />
                    <span className="ml-2 font-mono text-[11px] text-text-muted">
                      node://cluster-us-east/triage
                    </span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[10px] text-emerald-500">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                    INFERENCE LIVE
                  </div>
                </div>

                {/* Sub-header Tabs */}
                <div className="border-border flex items-center justify-between border-b bg-surface px-4 py-2 text-xs">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setActiveTab("stream")}
                      className={`rounded-md px-3 py-1 font-medium transition-colors ${
                        activeTab === "stream"
                          ? "bg-surface-hover text-text-primary"
                          : "text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      Alert Stream
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("topology")}
                      className={`rounded-md px-3 py-1 font-medium transition-colors ${
                        activeTab === "topology"
                          ? "bg-surface-hover text-text-primary"
                          : "text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      Network Topology
                    </button>
                  </div>
                  <span className="font-mono text-[10px] text-text-muted">
                    FPS: 60 • 4 Nodes
                  </span>
                </div>

                {/* Content Area */}
                {activeTab === "stream" ? (
                  <div className="divide-border divide-y p-1">
                    {SIMULATED_ALERTS.map((alert) => (
                      <div
                        key={alert.id}
                        className="hover:bg-surface-hover flex items-center justify-between p-3.5 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <RiskBadge category={alert.risk} />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-text-primary text-xs font-semibold">
                                {alert.type}
                              </span>
                              <span className="font-mono text-[10px] text-text-muted">
                                {alert.id}
                              </span>
                            </div>
                            <p className="text-text-secondary text-[11px]">
                              {alert.entity}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-text-primary font-mono text-xs font-bold">
                            {alert.amount}
                          </p>
                          <span className="font-mono text-[10px] text-text-muted">
                            {alert.time}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex h-72 flex-col items-center justify-center p-6 text-center">
                    <div className="border-border bg-surface-hover relative mb-3 flex h-24 w-24 items-center justify-center rounded-2xl border">
                      <NetworkIcon className="h-12 w-12 text-brand-blue" />
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-blue opacity-75" />
                        <span className="relative inline-flex h-3 w-3 rounded-full bg-brand-blue" />
                      </span>
                    </div>
                    <p className="text-text-primary text-xs font-semibold">
                      Graph Neural Subgraph Visualizer
                    </p>
                    <p className="text-text-secondary mt-1 max-w-xs text-[11px]">
                      Connected topology across 3 synthetic shell layers and 48
                      remittance vertices detected.
                    </p>
                  </div>
                )}

                {/* Footer status bar */}
                <div className="border-border bg-surface-hover/30 flex items-center justify-between border-t px-4 py-2.5 font-mono text-[10px] text-text-muted">
                  <span>Model: GNN-Surveillance-v4</span>
                  <span>F1-Score: 0.941</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CAPABILITIES / FEATURES (4 Minimalist Border Cards) */}
      <section
        className="border-border relative scroll-mt-20 border-t py-20 lg:py-28"
        id="features"
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <span className="text-brand-blue text-[11px] font-semibold tracking-wider uppercase">
              Core Capabilities
            </span>
            <h2 className="text-text-primary mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Engineered to Eliminate False Positives
            </h2>
            <p className="text-text-secondary mt-3 text-sm leading-relaxed">
              Designed specifically for tier-1 compliance units and fintech
              infrastructure handling millions of daily events.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Card 1 */}
            <div className="border-border bg-surface hover:border-text-secondary/40 flex flex-col justify-between rounded-xl border p-6 shadow-2xs transition-all duration-200">
              <div>
                <div className="border-border bg-surface-hover text-text-primary mb-5 flex h-10 w-10 items-center justify-center rounded-lg border">
                  <ZapIcon className="h-5 w-5" />
                </div>
                <h3 className="text-text-primary mb-2 text-base font-bold">
                  Sub-Second Triage
                </h3>
                <p className="text-text-secondary text-xs leading-relaxed">
                  Real-time transaction scoring across velocity clusters and
                  threshold anomalies with under 18ms latency.
                </p>
              </div>
              <div className="border-border mt-6 border-t pt-4">
                <span className="font-mono text-[10px] text-text-muted">
                  LATENCY &lt; 18MS
                </span>
              </div>
            </div>

            {/* Card 2 */}
            <div className="border-border bg-surface hover:border-text-secondary/40 flex flex-col justify-between rounded-xl border p-6 shadow-2xs transition-all duration-200">
              <div>
                <div className="border-border bg-surface-hover text-text-primary mb-5 flex h-10 w-10 items-center justify-center rounded-lg border">
                  <NetworkIcon className="h-5 w-5" />
                </div>
                <h3 className="text-text-primary mb-2 text-base font-bold">
                  Graph Topology
                </h3>
                <p className="text-text-secondary text-xs leading-relaxed">
                  Uncovers complex multi-hop layering, circular fund loops, and
                  synthetic entity networks invisible to flat rules.
                </p>
              </div>
              <div className="border-border mt-6 border-t pt-4">
                <span className="font-mono text-[10px] text-text-muted">
                  GNN SUBGRAPH EMBEDDINGS
                </span>
              </div>
            </div>

            {/* Card 3 */}
            <div className="border-border bg-surface hover:border-text-secondary/40 flex flex-col justify-between rounded-xl border p-6 shadow-2xs transition-all duration-200">
              <div>
                <div className="border-border bg-surface-hover text-text-primary mb-5 flex h-10 w-10 items-center justify-center rounded-lg border">
                  <ReportsIcon className="h-5 w-5" />
                </div>
                <h3 className="text-text-primary mb-2 text-base font-bold">
                  Audit-Ready SARs
                </h3>
                <p className="text-text-secondary text-xs leading-relaxed">
                  Automated narrative generation compiles comprehensive FinCEN
                  and FATF compliant filing dossiers in one click.
                </p>
              </div>
              <div className="border-border mt-6 border-t pt-4">
                <span className="font-mono text-[10px] text-text-muted">
                  ONE-CLICK FINCEN EXPORT
                </span>
              </div>
            </div>

            {/* Card 4 */}
            <div className="border-border bg-surface hover:border-text-secondary/40 flex flex-col justify-between rounded-xl border p-6 shadow-2xs transition-all duration-200">
              <div>
                <div className="border-border bg-surface-hover text-text-primary mb-5 flex h-10 w-10 items-center justify-center rounded-lg border">
                  <ShieldCheckIcon className="h-5 w-5" />
                </div>
                <h3 className="text-text-primary mb-2 text-base font-bold">
                  Explainable AI
                </h3>
                <p className="text-text-secondary text-xs leading-relaxed">
                  Every alert risk score is broken down into auditable feature
                  attributions and SHAP decision factors.
                </p>
              </div>
              <div className="border-border mt-6 border-t pt-4">
                <span className="font-mono text-[10px] text-text-muted">
                  100% REGULATORY AUDITABLE
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. ARCHITECTURE / ABOUT SECTION */}
      <section
        className="border-border bg-surface-hover/30 relative scroll-mt-20 border-t py-20 lg:py-28"
        id="about"
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
            {/* Left Narrative */}
            <div className="lg:col-span-6">
              <span className="text-brand-blue text-[11px] font-semibold tracking-wider uppercase">
                System Architecture
              </span>
              <h2 className="text-text-primary mt-2 mb-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Built for High-Throughput Financial Rails
              </h2>
              <p className="text-text-secondary mb-6 text-sm leading-relaxed">
                Legacy rules-based surveillance systems overwhelm compliance
                officers with over 90% false positive noise. AML Sentinel
                replaces brittle heuristics with deep topological intelligence
                that learns evolving crime patterns.
              </p>

              <div className="space-y-4">
                <div className="border-border bg-surface flex items-start gap-3.5 rounded-lg border p-4">
                  <div className="border-border bg-surface-hover text-text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border">
                    <ActivityIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-text-primary text-xs font-bold">
                      Dynamic Transaction Stream Ingestion
                    </h3>
                    <p className="text-text-secondary mt-0.5 text-xs">
                      Kafka and REST streaming ingestion supporting up to
                      50,000 events/second with zero packet drop.
                    </p>
                  </div>
                </div>

                <div className="border-border bg-surface flex items-start gap-3.5 rounded-lg border p-4">
                  <div className="border-border bg-surface-hover text-text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border">
                    <NetworkIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-text-primary text-xs font-bold">
                      Graph Neural Embeddings
                    </h3>
                    <p className="text-text-secondary mt-0.5 text-xs">
                      Real-time entity resolution connecting accounts, device
                      fingerprints, and shared IBANs.
                    </p>
                  </div>
                </div>

                <div className="border-border bg-surface flex items-start gap-3.5 rounded-lg border p-4">
                  <div className="border-border bg-surface-hover text-text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border">
                    <LockIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-text-primary text-xs font-bold">
                      End-to-End Cryptographic Auditability
                    </h3>
                    <p className="text-text-secondary mt-0.5 text-xs">
                      Every analyst action, triage rationale, and decision
                      override is stamped to an append-only ledger.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Architecture Block */}
            <div className="lg:col-span-6">
              <div className="border-border bg-surface rounded-xl border p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-text-primary text-xs font-bold">
                    Surveillance Pipeline
                  </span>
                  <span className="font-mono text-[10px] text-text-muted">
                    PIPELINE v4.2
                  </span>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  <div className="border-border bg-surface-hover/70 flex items-center justify-between rounded-lg border px-3.5 py-2.5">
                    <span className="text-text-primary font-medium">
                      01 Ingestion Rail
                    </span>
                    <span className="text-emerald-500 text-[11px]">Active (0.4ms)</span>
                  </div>
                  <div className="text-text-muted flex justify-center">↓</div>
                  <div className="border-border bg-surface-hover/70 flex items-center justify-between rounded-lg border px-3.5 py-2.5">
                    <span className="text-text-primary font-medium">
                      02 Feature Attribution &amp; SHAP
                    </span>
                    <span className="text-emerald-500 text-[11px]">Computed (3.1ms)</span>
                  </div>
                  <div className="text-text-muted flex justify-center">↓</div>
                  <div className="border-border bg-surface-hover/70 flex items-center justify-between rounded-lg border px-3.5 py-2.5">
                    <span className="text-text-primary font-medium">
                      03 Graph Neural Network Inference
                    </span>
                    <span className="text-emerald-500 text-[11px]">Scored (11.8ms)</span>
                  </div>
                  <div className="text-text-muted flex justify-center">↓</div>
                  <div className="border-border bg-text-primary text-surface flex items-center justify-between rounded-lg border px-3.5 py-2.5">
                    <span className="font-bold">
                      04 Automated SAR Dossier Generation
                    </span>
                    <span className="text-[11px] opacity-80">Instant</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. METRICS & SOLUTIONS SECTION */}
      <section
        className="border-border relative scroll-mt-20 border-t py-20 lg:py-24"
        id="solutions"
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-2 gap-8 border-b border-border pb-16 lg:grid-cols-4">
            <div>
              <p className="text-text-primary text-3xl font-extrabold tracking-tight sm:text-4xl">
                70%
              </p>
              <p className="text-text-secondary mt-1 text-xs">
                False Positive Reduction
              </p>
            </div>
            <div>
              <p className="text-text-primary text-3xl font-extrabold tracking-tight sm:text-4xl">
                &lt;18ms
              </p>
              <p className="text-text-secondary mt-1 text-xs">
                Average Scoring Latency
              </p>
            </div>
            <div>
              <p className="text-text-primary text-3xl font-extrabold tracking-tight sm:text-4xl">
                99.2%
              </p>
              <p className="text-text-secondary mt-1 text-xs">
                Recall on Layering Chains
              </p>
            </div>
            <div>
              <p className="text-text-primary text-3xl font-extrabold tracking-tight sm:text-4xl">
                $14B+
              </p>
              <p className="text-text-secondary mt-1 text-xs">
                Protected Transaction Flow
              </p>
            </div>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="border-border bg-surface rounded-xl border p-6">
              <h3 className="text-text-primary mb-2 text-sm font-bold">
                Tier-1 Banks
              </h3>
              <p className="text-text-secondary text-xs leading-relaxed">
                Integrate directly into existing core banking rails without
                disrupting ongoing FinCEN or FCA reporting workflows.
              </p>
            </div>
            <div className="border-border bg-surface rounded-xl border p-6">
              <h3 className="text-text-primary mb-2 text-sm font-bold">
                FinTech Unicorns
              </h3>
              <p className="text-text-secondary text-xs leading-relaxed">
                Developer-first APIs, webhooks, and modern client SDKs to scale
                compliance alongside rapid user growth.
              </p>
            </div>
            <div className="border-border bg-surface rounded-xl border p-6">
              <h3 className="text-text-primary mb-2 text-sm font-bold">
                Cross-Border Remittance
              </h3>
              <p className="text-text-secondary text-xs leading-relaxed">
                Multi-currency corridor scoring to flag sanctioned entities,
                nested accounts, and high-velocity smurfing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. MINIMALIST CTA SECTION */}
      <section
        className="border-border bg-surface relative scroll-mt-20 border-t py-20"
        id="demo"
      >
        <div className="mx-auto max-w-4xl px-6 text-center">
          <span className="text-brand-blue text-[11px] font-semibold tracking-wider uppercase">
            Get Started
          </span>
          <h2 className="text-text-primary mt-2 mb-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Upgrade Your Financial Crime Defense
          </h2>
          <p className="text-text-secondary mx-auto mb-8 max-w-xl text-sm leading-relaxed">
            Experience graph-enhanced AML surveillance configured directly
            against your institutional transaction taxonomy.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href={isAuthenticated ? "/dashboard" : "/signup"}
              className="bg-text-primary text-surface hover:opacity-90 inline-flex items-center gap-2 rounded-lg px-6 py-3 text-xs font-semibold shadow-xs transition-all active:scale-[0.98]"
            >
              <span>{isAuthenticated ? "Go to Dashboard" : "Create Account"}</span>
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
            <a
              href="#contact"
              onClick={(e) => handleNavClick(e, "contact")}
              className="border-border text-text-primary hover:bg-surface-hover inline-flex items-center gap-2 rounded-lg border px-6 py-3 text-xs font-medium transition-all active:scale-[0.98]"
            >
              <span>Contact Compliance Team</span>
            </a>
          </div>
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer
        className="border-border bg-bg relative scroll-mt-20 border-t py-12 text-xs"
        id="contact"
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4 pb-12 border-b border-border">
            <div className="md:col-span-2">
              <SentinelLogo size={22} subtitle="SURVEILLANCE" />
              <p className="text-text-secondary mt-3 max-w-sm text-xs leading-relaxed">
                Institutional-grade financial crime intelligence platform
                combining Graph Neural Networks and explainable transaction triage.
              </p>
              <div className="mt-4 flex items-center gap-2 font-mono text-[11px] text-emerald-500">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>All Surveillance Systems Operational</span>
              </div>
            </div>

            <div>
              <h4 className="text-text-primary mb-3 text-xs font-bold tracking-wider uppercase">
                Platform
              </h4>
              <ul className="space-y-2 text-text-secondary">
                <li>
                  <Link href="/dashboard" className="hover:text-text-primary transition-colors">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/alerts" className="hover:text-text-primary transition-colors">
                    Alert Triage
                  </Link>
                </li>
                <li>
                  <Link href="/network" className="hover:text-text-primary transition-colors">
                    Network Explorer
                  </Link>
                </li>
                <li>
                  <Link href="/reports" className="hover:text-text-primary transition-colors">
                    SAR Dossiers
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-text-primary mb-3 text-xs font-bold tracking-wider uppercase">
                Compliance &amp; Security
              </h4>
              <ul className="space-y-2 text-text-secondary">
                <li>
                  <span className="flex items-center gap-1.5">
                    <CheckIcon className="h-3.5 w-3.5 text-emerald-500" />
                    SOC2 Type II
                  </span>
                </li>
                <li>
                  <span className="flex items-center gap-1.5">
                    <CheckIcon className="h-3.5 w-3.5 text-emerald-500" />
                    FinCEN Auditable
                  </span>
                </li>
                <li>
                  <span className="flex items-center gap-1.5">
                    <CheckIcon className="h-3.5 w-3.5 text-emerald-500" />
                    FATF Recommendation 16
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 flex flex-col items-center justify-between gap-4 text-[11px] text-text-muted sm:flex-row">
            <p>© {new Date().getFullYear()} AML Sentinel, Inc. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <span className="font-mono">BUILD: v2.4.0-PROD</span>
              <span>•</span>
              <span className="font-mono">ENCRYPTION: AES-256</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
