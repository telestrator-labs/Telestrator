// Generates the ambient `globals.d.ts` fed to the code-cell TS language service —
// a *typed* `$` inferred from the live reactive graph (tier b). The notebook knows
// every `$` key and its current value; we turn those example values into TS types
// so `$.rate` completes as `number` and `$.styles.vars.pad` as `string`.
//
// PURE: no editor/runtime imports, so both the worker (tsWorker.ts, for the initial
// fallback) and the host (tsEnv.ts, which pushes live updates) can import it.

export const GLOBALS_PATH = "/globals.d.ts";

export interface ValueEntry {
  key: string;
  value: unknown;
}

const IDENT = /^[A-Za-z_$][\w$]*$/;
const propKey = (k: string): string => (IDENT.test(k) ? k : JSON.stringify(k));

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);

// A TS type string inferred from a runtime value. Types come from *examples*, so
// this can't see unions/precise literals — good enough for authoring IntelliSense.
// Depth-capped so a deep/cyclic-ish object can't blow up the declaration.
export function inferType(value: unknown, depth = 0): string {
  if (value === null || value === undefined) return "any";
  switch (typeof value) {
    case "number":
      return "number";
    case "string":
      return "string";
    case "boolean":
      return "boolean";
    case "function":
      return "(...args: any[]) => any";
    case "object": {
      if (Array.isArray(value)) {
        if (value.length === 0 || depth >= 4) return "any[]";
        return `${inferType(value[0], depth + 1)}[]`;
      }
      if (!isPlainObject(value) || depth >= 4) return "any";
      const keys = Object.keys(value);
      if (keys.length === 0) return "{ [key: string]: any }";
      const props = keys
        .map((k) => `${propKey(k)}: ${inferType(value[k], depth + 1)}`)
        .join("; ");
      return `{ ${props} }`;
    }
    default:
      return "any";
  }
}

// The full ambient declaration. `$` is a single type literal with a string index
// signature so *known* keys keep their inferred type while not-yet-written keys
// stay permissive `any` (an intersection with `Record<string, any>` would instead
// collapse the known props to `any`).
export function buildGlobalsDts(entries: ValueEntry[]): string {
  const props = entries
    .map((e) => `  ${propKey(e.key)}: ${inferType(e.value)};`)
    .join("\n");
  return [
    "// Auto-generated from the live reactive graph — the current shape of `$`.",
    "declare const $: {",
    props,
    "  [key: string]: any;",
    "};",
    "declare function onDispose(cb: () => void): void;",
    "",
  ].join("\n");
}
