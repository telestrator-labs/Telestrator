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
import { setValueEntries } from "./valueKeys";
import type { CellOutput, RuntimeHost } from "../runtime";

// The reactive dependency graph, derived from every cell's latest output: which
// cell writes each `$` value and which cells read it. This is the data "the
// trace" draws — see TraceOverlay / TracePanel.
export interface TraceGraph {
  // value key → its single writer cell and the cells that read it (writer excluded)
  values: Map<string, { writer: string; readers: string[] }>;
  // the value keys a cell touches (writes or reads) — drives hover-a-cell tracing
  valuesTouching(cellId: string): string[];
  // the cells (writer + readers) participating in a set of value keys
  cellsFor(keys: Iterable<string>): Set<string>;
}

const EMPTY_GRAPH: TraceGraph = {
  values: new Map(),
  valuesTouching: () => [],
  cellsFor: () => new Set(),
};

// Build the graph from the current outputs. Last writer of a key wins; a cell
// that reads a key it also writes is not counted as its own reader.
function computeGraph(outputs: Map<string, CellOutput>): TraceGraph {
  const writers = new Map<string, string>();
  const readersByKey = new Map<string, Set<string>>();
  for (const out of outputs.values()) {
    for (const k of Object.keys(out.values)) writers.set(k, out.id);
    for (const k of out.reads) {
      let set = readersByKey.get(k);
      if (!set) readersByKey.set(k, (set = new Set()));
      set.add(out.id);
    }
  }

  const values = new Map<string, { writer: string; readers: string[] }>();
  for (const [key, writer] of writers) {
    const readers = [...(readersByKey.get(key) ?? [])].filter(
      (r) => r !== writer,
    );
    values.set(key, { writer, readers });
  }

  return {
    values,
    valuesTouching(cellId) {
      const keys: string[] = [];
      for (const [key, { writer, readers }] of values) {
        if (writer === cellId || readers.includes(cellId)) keys.push(key);
      }
      return keys;
    },
    cellsFor(keys) {
      const cells = new Set<string>();
      for (const key of keys) {
        const v = values.get(key);
        if (!v) continue;
        cells.add(v.writer);
        for (const r of v.readers) cells.add(r);
      }
      return cells;
    },
  };
}

interface RuntimeContextValue {
  update(id: string, code: string): void;
  remove(id: string): void;
  restart(): void;
  subscribe(id: string, cb: () => void): () => void;
  getOutput(id: string): CellOutput | undefined;
  // Mount/unmount a cell's live DOM view into a host output container.
  mountView(id: string, container: Element): void;
  unmountView(container: Element): void;
  // Trace graph subscription (recomputed whenever any cell's output changes).
  subscribeGraph(cb: () => void): () => void;
  getGraph(): TraceGraph;
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
  // Trace-graph subscribers + a memoized snapshot invalidated on every output
  // change (null = needs recompute), so useSyncExternalStore sees a stable
  // reference between changes.
  const graphSubs = useRef(new Set<() => void>());
  const graphRef = useRef<TraceGraph | null>(null);

  const invalidateGraph = () => {
    // Recompute eagerly so the graph *and* the value-key registry (which the
    // detached `$`-autocomplete popup reads) stay in sync on every output.
    const graph = computeGraph(outputs.current);
    graphRef.current = graph;
    setValueEntries(
      [...graph.values].map(([key, v]) => ({
        key,
        value: outputs.current.get(v.writer)?.values[key],
      })),
    );
    graphSubs.current.forEach((cb) => cb());
  };

  const getHost = (): RuntimeHost => {
    if (!hostRef.current) {
      const host = createIframeHost();
      host.onOutput((output) => {
        outputs.current.set(output.id, output);
        subs.current.get(output.id)?.forEach((cb) => cb());
        invalidateGraph();
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
      graphRef.current = null;
      setValueEntries([]); // don't leak this notebook's keys into the next
    };
  }, []);

  const value = useMemo<RuntimeContextValue>(
    () => ({
      update: (id, code) => getHost().update(id, code),
      remove: (id) => {
        getHost().remove(id);
        // Drop the stale output so the cell view clears and the graph forgets
        // this cell's edges (the engine does not emit on removal).
        if (outputs.current.delete(id)) {
          subs.current.get(id)?.forEach((cb) => cb());
          invalidateGraph();
        }
      },
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
      mountView: (id, container) => getHost().mountView(id, container),
      unmountView: (container) => getHost().unmountView(container),
      subscribeGraph: (cb) => {
        graphSubs.current.add(cb);
        return () => graphSubs.current.delete(cb);
      },
      getGraph: () => {
        if (!graphRef.current) graphRef.current = computeGraph(outputs.current);
        return graphRef.current;
      },
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

// Subscribe to the live reactive dependency graph. Returns EMPTY_GRAPH outside a
// provider so trace UI can render harmlessly if mounted early.
export function useTraceGraph(): TraceGraph {
  const ctx = useContext(RuntimeContext);
  return useSyncExternalStore(
    (cb) => ctx?.subscribeGraph(cb) ?? (() => {}),
    () => ctx?.getGraph() ?? EMPTY_GRAPH,
  );
}

// The current value of a `$` key, for an inline prose chip. Resolves the writing
// cell via the graph, then reads that cell's latest output — so it re-renders
// exactly when the writer re-emits. `undefined` until something writes the key.
export function useValue(key: string): unknown {
  const graph = useTraceGraph();
  const writerId = graph.values.get(key)?.writer;
  const output = useCellOutput(writerId ?? "");
  return writerId ? output?.values[key] : undefined;
}

// Whether a cell is *live*: it reads or writes at least one valid `$` value (a
// value with a writer in the graph). Drives the cell's LIVE badge — an empty or
// non-reactive cell isn't "live" just because it can run.
export function useIsLive(id: string | null): boolean {
  const graph = useTraceGraph();
  return !!id && graph.valuesTouching(id).length > 0;
}

// Whether the document is live: any cell has written a valid `$` value. Drives
// the header's Live indicator.
export function useDocumentLive(): boolean {
  const graph = useTraceGraph();
  return graph.values.size > 0;
}
