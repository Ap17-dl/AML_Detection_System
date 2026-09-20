"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { RequestAdminModal } from "@/components/layout/RequestAdminModal";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { createClient } from "@/lib/supabase/client";
import type { CurrentUser, Role } from "@/types/auth";

const ROLE_LABELS: Record<Role, string> = {
  administrator: "Administrator",
  aml_analyst: "AML Analyst",
  data_operator: "Data Operator",
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

  return (
    <header className="border-border bg-surface flex h-16 shrink-0 items-center justify-between border-b px-6">
      <span className="text-label border-border text-text-secondary rounded-full border px-2 py-1">
        {process.env.NODE_ENV === "production" ? "Production" : "Development"}
      </span>
      <div className="flex items-center gap-4">
        {user.role !== "administrator" && (
          <button
            type="button"
            onClick={() => setShowAdminModal(true)}
            className="text-caption font-medium text-accent hover:text-white border border-accent/40 bg-accent/10 hover:bg-accent rounded-md px-3 py-1.5 transition-all shadow-sm"
          >
            Request Admin Access
          </button>
        )}
        <ThemeToggle />
        <div className="text-body text-right">
          <p className="text-text-primary">{user.full_name ?? user.email}</p>
          <p className="text-caption text-text-secondary">
            {ROLE_LABELS[user.role]}
          </p>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="text-body border-border text-text-primary hover:bg-bg focus-visible:ring-accent rounded-md border px-3 py-1.5 transition-all duration-150 ease-out hover:-translate-y-px hover:shadow-sm focus:outline-none focus-visible:ring-2"
        >
          Sign out
        </button>
      </div>

      <RequestAdminModal
        user={user}
        isOpen={showAdminModal}
        onClose={() => setShowAdminModal(false)}
      />
    </header>
  );
}
