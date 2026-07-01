import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  applyTheme,
  DARK_QUERY,
  readStoredTheme,
  storeTheme,
  THEME_KEY,
  type Theme,
} from "./theme";

type ThemeContextValue = {
  // The chosen preference (light | dark | system).
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

// Owns the theme preference: applies it to <html>, persists it, and keeps it in
// sync with the two things that can change it out from under a direct toggle —
// the OS preference (while following "system") and other tabs (storage events).
// The pre-paint script in index.html sets the initial class to avoid a flash;
// this re-applies idempotently on mount.
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(readStoredTheme);

  // Apply + persist on every change (including the initial value).
  useEffect(() => {
    applyTheme(theme);
    storeTheme(theme);
  }, [theme]);

  // While following the system, react to OS light/dark changes live.
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia(DARK_QUERY);
    const onChange = () => applyTheme("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  // Mirror the preference across tabs: if another tab changes it, adopt it here.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === null || e.key === THEME_KEY) {
        setTheme(readStoredTheme());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
