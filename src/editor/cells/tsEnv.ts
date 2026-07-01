import * as Comlink from "comlink";
import type { WorkerShape } from "@valtown/codemirror-ts/worker";

// One shared TS worker for all code cells — a single virtual filesystem and
// language service, so cells are typed against the same libs + ambient globals.
// Lazily spun up (and `initialize()`d) on the first TS cell, so a notebook with
// no code never pays for the `ts` compiler download.
let workerPromise: Promise<WorkerShape> | null = null;

export function getTsWorker(): Promise<WorkerShape> {
  if (!workerPromise) {
    workerPromise = (async () => {
      const inner = new Worker(new URL("./tsWorker.ts", import.meta.url), {
        type: "module",
      });
      const worker = Comlink.wrap<WorkerShape>(inner);
      await worker.initialize();
      return worker;
    })();
  }
  return workerPromise;
}
