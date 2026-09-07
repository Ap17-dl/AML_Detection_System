"use client";

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
      className="text-body border-border text-text-primary hover:bg-bg rounded-md border px-3 py-1.5"
    >
      🌓 Theme
    </button>
  );
}
