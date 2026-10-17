"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, SVGProps } from "react";

import {
  AdminIcon,
  BellIcon,
  DashboardIcon,
  NetworkIcon,
  ReportsIcon,
  TransactionIcon,
  UsersIcon,
} from "@/components/ui/icons";
import { SentinelMark } from "@/components/ui/SentinelLogo";
import { navItemsForRole } from "@/lib/nav-items";
import type { Role } from "@/types/auth";

const NAV_ICONS: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
  Dashboard: DashboardIcon,
  Transactions: TransactionIcon,
  Alerts: BellIcon,
  Customers: UsersIcon,
  "Network Explorer": NetworkIcon,
  Reports: ReportsIcon,
  Administration: AdminIcon,
};

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = navItemsForRole(role);

  return (
    <aside
      aria-label="Primary"
      className="border-border bg-surface flex w-64 shrink-0 flex-col justify-between border-r p-4 transition-colors"
    >
      <div className="flex flex-col gap-6">
        {/* Brand Header */}
        <Link
          href="/dashboard"
          className="group flex items-center gap-3 px-2 py-1 focus:outline-none"
        >
          <div className="border-border bg-surface flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-text-primary shadow-xs transition-colors group-hover:border-text-secondary/40">
            <SentinelMark size={22} />
          </div>
          <div className="flex flex-col">
            <span className="text-text-primary text-sm font-bold tracking-tight leading-tight transition-colors">
              AML Sentinel
            </span>
            <span className="text-text-secondary text-[10px] font-semibold tracking-wider uppercase opacity-70">
              Enterprise v2.4
            </span>
          </div>
        </Link>

        {/* Navigation Section */}
        <nav className="flex flex-col gap-1">
          <span className="text-text-secondary px-3 pb-1 text-[11px] font-semibold tracking-wider uppercase opacity-60">
            Platform
          </span>
          {items.map((item) => {
            const IconComponent = NAV_ICONS[item.label];
            const isActive = pathname === item.href;

            return item.href ? (
              <Link
                key={item.label}
                href={item.href}
                className={`group relative flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  isActive
                    ? "bg-text-primary text-surface font-semibold shadow-xs dark:bg-surface-hover dark:text-text-primary dark:ring-1 dark:ring-border"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
                }`}
              >
                {isActive && (
                  <span className="bg-brand-blue absolute inset-y-1.5 left-0 w-0.5 rounded-r-full" />
                )}
                {IconComponent ? (
                  <IconComponent
                    className={`h-4 w-4 shrink-0 transition-colors ${
                      isActive
                        ? "text-surface dark:text-text-primary"
                        : "text-text-secondary group-hover:text-text-primary"
                    }`}
                  />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-text-secondary" />
                )}
                <span>{item.label}</span>
              </Link>
            ) : (
              <span
                key={item.label}
                title="Coming in a later sprint"
                className="text-text-secondary flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2 text-xs opacity-40"
              >
                {IconComponent ? (
                  <IconComponent className="h-4 w-4 shrink-0 text-text-secondary" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-text-secondary" />
                )}
                <span>{item.label}</span>
              </span>
            );
          })}
        </nav>
      </div>

      {/* System Status Footer */}
      <div className="border-border rounded-lg border bg-surface-hover/50 p-3 transition-colors">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-text-primary text-[11px] font-medium tracking-tight">
            Surveillance Active
          </span>
        </div>
        <p className="text-text-secondary mt-1 text-[10px] font-mono">
          Graph ML • ~18ms latency
        </p>
      </div>
    </aside>
  );
}
