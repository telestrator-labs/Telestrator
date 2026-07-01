import { transform } from "sucrase";
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

// The React version served for cell output (JSX + react-dom). Pinned so a cell's
// `react/jsx-runtime` and the mount's `react-dom/client` resolve to ONE react
// instance (via ?deps) — required for hooks + reconciliation to work. Independent
// of the host app's bundled React (different realm; the output root is a leaf).
const REACT_VERSION = "18.3.1";

// Bare specifier → esm.sh URL (full URLs pass through). The react family is
// pinned + deduped; everything else resolves latest.
const toUrl = (specifier: string): string => {
  if (/^https?:\/\//.test(specifier)) return specifier;
  if (specifier === "react" || specifier.startsWith("react/"))
    return `https://esm.sh/react@${REACT_VERSION}${specifier.slice("react".length)}`;
  if (specifier === "react-dom" || specifier.startsWith("react-dom/"))
    return `https://esm.sh/react-dom@${REACT_VERSION}${specifier.slice("react-dom".length)}?deps=react@${REACT_VERSION}`;
  return `https://esm.sh/${specifier}`;
};

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
  // sucrase's `imports` transform rewrites `import ... from "x"` to require("x");
  // the automatic `jsx` runtime compiles `<JSX/>` to calls imported from
  // `react/jsx-runtime` (also rewritten to require). We supply require + a
  // module/exports scope. Transpiling first (rather than lexing the source) means
  // JSX/TSX is handled uniformly — and we read the needed modules straight off the
  // generated `require(...)` calls, including the injected jsx-runtime.
  const js = transform(code, {
    transforms: ["typescript", "jsx", "imports"],
    jsxRuntime: "automatic",
    jsxImportSource: "react",
    production: true,
    preserveDynamicImport: true,
  }).code;

  const specifiers = new Set<string>();
  for (const m of js.matchAll(/require\((["'])(.+?)\1\)/g))
    specifiers.add(m[2]);

  // Resolve every import up front (the only await) and build a sync require map.
  const resolved = new Map<string, Record<string, unknown>>();
  await Promise.all(
    [...specifiers].map(async (s) => resolved.set(s, await resolveModule(s))),
  );
  const requireShim = (specifier: string): Record<string, unknown> => {
    const mod = resolved.get(specifier);
    if (!mod) throw new Error(`Module not resolved: ${specifier}`);
    return mod;
  };

  const fn = new Function("$", "api", "require", "module", "exports", js);

  return ($, api) => {
    const module = { exports: {} as Record<string, unknown> };
    fn($, api, requireShim, module, module.exports);
    return mainExport(module.exports);
  };
}

// A cell's "view" is its main export: the default export, else a lone named
// export, else nothing. A DOM node here becomes a mountable output.
function mainExport(exports: Record<string, unknown>): unknown {
  if (exports.default !== undefined) return exports.default;
  const names = Object.keys(exports).filter((k) => k !== "__esModule");
  return names.length === 1 ? exports[names[0]] : undefined;
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
        reads: [],
        logs: [],
        error: e instanceof Error ? `${e.name}: ${e.message}` : String(e),
      },
    });
  }
}

// --- view mounting (same-origin side-channel) ------------------------------
//
// A cell's view is a live DOM node or React element that can't cross postMessage,
// so the host (same-origin) hands us its output container and we mount the current
// value into it directly. Re-called by the host on every re-run (output change).
// Exposed as window globals the host invokes via contentWindow.
interface ViewGlobals {
  __telestrator_mountView(id: string, container: Element): void;
  __telestrator_unmountView(container: Element): void;
}

type ReactRoot = { render(el: unknown): void; unmount(): void };
type ReactDomClient = { createRoot(el: Element): ReactRoot };

// react-dom is loaded lazily (only when a cell first returns a React element) and
// resolves to the same pinned react instance the cell's JSX uses (see toUrl).
let reactDomPromise: Promise<ReactDomClient> | null = null;
const getReactDom = (): Promise<ReactDomClient> =>
  (reactDomPromise ??= resolveModule("react-dom/client").then(
    (m) => m as unknown as ReactDomClient,
  ));

// One React root per output container, torn down when the view goes away or
// switches to a DOM node.
const roots = new Map<Element, ReactRoot>();
const clearRoot = (container: Element) => {
  const root = roots.get(container);
  if (root) {
    root.unmount();
    roots.delete(container);
  }
};

const isReactEl = (v: unknown): boolean =>
  !!v &&
  typeof v === "object" &&
  (v as { $$typeof?: unknown }).$$typeof === Symbol.for("react.element");
const isNode = (v: unknown): boolean =>
  !!v && typeof (v as { nodeType?: unknown }).nodeType === "number";

const w = window as unknown as ViewGlobals;
w.__telestrator_mountView = (id, container) => {
  const value = engine.getValue(id);
  if (isReactEl(value)) {
    getReactDom().then((ReactDOM) => {
      // The cell may have re-run while react-dom loaded; render the latest value.
      const current = engine.getValue(id);
      if (!isReactEl(current)) return clearRoot(container);
      let root = roots.get(container);
      if (!root) roots.set(container, (root = ReactDOM.createRoot(container)));
      root.render(current);
    });
  } else if (isNode(value)) {
    clearRoot(container);
    container.replaceChildren(value as Node);
  } else {
    clearRoot(container);
    container.replaceChildren();
  }
};
w.__telestrator_unmountView = (container) => {
  clearRoot(container);
  container.replaceChildren();
};

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
