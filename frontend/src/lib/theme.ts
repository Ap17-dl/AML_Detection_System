export type ThemePreference = "light" | "dark";

const STORAGE_KEY = "aml-theme-preference";

export function getStoredThemePreference(): ThemePreference | null {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "light" || stored === "dark" ? stored : null;
}

/** The theme actually in effect right now: the stored override, or the OS preference. */
export function getEffectiveTheme(): ThemePreference {
  const stored = getStoredThemePreference();
  if (stored) return stored;
  if (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }
  return "light";
}

/** Sets the explicit override; matches the `[data-theme]` selectors in globals.css. */
export function applyThemePreference(preference: ThemePreference): void {
  document.documentElement.setAttribute("data-theme", preference);
  window.localStorage.setItem(STORAGE_KEY, preference);
}
