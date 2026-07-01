// Pure, framework-agnostic helpers for the chart block. A chart is the mirror of
// an input cell: where an input *writes* a `$` value, a chart *reads* one. It has
// no direct-read runtime API, so it registers a generated cell that evaluates the
// author's `$`-reading expression and writes the result to a namespaced key the
// chart owns; the NodeView then reads that key back via `useCellOutput`.

export type ChartType = "area" | "line" | "bar";

export interface ChartConfig {
  showLegend?: boolean;
  showGrid?: boolean;
  // Stack series instead of overlaying them (area/bar).
  stack?: boolean;
  // Smooth (monotone) vs. straight segments (area/line).
  curve?: boolean;
  // Raw comma-separated buffer backing the series-fields input, so the separator
  // survives keystrokes; the parsed `categories` attr is derived from it.
  categoriesText?: string;
}

export type ChartRow = Record<string, unknown>;

// The reserved `$` key a chart publishes its evaluated data under. Namespaced by
// the node id so it never collides with an author's own `$` keys, and unique per
// chart so two charts don't clobber each other.
export function chartOutputKey(id: string): string {
  return `__chart_${id}`;
}

// The generated runtime cell: evaluate the author's expression (which reads `$`
// freely) and publish it under the chart's reserved key. Parenthesized so an
// object/array literal is treated as a value, not a block. An empty expression
// publishes `[]` so the cell is always valid and the chart shows its empty state.
export function chartCellCode(id: string, expression: string): string {
  const key = JSON.stringify(chartOutputKey(id));
  const expr = expression.trim() || "[]";
  return `$[${key}] = (${expr});`;
}

// Validate a runtime value into an array of plain row objects. Anything else — a
// scalar, null, a non-object array item — is dropped, so a half-typed or wrong
// expression yields an empty chart instead of throwing inside recharts.
export function coerceRows(value: unknown): ChartRow[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (r): r is ChartRow =>
      r != null && typeof r === "object" && !Array.isArray(r),
  );
}

// Is a column numeric across all rows (ignoring blanks)? Numeric-looking strings
// ("256") count, so `{ n: "3" }` still plots.
function isNumericColumn(rows: ChartRow[], key: string): boolean {
  return rows.every((r) => {
    const v = r[key];
    if (v == null || v === "") return true;
    if (typeof v === "number") return Number.isFinite(v);
    return typeof v === "string" && Number.isFinite(Number(v));
  });
}

// Infer a sensible x-axis category + value series from the data when the author
// hasn't pinned them: the index is the first non-numeric column (a label like a
// month or name), falling back to the first column; the series are the remaining
// numeric columns. Derived from the first row's key order.
export function inferSeries(rows: ChartRow[]): {
  index: string;
  categories: string[];
} {
  if (rows.length === 0) return { index: "", categories: [] };
  const keys = Object.keys(rows[0]);
  if (keys.length === 0) return { index: "", categories: [] };
  const index = keys.find((k) => !isNumericColumn(rows, k)) ?? keys[0];
  const numeric = keys.filter((k) => k !== index && isNumericColumn(rows, k));
  // If nothing else is numeric, fall back to every non-index column so the chart
  // still has something to draw.
  const categories = numeric.length ? numeric : keys.filter((k) => k !== index);
  return { index, categories };
}

// Resolve the effective index/series: honor the author's explicit picks when
// they still exist in the data, otherwise fall back to inference. Keeps a chart
// working when the underlying data reshapes (a renamed field) without silently
// ignoring a deliberate choice.
export function resolveSeries(
  rows: ChartRow[],
  index: string,
  categories: string[],
): { index: string; categories: string[] } {
  const inferred = inferSeries(rows);
  const keys = rows.length ? Object.keys(rows[0]) : [];
  const validCats = categories.filter((c) => keys.includes(c));
  return {
    index: index && keys.includes(index) ? index : inferred.index,
    categories: validCats.length ? validCats : inferred.categories,
  };
}
