import {
  createDefaultMapFromCDN,
  createSystem,
  createVirtualTypeScriptEnvironment,
} from "@typescript/vfs";
import ts from "typescript";
import * as Comlink from "comlink";
import { createWorker } from "@valtown/codemirror-ts/worker";

// The TypeScript language service for code cells, run OFF the main thread. It
// hosts one shared virtual filesystem — the default libs (fetched from a CDN,
// cached in the map) + an ambient `globals.d.ts` for the runtime-injected
// `$`/`onDispose`, plus a file per cell (synced by tsSyncWorker). The full `ts`
// compiler is bundled into THIS chunk only, so it loads lazily when the first TS
// cell mounts, not in the main bundle.
//
// SPIKE (tier a — language-level IntelliSense): `$` is typed `any` so cells don't
// read as a sea of "Cannot find name '$'" errors. Tier b will generate a *typed*
// `$` declaration from the live reactive graph so member access completes.
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

// A script-mode (no import/export) .d.ts so these declarations are *global* —
// visible in every cell, module or script.
const GLOBALS_DTS = [
  "// Ambient globals the reactive runtime injects into every cell.",
  "declare const $: Record<string, any>;",
  "declare function onDispose(cb: () => void): void;",
].join("\n");

Comlink.expose(
  createWorker(async () => {
    const fsMap = await createDefaultMapFromCDN(
      compilerOptions,
      ts.version,
      false, // no localStorage in a worker
      ts,
    );
    fsMap.set("/globals.d.ts", GLOBALS_DTS);
    const system = createSystem(fsMap);
    return createVirtualTypeScriptEnvironment(
      system,
      ["/globals.d.ts"],
      ts,
      compilerOptions,
    );
  }),
);
