import { describe, expect, it } from "vitest";
import {
  chartCellCode,
  chartOutputKey,
  coerceRows,
  inferSeries,
  resolveSeries,
} from "@/editor/cells/chart/chart";

describe("chartCellCode", () => {
  it("publishes the parenthesized expression under the reserved key", () => {
    expect(chartCellCode("abc", "$.series")).toBe(
      '$["__chart_abc"] = ($.series);',
    );
    expect(chartOutputKey("abc")).toBe("__chart_abc");
  });

  it("trims and defaults an empty expression to []", () => {
    expect(chartCellCode("id", "   ")).toBe('$["__chart_id"] = ([]);');
    expect(chartCellCode("id", "  $.a  ")).toBe('$["__chart_id"] = ($.a);');
  });
});

describe("coerceRows", () => {
  it("keeps only plain row objects, drops everything else", () => {
    expect(coerceRows([{ a: 1 }, { b: 2 }])).toEqual([{ a: 1 }, { b: 2 }]);
    expect(coerceRows(42)).toEqual([]);
    expect(coerceRows(null)).toEqual([]);
    // scalars, arrays, and null items inside the array are filtered out
    expect(coerceRows([{ a: 1 }, 3, null, [1, 2]])).toEqual([{ a: 1 }]);
  });
});

describe("inferSeries", () => {
  it("picks the first non-numeric column as index, numeric ones as series", () => {
    const rows = [
      { month: "Jan", sales: 10, cost: 4 },
      { month: "Feb", sales: 20, cost: 6 },
    ];
    expect(inferSeries(rows)).toEqual({
      index: "month",
      categories: ["sales", "cost"],
    });
  });

  it("falls back to the first column when all are numeric", () => {
    const rows = [
      { x: 1, y: 2 },
      { x: 2, y: 4 },
    ];
    expect(inferSeries(rows)).toEqual({ index: "x", categories: ["y"] });
  });

  it("treats numeric-looking strings as series", () => {
    const rows = [{ n: "1", v: "2" }];
    // n is the first column → index; v (numeric-looking) → series
    expect(inferSeries(rows)).toEqual({ index: "n", categories: ["v"] });
  });

  it("is empty for empty data", () => {
    expect(inferSeries([])).toEqual({ index: "", categories: [] });
  });
});

describe("resolveSeries", () => {
  const rows = [
    { month: "Jan", sales: 10, cost: 4 },
    { month: "Feb", sales: 20, cost: 6 },
  ];

  it("honors explicit picks that exist in the data", () => {
    expect(resolveSeries(rows, "month", ["cost"])).toEqual({
      index: "month",
      categories: ["cost"],
    });
  });

  it("falls back to inference for stale/missing picks", () => {
    // a renamed field no longer present → infer instead of drawing nothing
    expect(resolveSeries(rows, "gone", ["missing"])).toEqual({
      index: "month",
      categories: ["sales", "cost"],
    });
  });
});
