"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { navItemsForRole } from "@/lib/nav-items";
import type { Role } from "@/types/auth";

const NAV_ICONS: Record<string, string> = {
  Dashboard: "space_dashboard",
  Transactions: "receipt_long",
  Alerts: "notifications_active",
  Customers: "group",
  "Network Explorer": "hub",
  Reports: "summarize",
  Administration: "admin_panel_settings",
};

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = navItemsForRole(role);

  return (
    <aside
      aria-label="Primary"
      className="border-border bg-surface flex w-64 shrink-0 flex-col justify-between border-r p-4 transition-all"
    >
      <div className="flex flex-col gap-6">
        {/* Brand Header */}
        <Link
          href="/dashboard"
          className="group flex items-center gap-3 px-2 py-1 focus:outline-none"
        >
          <div className="bg-brand-navy relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg p-1 shadow-sm ring-1 ring-white/10">
            <Image
              src="/landing/logo.jpg"
              alt="AML Sentinel Logo"
              width={36}
              height={36}
              className="h-full w-full object-contain"
              priority
            />
          </div>
          <div className="flex flex-col">
            <span className="text-brand-navy dark:text-white group-hover:text-brand-blueLight text-base font-extrabold tracking-tight transition-colors">
              AML Sentinel
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400">
              Enterprise v2.4
            </span>
          </div>
        </Link>

        {/* Navigation Section */}
        <nav className="flex flex-col gap-1">
          <span className="text-caption text-text-secondary px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider">
            Navigation
          </span>
          {items.map((item) => {
            const icon = NAV_ICONS[item.label] || "circle";
            const isActive = pathname === item.href;

            return item.href ? (
              <Link
                key={item.label}
                href={item.href}
                className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-brand-blue ${
                  isActive
                    ? "bg-brand-navy text-white shadow-sm dark:bg-brand-blue/20 dark:text-brand-blueLight"
                    : "text-text-secondary hover:bg-slate-100 hover:text-text-primary dark:hover:bg-slate-800/60"
                }`}
              >
                {isActive && (
                  <span className="bg-brand-gold absolute inset-y-1.5 left-0 w-1 rounded-r-full" />
                )}
                <span
                  className={`material-symbols-outlined text-[20px] transition-colors ${
                    isActive
                      ? "text-brand-gold"
                      : "text-slate-400 group-hover:text-text-primary"
                  }`}
                  aria-hidden="true"
                >
                  {icon}
                </span>
                <span>{item.label}</span>
              </Link>
            ) : (
              <span
                key={item.label}
                title="Coming in a later sprint"
                className="text-text-secondary flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-sm opacity-50"
              >
                <span
                  className="material-symbols-outlined text-[20px] text-slate-400"
                  aria-hidden="true"
                >
                  {icon}
                </span>
                <span>{item.label}</span>
              </span>
            );
          })}
        </nav>
      </div>

      {/* System Status Footer */}
      <div className="border-border bg-slate-50/70 dark:bg-slate-900/50 mt-4 rounded-xl border p-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-[11px] font-medium text-text-primary">
            Surveillance Engine
          </span>
        </div>
        <p className="mt-1 text-[10px] text-text-secondary">
          Live ML Scoring • Latency ~18ms
        </p>
      </div>
    </aside>
  );
}
