// Theme preference model, shared by the React provider and the pre-paint inline
// script in index.html (which can't import this, so it inlines the same logic —
// keep them in sync). Three settings: an explicit "light"/"dark", or "system"
// which follows the OS and reacts to changes live.
export type Theme = "light" | "dark" | "system";

export const THEME_KEY = "telestrator:theme";
export const DARK_QUERY = "(prefers-color-scheme: dark)";

export function readStoredTheme(): Theme {
  try {
    const v = localStorage.getItem(THEME_KEY);
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {
    // localStorage can throw (privacy mode / disabled) — fall through.
  }
  return "system";
}

export function storeTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // best-effort persistence
  }
}

export function systemPrefersDark(): boolean {
  return window.matchMedia(DARK_QUERY).matches;
}

// Whether the `.dark` class should be applied for a given preference.
export function resolveDark(theme: Theme): boolean {
  return theme === "dark" || (theme === "system" && systemPrefersDark());
}

// Apply the preference to the document root — the single side effect that drives
// every token flip (see the Radix dark imports in index.css).
export function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle("dark", resolveDark(theme));
}
