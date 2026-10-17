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
      "bg-text-primary text-surface dark:bg-surface-hover dark:text-text-primary border-border",
  },
  aml_analyst: {
    label: "AML Analyst",
    badgeClass:
      "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
  data_operator: {
    label: "Data Operator",
    badgeClass:
      "bg-surface-hover text-text-secondary border-border",
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
    <header className="border-border bg-surface/90 sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between border-b px-6 backdrop-blur-md transition-colors">
      {/* Left: Environment Node Indicator */}
      <div className="flex items-center gap-3">
        <div className="border-border inline-flex items-center gap-2 rounded-full border bg-surface px-3 py-1 text-xs shadow-2xs">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-text-secondary font-mono text-[11px]">
            {process.env.NODE_ENV === "production"
              ? "Cluster: Live US-East"
              : "Cluster: Sandboxed Node"}
          </span>
        </div>
      </div>

      {/* Right: Actions & User Info */}
      <div className="flex items-center gap-3 sm:gap-4">
        {user.role !== "administrator" && (
          <button
            type="button"
            onClick={() => setShowAdminModal(true)}
            className="border-border text-text-primary hover:bg-surface-hover rounded-lg border bg-surface px-3 py-1.5 text-xs font-medium shadow-xs transition-colors active:scale-[0.98]"
          >
            Request Admin Access
          </button>
        )}

        <ThemeToggle />

        {/* User Card */}
        <div className="border-border flex items-center gap-3 border-l pl-3 sm:pl-4">
          <div className="hidden flex-col items-end text-right sm:flex">
            <p className="text-text-primary text-xs font-semibold leading-tight">
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
            className="border-border text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors active:scale-[0.98]"
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
