import { describe, expect, it } from "vitest";
import {
  chipCellCode,
  chipOutputKey,
  isPlainPath,
  isReservedKey,
  pathSegments,
  tokenizeExpr,
  walkPath,
} from "./valueRef";

describe("plain-path classification", () => {
  it("accepts dotted identifier access off $", () => {
    expect(isPlainPath("$.rate")).toBe(true);
    expect(isPlainPath("$.styles.vars.gap")).toBe(true);
    expect(isPlainPath("  $.a.b  ")).toBe(true); // trimmed
  });

  it("rejects anything computed", () => {
    expect(isPlainPath("$.rate * 2")).toBe(false);
    expect(isPlainPath("$.a + $.b")).toBe(false);
    expect(isPlainPath("$.items[0]")).toBe(false);
    expect(isPlainPath("$")).toBe(false);
    expect(isPlainPath("rate")).toBe(false);
  });

  it("splits a plain path into segments after $", () => {
    expect(pathSegments("$.styles.vars.gap")).toEqual([
      "styles",
      "vars",
      "gap",
    ]);
    expect(pathSegments("$.rate")).toEqual(["rate"]);
    expect(pathSegments("$.a + 1")).toBeNull();
  });
});

describe("walkPath", () => {
  const root = { vars: { gap: "0.75rem" }, classes: { card: "c1" } };
  it("walks nested segments", () => {
    expect(walkPath(root, ["vars", "gap"])).toBe("0.75rem");
    expect(walkPath(root, ["classes", "card"])).toBe("c1");
  });
  it("returns undefined on a missing hop or nullish value", () => {
    expect(walkPath(root, ["vars", "nope"])).toBeUndefined();
    expect(walkPath(root, ["missing", "x"])).toBeUndefined();
    expect(walkPath(null, ["a"])).toBeUndefined();
    expect(walkPath(root, [])).toBe(root);
  });
});

describe("computed-chip codegen", () => {
  it("publishes the parenthesized expression under the reserved key", () => {
    expect(chipCellCode("abc", "$.rate * $.qty")).toBe(
      '$["__chip_abc"] = ($.rate * $.qty);',
    );
  });
  it("defaults an empty expression to undefined", () => {
    expect(chipCellCode("abc", "   ")).toBe('$["__chip_abc"] = (undefined);');
  });
  it("reserved keys are recognized (chart + chip)", () => {
    expect(isReservedKey(chipOutputKey("abc"))).toBe(true);
    expect(isReservedKey("__chart_x")).toBe(true);
    expect(isReservedKey("rate")).toBe(false);
  });
});

describe("tokenizeExpr", () => {
  it("splits references from literals and tags each head key", () => {
    expect(tokenizeExpr("$.rate * $.qty")).toEqual([
      { text: "$.rate", head: "rate" },
      { text: " * " },
      { text: "$.qty", head: "qty" },
    ]);
  });
  it("uses the first segment as the head of a nested reference", () => {
    expect(tokenizeExpr("$.styles.vars.gap")).toEqual([
      { text: "$.styles.vars.gap", head: "styles" },
    ]);
  });
  it("keeps leading/trailing literal text", () => {
    expect(tokenizeExpr("2 + $.a")).toEqual([
      { text: "2 + " },
      { text: "$.a", head: "a" },
    ]);
  });
});
