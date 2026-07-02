import { createSystem, createVirtualTypeScriptEnvironment } from "@typescript/vfs";
import ts from "typescript";
import * as Comlink from "comlink";
import { createWorker } from "@valtown/codemirror-ts/worker";
import { GLOBALS_PATH, buildGlobalsDts } from "@/editor/cells/tsGlobals";

// The TypeScript language service for code cells, run OFF the main thread. It
// hosts one shared virtual filesystem — the standard `lib.*.d.ts` files + an
// ambient `globals.d.ts` for the runtime-injected `$`/`onDispose`, plus a file
// per cell (synced by tsSyncWorker). The `ts` compiler + libs are bundled into
// THIS chunk only, so they load lazily when the first TS cell mounts.
//
// The `globals.d.ts` seeded here is just the permissive fallback (empty graph);
// the host (tsEnv.ts) pushes a `$` typed from the live reactive graph — tier b.
//
// No explicit `lib` — the ES2022 *target* implies the full default lib closure
// (`lib.es2022.full.d.ts`, which includes DOM). The same options object is handed
// to the env so it resolves libs against the map below.
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

// Self-hosted TS lib files — bundled at build time (raw text) instead of fetched
// from a CDN, so IntelliSense works offline and never fails on a network hiccup.
// ~3.2 MB raw across the `lib.*.d.ts` set, in this lazy worker chunk; TS only
// *parses* the files its target references, the rest sit unused in the map.
const libSources = import.meta.glob(
  "/node_modules/typescript/lib/lib.*.d.ts",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

function buildFsMap(): Map<string, string> {
  const map = new Map<string, string>();
  for (const [path, content] of Object.entries(libSources)) {
    // TS resolves libs by bare filename at the FS root, e.g. "/lib.es2022.d.ts".
    map.set(`/${path.slice(path.lastIndexOf("/") + 1)}`, content);
  }
  // Script-mode (no import/export) .d.ts → the declarations are *global*, visible
  // in every cell. Seeded with the empty-graph fallback; tsEnv pushes the real,
  // typed `$` once the graph is known.
  map.set(GLOBALS_PATH, buildGlobalsDts([]));
  return map;
}

Comlink.expose(
  createWorker(() => {
    const system = createSystem(buildFsMap());
    return createVirtualTypeScriptEnvironment(
      system,
      [GLOBALS_PATH],
      ts,
      compilerOptions,
    );
  }),
);
