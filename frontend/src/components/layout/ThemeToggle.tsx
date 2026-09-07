"use client";

import { ContrastIcon } from "@/components/ui/icons";
import { applyThemePreference, getEffectiveTheme } from "@/lib/theme";

export function ThemeToggle() {
  function toggle() {
    const next = getEffectiveTheme() === "dark" ? "light" : "dark";
    applyThemePreference(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle color theme"
      className="border-border text-text-primary hover:bg-bg focus-visible:ring-accent flex items-center gap-1.5 rounded-md border px-3 py-1.5 transition-all duration-150 ease-out hover:-translate-y-px hover:shadow-sm focus:outline-none focus-visible:ring-2"
    >
      <ContrastIcon className="size-4" />
      <span className="text-body">Theme</span>
    </button>
  );
}
