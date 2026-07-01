// Public types for the reactive runtime. Framework/DOM-agnostic — this module
// is the portable analog of TypeCell's `engine` (context/executor/disposal),
// rebuilt as an injected library rather than an external orchestrator.

// The shared reactive context every cell reads from and writes to.
export type Context = Record<string, unknown>;

// What a cell does when it runs: read/write `$`, optionally register teardown,
// and optionally produce a *view* — its main export (a DOM node today, a React
// element later). The engine captures the return value but stays DOM-agnostic.
// (M3: cells reference `$` directly, e.g. `$.sum = $.a + $.b`. The
// `export const x → $.x` sugar arrives in M4 with full transpilation.)
export type CellBody = ($: Context, api: CellApi) => unknown;

export interface CellApi {
  // Register a callback to run before this cell re-runs and when it is removed —
  // the place to clear timers/listeners/subscriptions a run created.
  onDispose(fn: () => void): void;
}

export type LogLevel = "log" | "info" | "warn" | "error";

export interface LogEntry {
  level: LogLevel;
  text: string;
}

// The result of a cell run, surfaced to the UI.
export interface CellOutput {
  id: string;
  values: Record<string, unknown>; // the `$` keys this run wrote
  reads: string[]; // the `$` keys this run read (its dependencies — feeds the trace)
  logs: LogEntry[];
  error?: string;
  // True when this run produced a mountable DOM view (its main export). The live
  // node can't cross the sandbox boundary, so it stays in the runtime; the host
  // mounts it via RuntimeHost.mountView. Read the live value with getValue(id).
  view?: boolean;
}

// The in-process reactive engine (runs inside the sandbox in Phase B).
export interface ReactiveEngine {
  readonly context: Context;
  setCell(id: string, body: CellBody): void;
  removeCell(id: string): void;
  getOutput(id: string): CellOutput | undefined;
  // The live main-export value of a cell's last run (e.g. a DOM node to mount).
  getValue(id: string): unknown;
  onOutput(cb: (output: CellOutput) => void): () => void;
  restart(): void;
  dispose(): void;
}

// The sandbox boundary (Phase B): same surface but over cell *source strings*,
// so the editor is agnostic to whether Sandpack or a plain iframe wins the spike.
export interface RuntimeHost {
  load(cells: Array<{ id: string; code: string }>): void;
  update(id: string, code: string): void;
  remove(id: string): void;
  restart(): void;
  onOutput(cb: (output: CellOutput) => void): () => void;
  // Mount a cell's live DOM view into a host-owned container (same-origin), and
  // unmount it. No-op if the cell has no view or the sandbox isn't ready.
  mountView(id: string, container: Element): void;
  unmountView(container: Element): void;
  dispose(): void;
}
