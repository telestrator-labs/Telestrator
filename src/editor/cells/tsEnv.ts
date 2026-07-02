import * as Comlink from "comlink";
import type { WorkerShape } from "@valtown/codemirror-ts/worker";
import {
  getValueEntries,
  subscribeValueKeys,
} from "@/editor/cells/valueRef/valueKeys";
import { GLOBALS_PATH, buildGlobalsDts } from "@/editor/cells/tsGlobals";

// One shared TS worker for all code cells — a single virtual filesystem and
// language service, so cells are typed against the same libs + ambient globals.
// Lazily spun up (and `initialize()`d) on the first TS cell, so a notebook with
// no code never pays for the `ts` compiler download.
let workerPromise: Promise<WorkerShape> | null = null;

// Debounce globals regeneration — dragging a slider fires value updates rapidly,
// and each regenerates + reships the whole `$` declaration.
const GLOBALS_DEBOUNCE_MS = 200;

export function getTsWorker(): Promise<WorkerShape> {
  if (!workerPromise) {
    const inner = new Worker(new URL("./tsWorker.ts", import.meta.url), {
      type: "module",
    });
    const promise = (async () => {
      const worker = Comlink.wrap<WorkerShape>(inner);
      await worker.initialize();
      startGlobalsSync(worker);
      return worker;
    })();
    // Never cache a rejection: drop it (and terminate the dead worker) so the
    // next caller — e.g. the next code cell to mount — spins up a fresh one
    // instead of inheriting the same failed init.
    promise.catch((e) => {
      console.error("[ts] IntelliSense worker init failed; will retry", e);
      if (workerPromise === promise) workerPromise = null;
      inner.terminate();
    });
    workerPromise = promise;
  }
  return workerPromise;
}

// The one host↔worker bridge for tier b: keep `globals.d.ts` in sync with the
// live reactive graph so `$` is *typed* (`$.rate: number`, `$.styles.vars.pad:
// string`), not `any`. Pushes the current shape immediately, then on every
// value-graph change (debounced). Completions/hover reflect it on their next
// query; already-drawn diagnostics refresh on the next edit.
function startGlobalsSync(worker: WorkerShape): void {
  const push = () =>
    void worker.updateFile({
      path: GLOBALS_PATH,
      code: buildGlobalsDts(getValueEntries()),
    });

  push();

  let timer: ReturnType<typeof setTimeout> | null = null;
  subscribeValueKeys(() => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(push, GLOBALS_DEBOUNCE_MS);
  });
}
