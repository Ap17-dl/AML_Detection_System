"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { RequestAdminModal } from "@/components/layout/RequestAdminModal";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { createClient } from "@/lib/supabase/client";
import type { CurrentUser, Role } from "@/types/auth";

const ROLE_BADGES: Record<Role, { label: string; badgeClass: string }> = {
  administrator: {
    label: "Administrator",
    badgeClass:
      "bg-brand-navy text-brand-gold border-brand-gold/30 dark:bg-brand-gold/10 dark:text-brand-gold dark:border-brand-gold/20",
  },
  aml_analyst: {
    label: "AML Analyst",
    badgeClass:
      "bg-brand-blue/10 text-brand-blue dark:text-blue-300 border-brand-blue/20 dark:border-blue-800/40",
  },
  data_operator: {
    label: "Data Operator",
    badgeClass:
      "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
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
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
  };

  return (
    <header className="border-border bg-surface/95 sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b px-6 backdrop-blur-md transition-colors">
      {/* Left: Environment Node Indicator */}
      <div className="flex items-center gap-3">
        <div className="border-border bg-slate-50/90 dark:bg-slate-900/60 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs shadow-xs">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-text-secondary font-medium">
            {process.env.NODE_ENV === "production"
              ? "Live Production Cluster"
              : "Sandboxed Surveillance Node"}
          </span>
        </div>
      </div>

      {/* Right: Actions & User Info */}
      <div className="flex items-center gap-3 sm:gap-4">
        {user.role !== "administrator" && (
          <button
            type="button"
            onClick={() => setShowAdminModal(true)}
            className="text-xs font-semibold text-brand-blue dark:text-blue-400 border border-brand-blue/30 bg-brand-blue/5 hover:bg-brand-blue hover:text-white rounded-lg px-3 py-1.5 shadow-xs transition-all duration-150 active:scale-[0.98]"
          >
            Request Admin Access
          </button>
        )}

        <ThemeToggle />

        {/* User Card */}
        <div className="border-border flex items-center gap-3 border-l pl-3 sm:pl-4">
          <div className="hidden sm:flex flex-col items-end text-right">
            <p className="text-sm font-semibold text-text-primary leading-tight">
              {user.full_name ?? user.email}
            </p>
            <span
              className={`mt-0.5 inline-block rounded-full border px-2 py-0.2 text-[10px] font-semibold tracking-wide ${roleMeta.badgeClass}`}
            >
              {roleMeta.label}
            </span>
          </div>

          <div
            title={`${user.full_name ?? user.email} (${roleMeta.label})`}
            className="bg-brand-navy text-brand-gold flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold shadow-xs ring-2 ring-brand-gold/20"
          >
            {userInitials}
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="text-xs font-medium border border-border text-text-secondary hover:text-text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg px-2.5 py-1.5 transition-all duration-150 active:scale-[0.98]"
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
