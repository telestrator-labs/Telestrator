import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { createIframeHost } from "../sandbox/iframeHost";
import type { CellOutput, RuntimeHost } from "../runtime";

interface RuntimeContextValue {
  update(id: string, code: string): void;
  remove(id: string): void;
  restart(): void;
  subscribe(id: string, cb: () => void): () => void;
  getOutput(id: string): CellOutput | undefined;
}

const RuntimeContext = createContext<RuntimeContextValue | null>(null);

// Owns the single notebook RuntimeHost (the sandbox iframe) and fans cell
// outputs out to subscribing cell views. Created lazily in render so the host
// exists before any child cell's mount effect runs (React fires child effects
// before the parent's), and disposed on unmount.
export function RuntimeProvider({ children }: { children: ReactNode }) {
  const hostRef = useRef<RuntimeHost | null>(null);
  const outputs = useRef(new Map<string, CellOutput>());
  const subs = useRef(new Map<string, Set<() => void>>());

  const getHost = (): RuntimeHost => {
    if (!hostRef.current) {
      const host = createIframeHost();
      host.onOutput((output) => {
        outputs.current.set(output.id, output);
        subs.current.get(output.id)?.forEach((cb) => cb());
      });
      hostRef.current = host;
    }
    return hostRef.current;
  };
  getHost(); // ensure created during render

  useEffect(() => {
    return () => {
      hostRef.current?.dispose();
      hostRef.current = null;
      outputs.current.clear();
    };
  }, []);

  const value = useMemo<RuntimeContextValue>(
    () => ({
      update: (id, code) => getHost().update(id, code),
      remove: (id) => getHost().remove(id),
      restart: () => getHost().restart(),
      subscribe: (id, cb) => {
        let set = subs.current.get(id);
        if (!set) {
          set = new Set();
          subs.current.set(id, set);
        }
        set.add(cb);
        return () => set!.delete(cb);
      },
      getOutput: (id) => outputs.current.get(id),
    }),
    [],
  );

  return (
    <RuntimeContext.Provider value={value}>{children}</RuntimeContext.Provider>
  );
}

export function useRuntime(): RuntimeContextValue {
  const ctx = useContext(RuntimeContext);
  if (!ctx) throw new Error("useRuntime must be used within a RuntimeProvider");
  return ctx;
}

// Subscribe a cell view to its latest output.
export function useCellOutput(id: string): CellOutput | undefined {
  const rt = useRuntime();
  return useSyncExternalStore(
    (cb) => rt.subscribe(id, cb),
    () => rt.getOutput(id),
  );
}
