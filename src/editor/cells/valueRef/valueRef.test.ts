import { describe, expect, it } from "vitest";
import {
  chipCellCode,
  chipOutputKey,
  containsValueRef,
  flattenValuePaths,
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

describe("containsValueRef", () => {
  it("false for a bare $ with no path", () => {
    expect(containsValueRef("$")).toBe(false);
  });

  it("false for a $ that isn't followed by a dotted path", () => {
    expect(containsValueRef("$PATH")).toBe(false);
    expect(containsValueRef("cost - $5")).toBe(false);
  });

  it("true for a single reference", () => {
    expect(containsValueRef("$.rate")).toBe(true);
  });

  it("true when a reference appears among other text", () => {
    expect(containsValueRef("$.rate * $.qty")).toBe(true);
  });

  it("false for plain text with no $ at all", () => {
    expect(containsValueRef("just some text")).toBe(false);
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

describe("flattenValuePaths", () => {
  const entries = [
    { key: "rate", value: 10 },
    { key: "styles", value: { vars: { gap: "8px", pad: "4px" }, classes: { card: "c1" } } },
    { key: "rows", value: [{ x: 1 }] }, // arrays are leaves, not expanded
  ];

  it("includes top-level keys and nested object leaves, arrays left whole", () => {
    const paths = flattenValuePaths(entries).map((p) => p.path);
    expect(paths).toContain("rate");
    expect(paths).toContain("styles");
    expect(paths).toContain("styles.vars");
    expect(paths).toContain("styles.vars.gap");
    expect(paths).toContain("styles.classes.card");
    expect(paths).toContain("rows"); // present…
    expect(paths).not.toContain("rows.0"); // …but not descended into
  });

  it("carries the resolved value for each path", () => {
    const gap = flattenValuePaths(entries).find((p) => p.path === "styles.vars.gap");
    expect(gap?.value).toBe("8px");
  });

  it("honors the depth cap", () => {
    const paths = flattenValuePaths(entries, 2).map((p) => p.path);
    expect(paths).toContain("styles.vars");
    expect(paths).not.toContain("styles.vars.gap"); // depth 3 excluded
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
