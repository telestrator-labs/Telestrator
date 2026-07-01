import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

// Author-facing trace preferences. Currently one: whether hovering a cell or a
// `$` value draws its provenance. Some authors find the on-hover reveal helpful;
// others find it draws over the page while they're writing — so it's a toggle
// (the top-bar Trace *pin* is unaffected). Persisted like the theme preference.
const KEY = "telestrator.trace.hoverEnabled";

interface TraceSettings {
  hoverEnabled: boolean;
  setHoverEnabled: (v: boolean) => void;
}

const TraceSettingsContext = createContext<TraceSettings | null>(null);

function readStored(): boolean {
  try {
    return localStorage.getItem(KEY) !== "off"; // default on
  } catch {
    return true;
  }
}

// Lives above both the sidebar (where the toggle is) and the editor (where the
// trace draws), so it wraps the whole app.
export function TraceSettingsProvider({ children }: { children: ReactNode }) {
  const [hoverEnabled, setHoverEnabled] = useState(readStored);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, hoverEnabled ? "on" : "off");
    } catch {
      /* ignore persistence failures (private mode, etc.) */
    }
  }, [hoverEnabled]);

  // Adopt the preference if another tab changes it.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === null || e.key === KEY) setHoverEnabled(readStored());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <TraceSettingsContext.Provider value={{ hoverEnabled, setHoverEnabled }}>
      {children}
    </TraceSettingsContext.Provider>
  );
}

export function useTraceSettings(): TraceSettings {
  return (
    useContext(TraceSettingsContext) ?? {
      hoverEnabled: true,
      setHoverEnabled: () => {},
    }
  );
}
