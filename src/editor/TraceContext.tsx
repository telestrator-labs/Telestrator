import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useTraceGraph } from "./RuntimeProvider";
import { useTraceSettings } from "./traceSettings";
import { cx } from "../ui/cx";

// What the trace is currently scoped to. A transient hover (a cell or a single
// `$` value) narrows the drawing to just that node's edges; with nothing
// hovered, a *pinned* trace shows the whole graph and an unpinned one shows
// nothing. Mirrors the prototype's hoverRate / enterSim / clearTrace flow.
type Scope =
  { kind: "value"; key: string } | { kind: "cell"; id: string } | null;

export interface TraceState {
  pinned: boolean;
  // value keys whose connectors should be drawn right now
  activeValues: Set<string>;
  // cells that participate in the active values (get the lime "active" ring;
  // when any trace is active, the rest dim)
  activeCells: Set<string>;
  anyActive: boolean;
  hoverValue(key: string): void;
  hoverCell(id: string): void;
  clearHover(): void;
}

const TraceContext = createContext<TraceState | null>(null);

// Provides the derived trace state to the overlay, cells, and panel. `pinned`
// is lifted to the app (the top-bar Trace toggle); hover scope lives here.
export function TraceProvider({
  pinned,
  children,
}: {
  pinned: boolean;
  children: ReactNode;
}) {
  const graph = useTraceGraph();
  const { hoverEnabled } = useTraceSettings();
  const [scope, setScope] = useState<Scope>(null);

  const state = useMemo<TraceState>(() => {
    // Only values that actually draw an edge (a writer *and* ≥1 reader) count as
    // active — so a cell with no `$` connection never lights up on hover, and no
    // cell is highlighted without a connector to show for it.
    const drawable = (keys: Iterable<string>) =>
      [...keys].filter((k) => (graph.values.get(k)?.readers.length ?? 0) > 0);

    let activeValues: Set<string>;
    if (scope?.kind === "value") {
      activeValues = new Set(drawable([scope.key]));
    } else if (scope?.kind === "cell") {
      activeValues = new Set(drawable(graph.valuesTouching(scope.id)));
    } else if (pinned) {
      activeValues = new Set(drawable(graph.values.keys()));
    } else {
      activeValues = new Set();
    }

    const activeCells = graph.cellsFor(activeValues);

    return {
      pinned,
      activeValues,
      activeCells,
      anyActive: activeValues.size > 0 || activeCells.size > 0,
      // Hover-scoping is opt-out via the sidebar setting so the drawing doesn't
      // get in the way while authoring; the top-bar pin is unaffected.
      hoverValue: (key) => hoverEnabled && setScope({ kind: "value", key }),
      hoverCell: (id) => hoverEnabled && setScope({ kind: "cell", id }),
      clearHover: () => setScope(null),
    };
  }, [graph, scope, pinned, hoverEnabled]);

  return (
    <TraceContext.Provider value={state}>{children}</TraceContext.Provider>
  );
}

// Trace state for cells/overlay/panel. Returns an inert default outside a
// provider so components can be used without a trace context.
export function useTrace(): TraceState {
  return useContext(TraceContext) ?? INERT;
}

// A one-shot flag that flips true for ~500ms after `signal` changes — the
// reactive pulse. `enabled` gates it so cells only pulse while participating in
// a trace (avoids every cell flashing on unrelated edits).
function usePulse(signal: unknown, enabled: boolean): boolean {
  const [pulsing, setPulsing] = useState(false);
  const prev = useRef(signal);
  useEffect(() => {
    if (prev.current === signal) return;
    prev.current = signal;
    if (!enabled) return;
    setPulsing(true);
    const t = setTimeout(() => setPulsing(false), 500);
    return () => clearTimeout(t);
  }, [signal, enabled]);
  return pulsing;
}

// The trace affordances a cell NodeView needs: a className carrying the
// active/dim/pulse states and hover handlers that scope the trace to this cell.
// `signal` is the cell's latest output (identity changes each re-run → pulse).
export function useCellTrace(id: string | null, signal?: unknown) {
  const trace = useTrace();
  const active = !!id && trace.activeCells.has(id);
  const dim = trace.anyActive && !active;
  const pulsing = usePulse(signal, active || trace.pinned);

  const className = cx(
    "trace-cell",
    active && "trace-cell--active",
    dim && "trace-cell--dim",
    pulsing && "animate-cell-pulse",
  );
  const hoverProps = id
    ? {
        onMouseEnter: () => trace.hoverCell(id),
        onMouseLeave: () => trace.clearHover(),
      }
    : {};
  return { className, hoverProps };
}

const noop = () => {};
const INERT: TraceState = {
  pinned: false,
  activeValues: new Set(),
  activeCells: new Set(),
  anyActive: false,
  hoverValue: noop,
  hoverCell: noop,
  clearHover: noop,
};
