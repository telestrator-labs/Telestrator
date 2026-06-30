import type { CellOutput } from "../runtime";

// The message protocol across the sandbox boundary. The same shape works for any
// host (plain iframe now; headless Sandpack later) — only the transport differs.

// Parent → sandbox.
export type HostMessage =
  | { type: "load"; cells: Array<{ id: string; code: string }> }
  | { type: "update"; id: string; code: string }
  | { type: "remove"; id: string }
  | { type: "restart" };

// Sandbox → parent.
export type RuntimeMessage =
  { type: "ready" } | { type: "output"; output: CellOutput };
