// Pure, framework-agnostic helpers for the inline `$`-value chip. A chip holds a
// `$`-expression (`node.attrs.expr`) that is either a plain *path* (`$.rate`,
// `$.styles.vars.gap`) resolved host-side against the value snapshot, or a
// *computed* expression (`$.rate * $.qty`) evaluated in the sandbox via a hidden
// generated cell — the same trick the chart block uses (see chart.ts).

// A plain path off `$`: `$.a`, `$.styles.vars.gap`. Only dotted identifier access
// (no operators, calls, brackets), so it can be walked over the value snapshot
// with no `eval`. Anything richer is a "computed" expression.
//
// This is the single source of truth for "what does a `$`-path reference look
// like" — PLAIN_PATH (anchored, whole-string), containsValueRef (unanchored,
// existence check), and tokenizeExpr's scanning regex (unanchored + global) are
// all built from this fragment so the grammar can't silently diverge between them.
const VALUE_REF_SOURCE = "\\$(?:\\.[A-Za-z_$][\\w$]*)+";

const PLAIN_PATH = new RegExp(`^${VALUE_REF_SOURCE}$`);

export function isPlainPath(expr: string): boolean {
  return PLAIN_PATH.test(expr.trim());
}

// Whether text contains at least one `$.<path>` reference anywhere within it (not
// necessarily the whole string) — e.g. true for "$.rate" and "$.rate * $.qty",
// false for a bare "$" or a non-path "$PATH"/"$5". Used to detect reactive
// references inside arbitrary surrounding text (see codeSignal.ts) without
// matching on a bare literal "$" character.
const VALUE_REF_SCAN = new RegExp(VALUE_REF_SOURCE);

export function containsValueRef(text: string): boolean {
  return VALUE_REF_SCAN.test(text);
}

// The segments of a plain path *after* `$` — `$.styles.vars.gap` → `["styles",
// "vars", "gap"]`. Returns null when the expression isn't a plain path.
export function pathSegments(expr: string): string[] | null {
  const e = expr.trim();
  if (!isPlainPath(e)) return null;
  return e.slice(2).split("."); // drop the leading "$."
}

// Walk a dotted path over a root value, guarding each hop. Returns undefined the
// moment a segment is missing or the current value is nullish.
export function walkPath(root: unknown, segments: string[]): unknown {
  let v = root;
  for (const seg of segments) {
    if (v == null) return undefined;
    v = (v as Record<string, unknown>)[seg];
  }
  return v;
}

// The reserved `$` key a computed chip publishes its evaluated result under.
// Namespaced by node id so it never collides with an author key and two chips
// don't clobber each other (mirrors chartOutputKey).
export function chipOutputKey(id: string): string {
  return `__chip_${id}`;
}

// Internal keys that back charts/chips — never surfaced as authorable `$` values
// (filtered from the trace graph so they don't pollute the `$` picker or the
// document-live count).
const RESERVED_KEY = /^__(chart|chip)_/;
export function isReservedKey(key: string): boolean {
  return RESERVED_KEY.test(key);
}

// The generated runtime cell for a computed chip: evaluate the author's
// `$`-reading expression and publish it under the chip's reserved key.
// Parenthesized so an object literal is a value, not a block; an empty expression
// publishes `undefined` so the cell stays valid and the chip shows nothing.
export function chipCellCode(id: string, expr: string): string {
  const key = JSON.stringify(chipOutputKey(id));
  const e = expr.trim() || "undefined";
  return `$[${key}] = (${e});`;
}

export interface ValuePath {
  path: string; // dotted access path off `$`, e.g. "styles.vars.gap"
  value: unknown;
}

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);

const DOT_KEY = /^[A-Za-z_$][\w$]*$/;

// Expand top-level `$` entries into every dot-accessible path — top-level keys
// *and* their nested object leaves — so the `$` picker can surface (and search)
// nested values like `styles.vars.gap` by name, not only by drilling the parent.
// Plain objects only (arrays/values are leaves); bounded depth + count so a big
// data object can't flood the picker.
export function flattenValuePaths(
  entries: { key: string; value: unknown }[],
  maxDepth = 3,
  cap = 300,
): ValuePath[] {
  const out: ValuePath[] = [];
  const visit = (path: string, value: unknown, depth: number) => {
    if (out.length >= cap) return;
    out.push({ path, value });
    if (depth < maxDepth && isPlainObject(value)) {
      for (const k of Object.keys(value)) {
        if (!DOT_KEY.test(k)) continue; // only ident keys are `$.a.b`-reachable
        visit(`${path}.${k}`, value[k], depth + 1);
      }
    }
  };
  for (const e of entries) visit(e.key, e.value, 1);
  return out;
}

export interface ExprToken {
  text: string;
  // Present on a `$.<path>` reference token; the top-level `$` key it reads (so
  // the chip can hover-trace it). Absent on literal segments (operators, numbers).
  head?: string;
}

// Split an expression into alternating literal / `$.<path>` reference tokens so a
// computed chip can render each reference as its own hoverable span. The head key
// (for tracing) is the first path segment: `$.styles.vars.gap` → head `styles`.
export function tokenizeExpr(expr: string): ExprToken[] {
  const re = new RegExp(VALUE_REF_SOURCE, "g");
  const tokens: ExprToken[] = [];
  let last = 0;
  for (const m of expr.matchAll(re)) {
    const start = m.index ?? 0;
    if (start > last) tokens.push({ text: expr.slice(last, start) });
    const head = m[0].slice(2).split(".")[0];
    tokens.push({ text: m[0], head });
    last = start + m[0].length;
  }
  if (last < expr.length) tokens.push({ text: expr.slice(last) });
  return tokens;
}
