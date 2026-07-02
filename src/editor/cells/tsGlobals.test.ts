import { describe, expect, it } from "vitest";
import { buildGlobalsDts, inferType } from "./tsGlobals";

describe("inferType", () => {
  it("maps primitives", () => {
    expect(inferType(10)).toBe("number");
    expect(inferType("hi")).toBe("string");
    expect(inferType(true)).toBe("boolean");
    expect(inferType(null)).toBe("any");
    expect(inferType(undefined)).toBe("any");
    expect(inferType(() => {})).toBe("(...args: any[]) => any");
  });

  it("infers nested object shapes with quoted non-ident keys", () => {
    expect(
      inferType({ vars: { pad: "8px" }, "data-x": 1 }),
    ).toBe('{ vars: { pad: string }; "data-x": number }');
  });

  it("infers array element type from the first item; empty → any[]", () => {
    expect(inferType([{ x: 1 }])).toBe("{ x: number }[]");
    expect(inferType([])).toBe("any[]");
  });

  it("caps depth so deep objects don't explode", () => {
    const deep = { a: { b: { c: { d: { e: 1 } } } } };
    // depth 4 collapses to any
    expect(inferType(deep)).toBe("{ a: { b: { c: { d: any } } } }");
  });

  it("empty object → open index signature", () => {
    expect(inferType({})).toBe("{ [key: string]: any }");
  });
});

describe("buildGlobalsDts", () => {
  const dts = buildGlobalsDts([
    { key: "rate", value: 10 },
    { key: "styles", value: { vars: { pad: "8px" } } },
  ]);

  it("types known keys and keeps a permissive index signature", () => {
    expect(dts).toContain("rate: number;");
    expect(dts).toContain("styles: { vars: { pad: string } };");
    expect(dts).toContain("[key: string]: any;");
  });

  it("declares the ambient runtime helpers", () => {
    expect(dts).toContain("declare const $:");
    expect(dts).toContain("declare function onDispose(cb: () => void): void;");
  });

  it("empty graph → just the index signature + helpers", () => {
    const empty = buildGlobalsDts([]);
    expect(empty).toContain("[key: string]: any;");
    expect(empty).toContain("declare function onDispose");
  });
});
