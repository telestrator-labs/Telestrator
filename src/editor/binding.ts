// An input cell is just an auto-generated `$`-assignment cell. This pure helper
// turns an input's (kind, name, value) into the one-line source we feed to the
// reactive runtime via `rt.update` — e.g. a slider bound to `rate` at 12 becomes
//   $["rate"] = 12
// Reading cells that depend on `$.rate` then re-run, exactly as if a human had
// typed the assignment. The key is JSON-encoded so arbitrary names stay safe.

export type InputKind = "slider" | "number" | "text" | "select" | "toggle";

export interface CoerceOpts {
  min?: number;
  max?: number;
  options?: string[];
}

// Coerce a stored value to one that is valid for `kind` (+ its config), so the
// control, the displayed value, and the generated `$` binding can never diverge.
// Needed because `value` persists across kind switches and starts at the numeric
// default (0): a select must resolve to a real option, a slider must be a finite
// in-range number, etc.
export function coerceValue(
  kind: InputKind,
  value: unknown,
  opts: CoerceOpts = {},
): number | string | boolean {
  switch (kind) {
    case "slider": {
      const n = Number(value);
      const base = Number.isFinite(n) ? n : (opts.min ?? 0);
      return Math.min(
        Math.max(base, opts.min ?? -Infinity),
        opts.max ?? Infinity,
      );
    }
    case "number": {
      const n = Number(value);
      return Number.isFinite(n) ? n : 0;
    }
    case "toggle":
      return Boolean(value);
    case "select": {
      const options = opts.options ?? [];
      const s = value == null ? "" : String(value);
      return options.includes(s) ? s : (options[0] ?? "");
    }
    case "text":
    default:
      return value == null ? "" : String(value);
  }
}

export function bindingCode(
  kind: InputKind,
  name: string,
  value: unknown,
): string {
  const key = JSON.stringify(name);
  let literal: string;
  switch (kind) {
    case "slider":
    case "number": {
      const n = Number(value);
      literal = String(Number.isFinite(n) ? n : 0);
      break;
    }
    case "toggle":
      literal = String(Boolean(value));
      break;
    case "text":
    case "select":
    default:
      literal = JSON.stringify(value == null ? "" : String(value));
      break;
  }
  return `$[${key}] = ${literal}`;
}
