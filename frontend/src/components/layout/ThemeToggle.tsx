"use client";

import { ContrastIcon } from "@/components/ui/icons";
import { applyThemePreference, getEffectiveTheme } from "@/lib/theme";

export function ThemeToggle({ className = "" }: { className?: string }) {
  function toggle() {
    const next = getEffectiveTheme() === "dark" ? "light" : "dark";
    applyThemePreference(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle color theme"
      className={`border-border bg-surface text-text-secondary hover:text-text-primary hover:bg-surface-hover flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium shadow-2xs transition-colors active:scale-[0.98] ${className}`}
    >
      <ContrastIcon className="h-3.5 w-3.5" />
      <span>Theme</span>
    </button>
  );
}
