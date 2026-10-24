"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { RequestAdminModal } from "@/components/layout/RequestAdminModal";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { createClient } from "@/lib/supabase/client";
import type { CurrentUser, Role } from "@/types/auth";

const ROLE_BADGES: Record<Role, { label: string; badgeClass: string }> = {
  administrator: {
    label: "Chief Compliance Officer",
    badgeClass:
      "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-border font-bold",
  },
  aml_analyst: {
    label: "AML Analyst",
    badgeClass:
      "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20 font-bold",
  },
  data_operator: {
    label: "Settlement Operator",
    badgeClass:
      "bg-surface-hover text-text-secondary border-border font-medium",
  },
};

export function Topbar({ user }: { user: CurrentUser }) {
  const router = useRouter();
  const [showAdminModal, setShowAdminModal] = useState(false);

  async function handleSignOut() {
    document.cookie = "aml_dev_token=; path=/; max-age=0";
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // Supabase remote unreachable
    }
    router.push("/login");
    router.refresh();
  }

  const userInitials = (user.full_name || user.email || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const roleMeta = ROLE_BADGES[user.role] || {
    label: user.role,
    badgeClass: "bg-surface-hover text-text-secondary border-border",
  };

  return (
    <header className="border-border bg-surface/95 sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between border-b px-6 backdrop-blur-md transition-colors">
      {/* Left: Environment & Organization Indicator */}
      <div className="flex items-center gap-3">
        <div className="border-border bg-surface inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs shadow-2xs">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-text-primary flex items-center gap-1.5 text-[12px] font-semibold">
            <svg
              className="text-text-secondary h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            <span>{user.organization_name || "Apex Global Bank"}</span>
          </span>
          <span className="rounded border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-700 uppercase dark:text-emerald-400">
            {user.organization_status || "active"}
          </span>
        </div>
      </div>

      {/* Right: Actions & User Info */}
      <div className="flex items-center gap-3 sm:gap-4">
        {user.role !== "administrator" && (
          <button
            type="button"
            onClick={() => setShowAdminModal(true)}
            className="border-border text-text-primary hover:bg-surface-hover bg-surface rounded-md border px-3 py-1.5 text-xs font-semibold shadow-xs transition-colors active:scale-[0.98]"
          >
            Request Elevated Clearance
          </button>
        )}

        <ThemeToggle />

        {/* User Card */}
        <div className="border-border flex items-center gap-3 border-l pl-3 sm:pl-4">
          <div className="hidden flex-col items-end text-right sm:flex">
            <p className="text-text-primary text-xs leading-tight font-bold">
              {user.full_name ?? user.email}
            </p>
            <span
              className={`mt-0.5 inline-block rounded-full border px-2 py-0.5 text-[9px] font-semibold tracking-wider uppercase ${roleMeta.badgeClass}`}
            >
              {roleMeta.label}
            </span>
          </div>

          <div
            title={`${user.full_name ?? user.email} (${roleMeta.label})`}
            className="border-border bg-surface-hover text-text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold shadow-2xs"
          >
            {userInitials}
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="border-border text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded-md border px-2.5 py-1.5 text-xs font-semibold transition-colors active:scale-[0.98]"
          >
            Sign out
          </button>
        </div>
      </div>

      <RequestAdminModal
        user={user}
        isOpen={showAdminModal}
        onClose={() => setShowAdminModal(false)}
      />
    </header>
  );
}
