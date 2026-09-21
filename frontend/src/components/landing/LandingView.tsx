"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

interface LandingViewProps {
  isAuthenticated: boolean;
  userEmail: string | null;
}

const NAV_ITEMS = [
  { label: "Home", href: "#home", id: "home" },
  { label: "Features", href: "#features", id: "features" },
  { label: "About", href: "#about", id: "about" },
  { label: "Solutions", href: "#solutions", id: "solutions" },
  { label: "Contact", href: "#contact", id: "contact" },
];

export function LandingView({ isAuthenticated, userEmail }: LandingViewProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [scrolled, setScrolled] = useState(false);

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

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      setSubscribed(true);
      setNewsletterEmail("");
    }
  };

  return (
    <div className="bg-brand-bgLight text-brand-dark selection:bg-brand-gold selection:text-brand-navy min-h-screen antialiased">
      {/* 1. TOP NAVIGATION BAR */}
      <header
        className={`sticky top-0 z-50 transition-all duration-200 ${
          scrolled
            ? "border-b border-slate-200/90 bg-white/95 py-3 shadow-md backdrop-blur-md"
            : "border-b border-slate-200/60 bg-white/90 py-4 shadow-sm backdrop-blur-sm"
        }`}
      >
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6">
          {/* Left: Logo & Brand Name */}
          <Link
            href="#home"
            onClick={(e) => handleNavClick(e, "home")}
            className="group flex items-center gap-3 focus:outline-none"
          >
            <div className="bg-brand-navy relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg p-1 shadow-sm">
              <Image
                src="/landing/logo.jpg"
                alt="AML Sentinel Brand Logo"
                width={40}
                height={40}
                className="h-full w-full object-contain"
                priority
              />
            </div>
            <span className="text-brand-navy group-hover:text-brand-blueLight text-xl font-extrabold tracking-tight transition-colors">
              AML Sentinel
            </span>
          </Link>

          {/* Center: Navigation links sorted by scroll order with active indicator */}
          <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
            {NAV_ITEMS.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <a
                  key={item.id}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item.id)}
                  className={`relative py-1 transition-colors duration-150 ${
                    isActive
                      ? "text-brand-blue font-bold"
                      : "hover:text-brand-navy text-slate-600"
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span className="bg-brand-blue absolute inset-x-0 -bottom-1.5 h-0.5 rounded-full" />
                  )}
                </a>
              );
            })}
          </nav>

          {/* Right: Action CTAs (Phone removed) */}
          <div className="flex items-center gap-3 sm:gap-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                {userEmail && (
                  <span className="hidden font-mono text-xs text-slate-500 xl:inline-block">
                    {userEmail}
                  </span>
                )}
                <Link
                  href="/dashboard"
                  className="bg-brand-navy hover:bg-brand-blue flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold tracking-wide text-white shadow-sm transition-all duration-150 active:scale-[0.98] sm:text-sm"
                >
                  <span>Dashboard</span>
                  <span className="material-symbols-outlined text-base leading-none">
                    arrow_forward
                  </span>
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link
                  href="/login"
                  className="hover:text-brand-navy px-3 py-2 text-xs font-semibold text-slate-700 transition-colors sm:text-sm"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="bg-brand-blue hover:bg-brand-blueLight flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold tracking-wide text-white shadow-sm transition-all duration-150 active:scale-[0.98] sm:text-sm"
                >
                  <span>Get Started</span>
                  <span className="material-symbols-outlined text-base leading-none">
                    arrow_forward
                  </span>
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-700 md:hidden"
              aria-label="Toggle navigation menu"
            >
              <span className="material-symbols-outlined text-xl">
                {mobileMenuOpen ? "close" : "menu"}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Nav sorted by scroll order */}
        {mobileMenuOpen && (
          <div className="border-t border-slate-200 bg-white px-6 py-4 md:hidden">
            <div className="flex flex-col gap-3 font-medium text-slate-700">
              {NAV_ITEMS.map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <a
                    key={item.id}
                    href={item.href}
                    onClick={(e) => handleNavClick(e, item.id)}
                    className={`py-1 transition-colors ${
                      isActive
                        ? "text-brand-blue font-bold"
                        : "hover:text-brand-navy text-slate-600"
                    }`}
                  >
                    {item.label}
                  </a>
                );
              })}
              <div className="mt-3 flex flex-col gap-2 border-t border-slate-100 pt-3">
                {isAuthenticated ? (
                  <Link
                    href="/dashboard"
                    className="bg-brand-navy flex justify-center rounded-full py-2.5 text-sm font-semibold text-white"
                  >
                    Go to Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="text-brand-navy flex justify-center rounded-full border border-slate-300 py-2 text-sm font-semibold"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/signup"
                      className="bg-brand-blue flex justify-center rounded-full py-2 text-sm font-semibold text-white"
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
        className="bg-brand-bgLight relative scroll-mt-20 overflow-hidden pt-8 pb-16 lg:pt-14 lg:pb-24"
        id="home"
      >
        {/* Golden Wave / Curved Organic Background Shape */}
        <div className="pointer-events-none absolute top-0 bottom-0 left-0 z-0 w-full overflow-hidden lg:w-7/12">
          <div className="hero-gold-blob -top-[10%] -left-[20%] h-[120%] w-[140%] -rotate-3 rounded-[38%_62%_63%_37%/41%_44%_56%_59%] opacity-95 transition-transform duration-1000" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
            {/* Left Side: Content Overlapping Golden Area */}
            <div className="flex flex-col items-start pr-0 lg:col-span-6 lg:pr-4">
              {/* Badge */}
              <div className="bg-brand-navy/90 mb-6 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold tracking-wider text-white uppercase shadow-sm">
                <span className="material-symbols-outlined text-brand-gold text-sm">
                  verified_user
                </span>
                <span>NEXT-GEN FINANCIAL CRIME DETECTION</span>
              </div>

              {/* Headline */}
              <h1 className="text-brand-navy mb-6 text-4xl leading-[1.12] font-extrabold tracking-tight sm:text-5xl lg:text-[52px]">
                Intelligent AML Detection at Your Fingertips
              </h1>

              {/* Subtitle */}
              <p className="mb-8 max-w-xl text-base leading-relaxed font-medium text-slate-800/90 sm:text-lg">
                Harness explainable graph-enhanced machine learning to detect,
                investigate, and resolve anti-money laundering alerts with
                unprecedented accuracy.
              </p>

              {/* Dual CTA Buttons */}
              <div className="mb-10 flex w-full flex-wrap items-center gap-4 sm:w-auto">
                <Link
                  href={isAuthenticated ? "/dashboard" : "/signup"}
                  className="group bg-brand-navy hover:bg-brand-blue flex w-full items-center justify-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold tracking-wide text-white shadow-md transition-all duration-150 hover:shadow-lg active:scale-[0.98] sm:w-auto"
                >
                  <span>
                    {isAuthenticated ? "Enter Dashboard" : "Request Demo"}
                  </span>
                  <span className="material-symbols-outlined text-base transition-transform group-hover:translate-x-0.5">
                    arrow_forward
                  </span>
                </Link>

                <a
                  href="#features"
                  className="text-brand-navy flex w-full items-center justify-center gap-2 rounded-full border border-slate-300 bg-white/90 px-7 py-3.5 text-sm font-semibold tracking-wide shadow-sm transition-all duration-150 hover:bg-white hover:shadow active:scale-[0.98] sm:w-auto"
                >
                  <span>Explore Platform</span>
                  <span className="material-symbols-outlined text-base text-slate-500">
                    open_in_new
                  </span>
                </a>
              </div>

              {/* Credibility Metric Badges */}
              <div className="border-brand-navy/15 text-brand-navy flex w-full flex-wrap items-center gap-4 border-t pt-2 text-xs font-semibold sm:gap-6">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-brand-navy text-base">
                    check_circle
                  </span>
                  <span className="font-bold tabular-nums">99.2% Accuracy</span>
                </div>
                <span className="text-slate-400">•</span>
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-brand-navy text-base">
                    lock
                  </span>
                  <span>SOC2 Certified</span>
                </div>
                <span className="text-slate-400">•</span>
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-brand-navy text-base">
                    sync_saved_locally
                  </span>
                  <span>Zero Data Drift</span>
                </div>
              </div>
            </div>

            {/* Right Side: Framed Image with Live Floating Risk Badge */}
            <div className="relative lg:col-span-6">
              {/* Glassmorphism Outer Shell / Mockup Frame */}
              <div className="relative rounded-2xl border border-slate-200 bg-white/80 p-3 shadow-2xl backdrop-blur-xl transition-all duration-300 sm:p-4">
                {/* Browser / App Header bar */}
                <div className="mb-2 flex items-center justify-between border-b border-slate-100 px-2 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-3 w-3 rounded-full bg-red-400" />
                    <span className="inline-block h-3 w-3 rounded-full bg-amber-400" />
                    <span className="inline-block h-3 w-3 rounded-full bg-green-400" />
                    <span className="ml-2 font-mono text-xs text-slate-400">
                      aml-sentinel-v4.production.internal
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500">
                    <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                    Live Stream: Active
                  </div>
                </div>

                {/* Dashboard Visual Image */}
                <div className="group relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
                  <div className="relative h-[320px] w-full sm:h-[400px]">
                    <Image
                      src="/landing/hero-dashboard.jpg"
                      alt="AML Sentinel High-tech Financial Compliance Station"
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.01]"
                    />
                  </div>

                  {/* Real-time Alert Notification floating over image */}
                  <div className="border-risk-high bg-brand-navy/95 absolute top-4 right-4 max-w-xs rounded-lg border-l-4 p-3 text-white shadow-xl backdrop-blur-md">
                    <div className="mb-1 flex items-center justify-between gap-3 text-[11px] font-bold tracking-wider text-slate-300 uppercase">
                      <span className="text-risk-high flex items-center gap-1 font-bold">
                        <span className="material-symbols-outlined text-sm">
                          warning
                        </span>
                        CRITICAL RISK
                      </span>
                      <span className="font-mono text-slate-400">
                        #ALT-20481
                      </span>
                    </div>
                    <div className="mb-1 text-xs font-semibold text-white">
                      Structuring Layer Identified
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-300">
                      <span>Probability Score:</span>
                      <span className="font-mono font-bold text-amber-400">
                        94/100 (HIGH)
                      </span>
                    </div>
                  </div>

                  {/* Bottom Data Ticker inside preview */}
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-between border-t border-slate-800 bg-slate-950/90 px-4 py-2 font-mono text-[11px] text-slate-300 backdrop-blur-md">
                    <div className="flex items-center gap-2">
                      <span className="text-brand-gold">TXN_ID:</span>
                      <span>0x981F...309E</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">Entities:</span>
                      <span className="font-bold text-emerald-400">
                        14 Hops
                      </span>
                    </div>
                    <div className="text-brand-gold flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">
                        analytics
                      </span>
                      <span>Graph Neural Engine</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Organic Wave Divider to Next Section */}
        <div className="mt-12 -mb-1 w-full overflow-hidden leading-none text-white">
          <svg
            className="relative block h-10 w-full lg:h-16"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0,0 C150,90 350,-40 500,60 C650,160 900,10 1200,40 L1200,120 L0,120 Z"
              fill="#FFFFFF"
            />
          </svg>
        </div>
      </section>

      {/* 3. FEATURES SECTION (4 Icon Cards in a Row) */}
      <section
        className="relative scroll-mt-20 bg-white py-20 lg:py-24"
        id="features"
      >
        <div className="mx-auto max-w-7xl px-6">
          {/* Section Header */}
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <div className="bg-brand-goldLight text-brand-dark mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold tracking-widest uppercase">
              <span className="material-symbols-outlined text-brand-goldHover text-xs">
                shield
              </span>
              KEY CAPABILITIES
            </div>
            <h2 className="text-brand-navy mb-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Engineered for Elite Compliance &amp; Financial Crime Units
            </h2>
            <p className="text-base font-normal text-slate-600">
              Designed specifically to cut through noisy transaction backlogs
              with auditable evidence and high-precision heuristic graphs.
            </p>
          </div>

          {/* 4 Icon Cards Grid */}
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {/* Card 1 */}
            <div className="group bg-brand-bgLight flex flex-col justify-between rounded-xl border border-slate-200/90 p-8 shadow-sm transition-all duration-300 hover:bg-white hover:shadow-xl">
              <div>
                <div className="border-brand-gold mb-6 flex h-16 w-16 items-center justify-center rounded-full border-2 p-1 transition-transform group-hover:scale-105">
                  <div className="bg-brand-blue flex h-full w-full items-center justify-center rounded-full text-white shadow-inner">
                    <span className="material-symbols-outlined text-2xl">
                      verified_user
                    </span>
                  </div>
                </div>
                <h3 className="text-brand-navy mb-3 text-xl font-bold">
                  Real-time Detection
                </h3>
                <p className="mb-6 text-sm leading-relaxed text-slate-600">
                  AI-powered monitoring of transactions for suspicious patterns
                  with sub-second scoring and dynamic threshold management.
                </p>
              </div>
              <Link
                href={isAuthenticated ? "/dashboard" : "/login"}
                className="text-brand-blueLight hover:text-brand-blue inline-flex items-center gap-2 text-sm font-bold transition-all group-hover:translate-x-1"
              >
                <span>Explore Engine</span>
                <span className="material-symbols-outlined text-base">
                  arrow_forward
                </span>
              </Link>
            </div>

            {/* Card 2 */}
            <div className="group bg-brand-bgLight flex flex-col justify-between rounded-xl border border-slate-200/90 p-8 shadow-sm transition-all duration-300 hover:bg-white hover:shadow-xl">
              <div>
                <div className="border-brand-gold mb-6 flex h-16 w-16 items-center justify-center rounded-full border-2 p-1 transition-transform group-hover:scale-105">
                  <div className="bg-brand-blue flex h-full w-full items-center justify-center rounded-full text-white shadow-inner">
                    <span className="material-symbols-outlined text-2xl">
                      hub
                    </span>
                  </div>
                </div>
                <h3 className="text-brand-navy mb-3 text-xl font-bold">
                  Graph Analytics
                </h3>
                <p className="mb-6 text-sm leading-relaxed text-slate-600">
                  Visualize entity relationships, shell company hops, and hidden
                  transaction networks across multi-jurisdictional borders.
                </p>
              </div>
              <Link
                href={isAuthenticated ? "/network" : "/login"}
                className="text-brand-blueLight hover:text-brand-blue inline-flex items-center gap-2 text-sm font-bold transition-all group-hover:translate-x-1"
              >
                <span>View Graph Tech</span>
                <span className="material-symbols-outlined text-base">
                  arrow_forward
                </span>
              </Link>
            </div>

            {/* Card 3 */}
            <div className="group bg-brand-bgLight flex flex-col justify-between rounded-xl border border-slate-200/90 p-8 shadow-sm transition-all duration-300 hover:bg-white hover:shadow-xl">
              <div>
                <div className="border-brand-gold mb-6 flex h-16 w-16 items-center justify-center rounded-full border-2 p-1 transition-transform group-hover:scale-105">
                  <div className="bg-brand-blue flex h-full w-full items-center justify-center rounded-full text-white shadow-inner">
                    <span className="material-symbols-outlined text-2xl">
                      insights
                    </span>
                  </div>
                </div>
                <h3 className="text-brand-navy mb-3 text-xl font-bold">
                  Explainable AI
                </h3>
                <p className="mb-6 text-sm leading-relaxed text-slate-600">
                  Transparent model decisions with SHAP explanations and
                  auditor-ready audit trails for regulatory certainty.
                </p>
              </div>
              <Link
                href={isAuthenticated ? "/alerts" : "/login"}
                className="text-brand-blueLight hover:text-brand-blue inline-flex items-center gap-2 text-sm font-bold transition-all group-hover:translate-x-1"
              >
                <span>See XAI Reports</span>
                <span className="material-symbols-outlined text-base">
                  arrow_forward
                </span>
              </Link>
            </div>

            {/* Card 4 */}
            <div className="group bg-brand-bgLight flex flex-col justify-between rounded-xl border border-slate-200/90 p-8 shadow-sm transition-all duration-300 hover:bg-white hover:shadow-xl">
              <div>
                <div className="border-brand-gold mb-6 flex h-16 w-16 items-center justify-center rounded-full border-2 p-1 transition-transform group-hover:scale-105">
                  <div className="bg-brand-blue flex h-full w-full items-center justify-center rounded-full text-white shadow-inner">
                    <span className="material-symbols-outlined text-2xl">
                      schedule
                    </span>
                  </div>
                </div>
                <h3 className="text-brand-navy mb-3 text-xl font-bold">
                  24/7 Monitoring
                </h3>
                <p className="mb-6 text-sm leading-relaxed text-slate-600">
                  Continuous automated surveillance with instant alert
                  generation, prioritization, and seamless workflow routing.
                </p>
              </div>
              <Link
                href={isAuthenticated ? "/transactions" : "/login"}
                className="text-brand-blueLight hover:text-brand-blue inline-flex items-center gap-2 text-sm font-bold transition-all group-hover:translate-x-1"
              >
                <span>Automate Triage</span>
                <span className="material-symbols-outlined text-base">
                  arrow_forward
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4. ABOUT SECTION */}
      <section
        className="relative scroll-mt-20 overflow-hidden bg-[#F0F4F8] py-20 lg:py-28"
        id="about"
      >
        {/* Blue-gray wave divider at top */}
        <div className="pointer-events-none absolute inset-x-0 top-0 w-full overflow-hidden leading-none text-white">
          <svg
            className="relative block h-10 w-full lg:h-14"
            preserveAspectRatio="none"
            viewBox="0 0 1200 120"
          >
            <path
              d="M0,0 C300,70 600,0 900,50 C1050,75 1150,30 1200,10 L1200,0 L0,0 Z"
              fill="#FFFFFF"
            />
          </svg>
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
            {/* Left Side: Narrative and Bullets */}
            <div className="lg:col-span-6">
              <div className="bg-brand-gold text-brand-navy mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold tracking-wider uppercase shadow-sm">
                <span className="material-symbols-outlined text-sm font-semibold">
                  shield
                </span>
                WHO WE ARE
              </div>
              <h2 className="text-brand-navy mb-6 text-3xl leading-tight font-extrabold tracking-tight sm:text-4xl">
                Experience the Power of Compliance
              </h2>
              <p className="mb-8 text-base leading-relaxed text-slate-700">
                AML Sentinel is an institutional-grade intelligence platform
                engineered to eliminate investigative gridlock. By merging graph
                neural networks with deep regulatory topologies, we empower
                tier-1 financial institutions and payment rails to decrease
                false positive alert volumes by up to 70% while elevating SAR
                audit defensibility.
              </p>

              {/* Key Feature Bullets with Golden Shield Checkmarks */}
              <div className="mb-8 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="border-brand-gold bg-brand-goldLight mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border">
                    <span className="material-symbols-outlined text-brand-blue text-base">
                      check
                    </span>
                  </div>
                  <div>
                    <h4 className="text-brand-navy text-sm font-bold">
                      Proven Cycle Time Reduction
                    </h4>
                    <p className="text-sm text-slate-600">
                      Compresses average analyst alert investigation cycle times
                      from several hours to under eight minutes.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="border-brand-gold bg-brand-goldLight mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border">
                    <span className="material-symbols-outlined text-brand-blue text-base">
                      check
                    </span>
                  </div>
                  <div>
                    <h4 className="text-brand-navy text-sm font-bold">
                      Global Regulatory Standards
                    </h4>
                    <p className="text-sm text-slate-600">
                      Full FinCEN, FATF, and FCA regulatory reporting compliance
                      with automated SAR XML generation built-in.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="border-brand-gold bg-brand-goldLight mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border">
                    <span className="material-symbols-outlined text-brand-blue text-base">
                      check
                    </span>
                  </div>
                  <div>
                    <h4 className="text-brand-navy text-sm font-bold">
                      Core Banking Ingestion
                    </h4>
                    <p className="text-sm text-slate-600">
                      Seamless high-throughput enterprise API integration
                      directly into legacy core banking ledgers and Kafka
                      queues.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6">
                <a
                  href="#contact"
                  className="bg-brand-blue hover:bg-brand-blueLight rounded-full px-7 py-3 text-sm font-semibold text-white shadow-sm transition-all"
                >
                  Discover Our Architecture
                </a>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  FCA &amp; FinCEN Benchmarked
                </div>
              </div>
            </div>

            {/* Right Side: Boardroom Collaboration Image with Stat Badge */}
            <div className="relative lg:col-span-6">
              <div className="relative overflow-hidden rounded-2xl border-4 border-white bg-white shadow-2xl">
                <div className="relative h-[400px] w-full sm:h-[460px]">
                  <Image
                    src="/landing/about-meeting.jpg"
                    alt="AML Sentinel Executive Financial Compliance Boardroom"
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Floating Stat Badge */}
                <div className="absolute bottom-6 left-6 flex items-center gap-4 rounded-xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur-md">
                  <div className="bg-brand-gold text-brand-navy flex h-12 w-12 items-center justify-center rounded-full">
                    <span className="material-symbols-outlined text-2xl font-bold">
                      speed
                    </span>
                  </div>
                  <div>
                    <div className="font-tabular text-brand-navy text-2xl font-extrabold tracking-tight">
                      4.2x Faster
                    </div>
                    <div className="text-xs font-medium text-slate-600">
                      Alert Resolution &amp; Investigation Cycle
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SOLUTIONS SECTION */}
      <section
        className="bg-brand-cardBg relative scroll-mt-20 py-20 lg:py-28"
        id="solutions"
      >
        {/* Undulating header wave */}
        <div className="pointer-events-none absolute inset-x-0 top-0 w-full overflow-hidden leading-none text-[#F0F4F8]">
          <svg
            className="relative block h-8 w-full lg:h-12"
            preserveAspectRatio="none"
            viewBox="0 0 1200 120"
          >
            <path
              d="M0,0 C150,90 400,0 700,50 C950,90 1100,20 1200,0 L1200,0 L0,0 Z"
              fill="#F0F4F8"
            />
          </svg>
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
            {/* Left Column: Solutions Detail & Stats */}
            <div className="lg:col-span-7">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-slate-200 px-3.5 py-1.5 text-xs font-bold tracking-widest text-slate-800 uppercase">
                TAILORED DEPLOYMENT
              </div>
              <h2 className="text-brand-navy mb-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Expert AML Solutions
              </h2>
              <p className="mb-8 max-w-2xl text-base leading-relaxed text-slate-600">
                Custom-calibrated heuristic suites designed for Tier 1 Banks,
                FinTech unicorns, and cross-border remittance providers handling
                billions in monthly flow.
              </p>

              {/* 3 Prominent Stat Counters */}
              <div className="mb-8 grid grid-cols-3 gap-4 border-b border-slate-200 pb-8">
                <div>
                  <div className="font-tabular text-brand-navy text-3xl font-extrabold tracking-tight sm:text-4xl">
                    99.4%
                  </div>
                  <div className="mt-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                    Detection Accuracy
                  </div>
                </div>
                <div>
                  <div className="font-tabular text-brand-blueLight text-3xl font-extrabold tracking-tight sm:text-4xl">
                    &lt;0.8s
                  </div>
                  <div className="mt-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                    Latency per Txn
                  </div>
                </div>
                <div>
                  <div className="font-tabular text-brand-navy text-3xl font-extrabold tracking-tight sm:text-4xl">
                    70%
                  </div>
                  <div className="mt-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                    Fewer False Positives
                  </div>
                </div>
              </div>

              {/* Checklist Items */}
              <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-800">
                  <span className="material-symbols-outlined text-lg text-emerald-600">
                    check_circle
                  </span>
                  <span>Transaction Monitoring &amp; Batch Ingestion</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-800">
                  <span className="material-symbols-outlined text-lg text-emerald-600">
                    check_circle
                  </span>
                  <span>Sanctions &amp; PEP Screening Automation</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-800">
                  <span className="material-symbols-outlined text-lg text-emerald-600">
                    check_circle
                  </span>
                  <span>Graph-based Mule Account Rings</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-800">
                  <span className="material-symbols-outlined text-lg text-emerald-600">
                    check_circle
                  </span>
                  <span>Direct Regulatory SAR Generation</span>
                </div>
              </div>

              <Link
                href={isAuthenticated ? "/dashboard" : "/signup"}
                className="bg-brand-blue hover:bg-brand-blueLight inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg active:scale-[0.98]"
              >
                <span>
                  {isAuthenticated ? "Open Dashboard" : "Free Consultation"}
                </span>
                <span className="material-symbols-outlined text-base">
                  arrow_forward
                </span>
              </Link>
            </div>

            {/* Right Column: Prominent Golden Testimonial Card */}
            <div className="lg:col-span-5">
              <div className="bg-brand-gold text-brand-navy relative flex flex-col justify-between rounded-3xl border border-amber-300 p-8 shadow-2xl sm:p-10">
                {/* Top: Rating and Stamp */}
                <div className="mb-8 flex items-center justify-between">
                  <div className="text-brand-navy flex items-center gap-1">
                    <span
                      className="material-symbols-outlined text-xl"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      star
                    </span>
                    <span
                      className="material-symbols-outlined text-xl"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      star
                    </span>
                    <span
                      className="material-symbols-outlined text-xl"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      star
                    </span>
                    <span
                      className="material-symbols-outlined text-xl"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      star
                    </span>
                    <span
                      className="material-symbols-outlined text-xl"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      star
                    </span>
                  </div>
                  <div className="bg-brand-navy/10 text-brand-navy flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold tracking-wider uppercase">
                    <span className="material-symbols-outlined text-sm">
                      verified
                    </span>
                    <span>Verified Client</span>
                  </div>
                </div>

                {/* Quote */}
                <blockquote className="mb-8 text-xl leading-snug font-bold tracking-tight sm:text-2xl">
                  &ldquo;AML Sentinel has completely transformed our SAR filing
                  efficiency. We cut investigation time by 60% while detecting
                  high-risk structuring cycles we previously missed.&rdquo;
                </blockquote>

                {/* Author info */}
                <div className="border-brand-navy/20 flex items-center justify-between border-t pt-6">
                  <div>
                    <div className="text-brand-navy text-base font-extrabold">
                      Sarah Jenkins
                    </div>
                    <div className="text-xs font-medium text-slate-800">
                      Chief Compliance Officer at Apex Financial Global
                    </div>
                  </div>
                  <div className="text-brand-navy flex h-10 w-10 items-center justify-center rounded-full bg-white/40 text-sm font-bold shadow-inner">
                    AFG
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. CTA BANNER SECTION */}
      <section
        className="bg-brand-navy relative scroll-mt-20 overflow-hidden py-20"
        id="demo"
      >
        {/* Golden ambient accent glow */}
        <div className="bg-brand-gold/15 pointer-events-none absolute -top-20 -right-20 h-96 w-96 rounded-full blur-3xl" />
        <div className="bg-brand-blueLight/20 pointer-events-none absolute -bottom-20 -left-20 h-96 w-96 rounded-full blur-3xl" />

        <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
          <div className="text-brand-gold mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-bold tracking-widest uppercase">
            <span className="material-symbols-outlined text-sm">
              rocket_launch
            </span>
            RAPID IMPLEMENTATION
          </div>
          <h2 className="mb-6 text-3xl leading-tight font-extrabold tracking-tight text-white sm:text-5xl">
            Ready to elevate your financial crime defense?
          </h2>
          <p className="mx-auto mb-10 max-w-2xl text-base text-slate-300 sm:text-lg">
            Connect with our principal compliance architects for an interactive
            demonstration configured directly against your transaction taxonomy.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href={isAuthenticated ? "/dashboard" : "/signup"}
              className="bg-brand-gold text-brand-navy hover:bg-brand-goldHover flex items-center gap-2 rounded-full px-9 py-4 text-base font-extrabold tracking-wide shadow-xl transition-all hover:shadow-2xl active:scale-[0.98]"
            >
              <span>
                {isAuthenticated
                  ? "Go to Dashboard"
                  : "Schedule Your Live Demo"}
              </span>
              <span className="material-symbols-outlined font-bold">
                arrow_forward
              </span>
            </Link>
            <a
              href="#contact"
              onClick={(e) => handleNavClick(e, "contact")}
              className="rounded-full border border-white/20 bg-white/10 px-8 py-4 text-base font-semibold text-white transition-all hover:bg-white/20"
            >
              Speak With An Analyst
            </a>
          </div>
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer
        className="scroll-mt-20 border-t border-slate-800 bg-[#0B192C] text-sm text-slate-400"
        id="contact"
      >
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="grid grid-cols-1 gap-10 border-b border-slate-800 pb-12 md:grid-cols-2 lg:grid-cols-12 lg:gap-8">
            {/* Col 1: Brand & Security Badges (4 cols) */}
            <div className="lg:col-span-4">
              <div className="mb-5 flex items-center gap-3">
                <div className="bg-brand-navy relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg border border-slate-700 p-1">
                  <Image
                    src="/landing/logo.jpg"
                    alt="AML Sentinel Brand Logo"
                    width={36}
                    height={36}
                    className="h-full w-full object-contain"
                  />
                </div>
                <span className="text-xl font-bold tracking-tight text-white">
                  AML Sentinel
                </span>
              </div>
              <p className="mb-6 text-xs leading-relaxed text-slate-400 sm:text-sm">
                Institutional AML and fraud intelligence infrastructure
                providing explainable graph machine learning for enterprise
                banks and payment innovators.
              </p>
              {/* Security Badges */}
              <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold text-slate-300">
                <span className="rounded border border-slate-700/80 bg-slate-900 px-2.5 py-1">
                  SOC2 Type II
                </span>
                <span className="rounded border border-slate-700/80 bg-slate-900 px-2.5 py-1">
                  ISO 27001
                </span>
                <span className="rounded border border-slate-700/80 bg-slate-900 px-2.5 py-1">
                  GDPR Compliant
                </span>
              </div>
            </div>

            {/* Col 2: Platform Links (2 cols) */}
            <div className="lg:col-span-2">
              <h5 className="mb-4 text-xs font-bold tracking-wider text-white uppercase">
                Platform
              </h5>
              <ul className="space-y-2.5 text-xs sm:text-sm">
                <li>
                  <Link
                    href="/dashboard"
                    className="transition-colors hover:text-white"
                  >
                    Detection Engine
                  </Link>
                </li>
                <li>
                  <Link
                    href="/network"
                    className="transition-colors hover:text-white"
                  >
                    Graph Explorer
                  </Link>
                </li>
                <li>
                  <Link
                    href="/alerts"
                    className="transition-colors hover:text-white"
                  >
                    Explainable AI
                  </Link>
                </li>
                <li>
                  <Link
                    href="/transactions"
                    className="transition-colors hover:text-white"
                  >
                    Core Integrations
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin"
                    className="transition-colors hover:text-white"
                  >
                    Audit Trails
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Solutions (2 cols) */}
            <div className="lg:col-span-2">
              <h5 className="mb-4 text-xs font-bold tracking-wider text-white uppercase">
                Solutions
              </h5>
              <ul className="space-y-2.5 text-xs sm:text-sm">
                <li>
                  <a
                    href="#solutions"
                    className="transition-colors hover:text-white"
                  >
                    Retail Banking
                  </a>
                </li>
                <li>
                  <a
                    href="#solutions"
                    className="transition-colors hover:text-white"
                  >
                    FinTech &amp; Crypto
                  </a>
                </li>
                <li>
                  <a
                    href="#solutions"
                    className="transition-colors hover:text-white"
                  >
                    Neobanks
                  </a>
                </li>
                <li>
                  <a
                    href="#solutions"
                    className="transition-colors hover:text-white"
                  >
                    Global Payments
                  </a>
                </li>
                <li>
                  <a
                    href="#solutions"
                    className="transition-colors hover:text-white"
                  >
                    Regulatory Compliance
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 4: Newsletter & Contact (4 cols) */}
            <div className="lg:col-span-4">
              <h5 className="mb-4 text-xs font-bold tracking-wider text-white uppercase">
                Stay Informed
              </h5>
              <p className="mb-3 text-xs text-slate-400">
                Subscribe to the AML Sentinel Monthly Regulatory Dispatch.
              </p>

              {subscribed ? (
                <div className="mb-6 rounded-lg border border-emerald-500/40 bg-emerald-950/40 p-3 text-xs font-semibold text-emerald-300">
                  ✓ Thank you! You&apos;ve subscribed to the regulatory
                  dispatch.
                </div>
              ) : (
                <form
                  onSubmit={handleNewsletterSubmit}
                  className="mb-6 flex items-center gap-2"
                >
                  <input
                    className="focus:border-brand-gold w-full rounded-full border border-slate-700 bg-slate-900 px-4 py-2.5 text-xs text-white placeholder-slate-500 transition-colors focus:outline-none"
                    placeholder="analyst@institution.com"
                    required
                    type="email"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                  />
                  <button
                    className="bg-brand-gold text-brand-navy hover:bg-brand-goldHover shrink-0 rounded-full px-4 py-2.5 text-xs font-bold transition-colors"
                    type="submit"
                  >
                    Subscribe
                  </button>
                </form>
              )}

              <div className="space-y-1.5 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-brand-gold text-sm">
                    mail
                  </span>
                  <span>compliance@amlsentinel.com</span>
                </div>
              </div>
            </div>
          </div>

          {/* Copyright Bar */}
          <div className="flex flex-col items-center justify-between gap-4 pt-8 text-xs text-slate-500 sm:flex-row">
            <p>
              © 2025 AML Sentinel Inc. All rights reserved. Enterprise-grade AML
              &amp; Fraud Intelligence.
            </p>
            <div className="flex items-center gap-6">
              <a className="transition-colors hover:text-slate-300" href="#">
                Privacy Policy
              </a>
              <a className="transition-colors hover:text-slate-300" href="#">
                Terms of Service
              </a>
              <a className="transition-colors hover:text-slate-300" href="#">
                Security Disclosure
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
