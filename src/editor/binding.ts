// An input cell is just an auto-generated `$`-assignment cell. This pure helper
// turns an input's (kind, name, value) into the one-line source we feed to the
// reactive runtime via `rt.update` — e.g. a slider bound to `rate` at 12 becomes
//   $["rate"] = 12
// Reading cells that depend on `$.rate` then re-run, exactly as if a human had
// typed the assignment. The key is JSON-encoded so arbitrary names stay safe.

export type InputKind = "slider" | "number" | "text" | "select" | "toggle";

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
