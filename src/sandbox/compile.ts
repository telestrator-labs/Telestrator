import { transform } from "sucrase";
import type { CellBody } from "../runtime";

// The pure transpile layer of the sandbox: TS/TSX → a runnable cell body, plus
// runtime npm import resolution from esm.sh. No DOM / engine / window side
// effects, so it's unit-testable (see compile.test.ts). iframeRuntime wires this
// to the reactive engine and the view-mount channel.

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

export function resolveModule(
  specifier: string,
): Promise<Record<string, unknown>> {
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

// The cell's *view* is its default export (`export default <DOM/React>`); the
// engine renders it if it's mountable. Named exports are state, not the view.
function mainExport(exports: Record<string, unknown>): unknown {
  return exports.default;
}

// Compile a cell's TS source into a synchronous body, pre-resolving its imports.
export async function compile(code: string): Promise<CellBody> {
  // sucrase's `imports` transform rewrites `import ... from "x"` to require("x")
  // and `export const foo = …` to `exports.foo = …`; the automatic `jsx` runtime
  // compiles `<JSX/>` to calls imported from `react/jsx-runtime` (also rewritten
  // to require). We supply require + a module/exports scope. Transpiling first
  // (rather than lexing the source) means JSX/TSX is handled uniformly — and we
  // read the needed modules straight off the generated `require(...)` calls,
  // including the injected jsx-runtime.
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
    // Export sugar: a top-level `export const/let/function/class foo = …` writes
    // `$.foo` (reactive state other cells can read). `default` stays the view.
    for (const key of Object.keys(module.exports)) {
      if (key === "default" || key === "__esModule") continue;
      ($ as Record<string, unknown>)[key] = module.exports[key];
    }
    return mainExport(module.exports);
  };
}
