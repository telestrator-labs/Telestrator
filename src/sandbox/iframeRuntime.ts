import { transform } from "sucrase";
import { init as initLexer, parse as parseEsm } from "es-module-lexer";
import { createEngine, type CellBody } from "../runtime";
import type { HostMessage, RuntimeMessage } from "./protocol";

// This module runs INSIDE the sandbox iframe. It owns one reactive engine,
// compiles cell source (TS → JS via sucrase), resolves the cell's npm imports
// from esm.sh, and relays outputs back to the host. The bundle never reloads, so
// the shared `$` and all cell state persist across edits.

const engine = createEngine();

const post = (msg: RuntimeMessage) => parent.postMessage(msg, "*");

engine.onOutput((output) => post({ type: "output", output }));

// --- npm imports (esm.sh) ---------------------------------------------------
//
// The reactive engine runs each cell body SYNCHRONOUSLY inside an effect, so
// only `$` reads before the first `await` are tracked. We therefore resolve a
// cell's imports ONCE, before building its body — mirroring how TypeCell
// resolved AMD deps before running the reactive factory. The body itself never
// awaits, so `$`-tracking and reactive re-run work unchanged.

// Bare specifier → esm.sh URL (full URLs pass through). Version pinning and
// peer-dep dedupe (?deps/?external) are deferred.
const toUrl = (specifier: string) =>
  /^https?:\/\//.test(specifier) ? specifier : `https://esm.sh/${specifier}`;

// One in-flight/resolved promise per specifier, shared across cells and re-runs.
const moduleCache = new Map<string, Promise<Record<string, unknown>>>();

function resolveModule(specifier: string): Promise<Record<string, unknown>> {
  let cached = moduleCache.get(specifier);
  if (!cached) {
    cached = import(/* @vite-ignore */ toUrl(specifier)).then((ns) => ({
      // Spread the ESM namespace into a CJS-shaped object and flag __esModule so
      // sucrase's interop returns it as-is (default off `.default`, named direct).
      ...ns,
      __esModule: true,
    }));
    moduleCache.set(specifier, cached);
  }
  return cached;
}

// Compile a cell's TS source into a synchronous body, pre-resolving its imports.
async function compile(code: string): Promise<CellBody> {
  await initLexer;
  const [imports] = parseEsm(code);
  const specifiers = [
    ...new Set(
      imports.filter((i) => i.d === -1 && i.n).map((i) => i.n as string),
    ),
  ];

  // Resolve every import up front (the only await) and build a sync require map.
  const resolved = new Map<string, Record<string, unknown>>();
  await Promise.all(
    specifiers.map(async (s) => resolved.set(s, await resolveModule(s))),
  );
  const requireShim = (specifier: string): Record<string, unknown> => {
    const mod = resolved.get(specifier);
    if (!mod) throw new Error(`Module not resolved: ${specifier}`);
    return mod;
  };

  // sucrase's `imports` transform rewrites `import ... from "x"` to require("x")
  // with correct default/named interop; we supply require + a module/exports
  // scope it expects.
  const js = transform(code, {
    transforms: ["typescript", "imports"],
    preserveDynamicImport: true,
  }).code;
  const fn = new Function("$", "api", "require", "module", "exports", js);

  return ($, api) => {
    const module = { exports: {} as Record<string, unknown> };
    fn($, api, requireShim, module, module.exports);
  };
}

// Register a cell, surfacing resolution/compile/syntax errors as that cell's
// output instead of throwing across the boundary.
async function setCell(id: string, code: string) {
  try {
    engine.setCell(id, await compile(code));
  } catch (e) {
    post({
      type: "output",
      output: {
        id,
        values: {},
        logs: [],
        error: e instanceof Error ? `${e.name}: ${e.message}` : String(e),
      },
    });
  }
}

window.addEventListener("message", (event: MessageEvent<HostMessage>) => {
  const msg = event.data;
  switch (msg?.type) {
    case "load":
      for (const cell of msg.cells) void setCell(cell.id, cell.code);
      break;
    case "update":
      void setCell(msg.id, msg.code);
      break;
    case "remove":
      engine.removeCell(msg.id);
      break;
    case "restart":
      engine.restart();
      break;
  }
});

post({ type: "ready" });
