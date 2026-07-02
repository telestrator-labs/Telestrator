import {
  createDefaultMapFromCDN,
  createSystem,
  createVirtualTypeScriptEnvironment,
} from "@typescript/vfs";
import ts from "typescript";
import * as Comlink from "comlink";
import { createWorker } from "@valtown/codemirror-ts/worker";
import { GLOBALS_PATH, buildGlobalsDts } from "@/editor/cells/tsGlobals";

// The TypeScript language service for code cells, run OFF the main thread. It
// hosts one shared virtual filesystem — the default libs (fetched from a CDN,
// cached in the map) + an ambient `globals.d.ts` for the runtime-injected
// `$`/`onDispose`, plus a file per cell (synced by tsSyncWorker). The full `ts`
// compiler is bundled into THIS chunk only, so it loads lazily when the first TS
// cell mounts, not in the main bundle.
//
// The `globals.d.ts` seeded here is just the permissive fallback (empty graph);
// the host (tsEnv.ts) pushes a `$` typed from the live reactive graph — tier b.
// No explicit `lib` — the ES2022 *target* implies the full default lib closure
// (`lib.es2022.full.d.ts`, which includes DOM). The exact same options object is
// handed to both `createDefaultMapFromCDN` (to know which lib files to fetch) and
// the env, so they can never disagree about which libs exist.
const compilerOptions: ts.CompilerOptions = {
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  jsx: ts.JsxEmit.ReactJSX,
  allowJs: true,
  esModuleInterop: true,
  allowNonTsExtensions: true,
  skipLibCheck: true,
  noEmit: true,
};

Comlink.expose(
  createWorker(async () => {
    const fsMap = await createDefaultMapFromCDN(
      compilerOptions,
      ts.version,
      false, // no localStorage in a worker
      ts,
    );
    // Script-mode (no import/export) .d.ts → the declarations are *global*,
    // visible in every cell. Seeded with the empty-graph fallback; tsEnv pushes
    // the real, typed `$` once the graph is known.
    fsMap.set(GLOBALS_PATH, buildGlobalsDts([]));
    const system = createSystem(fsMap);
    return createVirtualTypeScriptEnvironment(
      system,
      [GLOBALS_PATH],
      ts,
      compilerOptions,
    );
  }),
);
