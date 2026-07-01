import {
  effect,
  effectScope,
  markRaw,
  onEffectCleanup,
  type EffectScope,
  type ReactiveEffectRunner,
} from "@vue/reactivity";
import { clearContext, createContext, snapshot } from "./context";
import type {
  CellApi,
  CellBody,
  CellOutput,
  Context,
  LogEntry,
  LogLevel,
  ReactiveEngine,
} from "./types";

// Re-runs are batched: a dependency change schedules the cell, and the queue is
// drained on a microtask so a burst of writes causes one re-run per dependent
// (avoids sync glitch storms / diamond double-runs).
//
// Loop guard: a cell that reads and writes the same `$` key would re-trigger
// itself forever. We cap re-runs of a single cell within one flush; past the cap
// the cell is reported as errored instead of hanging the tab.
const MAX_RUNS_PER_FLUSH = 100;

interface CellRecord {
  id: string;
  body: CellBody;
  scope: EffectScope;
  runner: ReactiveEffectRunner;
  writes: Set<string>;
  reads: Set<string>;
  logs: LogEntry[];
  error?: string;
  // The cell's main-export value from its last run (a DOM node → a mountable
  // view). Kept live here (never serialized); the host reads it via getValue.
  value: unknown;
}

// Duck-type a DOM node without referencing `Node` (the engine also runs headless
// in tests). A node → the cell has a mountable view.
function isDomNode(v: unknown): boolean {
  return (
    !!v &&
    typeof v === "object" &&
    typeof (v as { nodeType?: unknown }).nodeType === "number"
  );
}

export function createEngine(initial: Context = {}): ReactiveEngine {
  const $ = createContext(initial);
  const cells = new Map<string, CellRecord>();
  const outputs = new Map<string, CellOutput>();
  const listeners = new Set<(o: CellOutput) => void>();

  // Batching state.
  const pending = new Set<CellRecord>();
  let flushing = false;

  const emit = (cell: CellRecord) => {
    const output: CellOutput = {
      id: cell.id,
      values: snapshot($, cell.writes),
      reads: [...cell.reads],
      logs: cell.logs,
      error: cell.error,
      view: isDomNode(cell.value) || undefined,
    };
    outputs.set(cell.id, output);
    for (const cb of listeners) cb(output);
  };

  const schedule = (cell: CellRecord) => {
    pending.add(cell);
    if (!flushing) {
      flushing = true;
      queueMicrotask(flush);
    }
  };

  const flush = () => {
    const runCounts = new Map<CellRecord, number>();
    while (pending.size > 0) {
      const batch = [...pending];
      pending.clear();
      for (const cell of batch) {
        if (!cells.has(cell.id)) continue; // removed mid-flush
        const n = (runCounts.get(cell) ?? 0) + 1;
        runCounts.set(cell, n);
        if (n > MAX_RUNS_PER_FLUSH) {
          cell.error = `Reactive loop detected: "${cell.id}" re-ran too many times (does it read and write the same $ value?)`;
          emit(cell);
          continue; // stop running it this flush
        }
        cell.runner();
      }
    }
    flushing = false;
  };

  // Records the `$` keys a cell reads and writes (for the per-cell output and
  // the dependency trace). The `get` trap still returns through the reactive `$`
  // (`Reflect.get`), so Vue's own dependency tracking — the thing that actually
  // re-runs dependents — is untouched; we just additionally note the key. Only
  // top-level `$.key` access is recorded (nested reads go through Vue's inner
  // proxies, not this one), which is exactly the `$` graph we want.
  const makeRecorder = (writes: Set<string>, reads: Set<string>): Context =>
    new Proxy($, {
      get: (_t, key) => {
        if (typeof key === "string") reads.add(key);
        return Reflect.get($, key);
      },
      set: (_t, key, value) => {
        if (typeof key === "string") writes.add(key);
        // Never let reactivity deep-proxy a DOM node written to `$` — a Vue proxy
        // over a live node breaks it. markRaw keeps the real node identity.
        return Reflect.set(
          $,
          key,
          isDomNode(value) ? markRaw(value as object) : value,
        );
      },
      deleteProperty: (_t, key) => {
        if (typeof key === "string") writes.add(key);
        return Reflect.deleteProperty($, key);
      },
    });

  const makeRunner = (cell: CellRecord) => () => {
    cell.writes.clear();
    cell.reads.clear();
    cell.logs = [];
    cell.error = undefined;
    cell.value = undefined;
    const api: CellApi = { onDispose: (fn) => onEffectCleanup(fn) };
    const restoreConsole = captureConsole(cell.logs);
    try {
      const result = cell.body(makeRecorder(cell.writes, cell.reads), api);
      if (result && typeof (result as Promise<unknown>).then === "function") {
        // Async cells: only synchronous reads are tracked (a known limitation of
        // every auto-tracker). Surface async rejections as the cell's error.
        (result as Promise<unknown>).catch((e) => {
          cell.error = errorText(e);
          emit(cell);
        });
      } else {
        // The cell's main export becomes its view (a DOM node → mountable).
        cell.value = result;
      }
    } catch (e) {
      cell.error = errorText(e);
    } finally {
      restoreConsole();
    }
    emit(cell);
  };

  const startCell = (cell: CellRecord) => {
    cell.scope = effectScope(true);
    cell.scope.run(() => {
      // `effect` runs the body once immediately (the initial run) and, on later
      // dependency changes, calls `scheduler` instead of re-running inline.
      cell.runner = effect(makeRunner(cell), {
        scheduler: () => schedule(cell),
      });
    });
  };

  const setCell: ReactiveEngine["setCell"] = (id, body) => {
    const existing = cells.get(id);
    if (existing) existing.scope.stop(); // dispose previous run's effects + cleanups
    const cell: CellRecord = {
      id,
      body,
      scope: undefined as unknown as EffectScope,
      runner: undefined as unknown as ReactiveEffectRunner,
      writes: new Set(),
      reads: new Set(),
      logs: [],
      value: undefined,
    };
    cells.set(id, cell);
    startCell(cell);
  };

  const removeCell: ReactiveEngine["removeCell"] = (id) => {
    const cell = cells.get(id);
    if (!cell) return;
    cell.scope.stop();
    cells.delete(id);
    pending.delete(cell);
    outputs.delete(id);
  };

  const restart: ReactiveEngine["restart"] = () => {
    const bodies = [...cells.values()].map((c) => ({ id: c.id, body: c.body }));
    for (const c of cells.values()) c.scope.stop();
    cells.clear();
    pending.clear();
    outputs.clear();
    clearContext($);
    for (const { id, body } of bodies) setCell(id, body);
  };

  const dispose: ReactiveEngine["dispose"] = () => {
    for (const c of cells.values()) c.scope.stop();
    cells.clear();
    pending.clear();
    outputs.clear();
    listeners.clear();
  };

  return {
    context: $,
    setCell,
    removeCell,
    getOutput: (id) => outputs.get(id),
    getValue: (id) => cells.get(id)?.value,
    onOutput: (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    restart,
    dispose,
  };
}

function errorText(e: unknown): string {
  if (e instanceof Error) return `${e.name}: ${e.message}`;
  return String(e);
}

function formatArg(a: unknown): string {
  if (typeof a === "string") return a;
  try {
    return JSON.stringify(a);
  } catch {
    return String(a);
  }
}

// Capture console output produced synchronously during a cell run into the
// cell's log list, then restore the real console.
function captureConsole(logs: LogEntry[]): () => void {
  const levels: LogLevel[] = ["log", "info", "warn", "error"];
  const original: Partial<Record<LogLevel, (...args: unknown[]) => void>> = {};
  for (const level of levels) {
    original[level] = console[level];
    console[level] = (...args: unknown[]) => {
      logs.push({ level, text: args.map(formatArg).join(" ") });
      original[level]!(...args);
    };
  }
  return () => {
    for (const level of levels) console[level] = original[level]!;
  };
}
