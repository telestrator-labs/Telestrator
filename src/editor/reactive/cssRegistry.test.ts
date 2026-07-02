import { afterEach, expect, test } from "vitest";
import {
  cssRegistry,
  cssVarsFromEntries,
  parseApi,
  OUTPUT_CLASS,
} from "@/editor/reactive/cssRegistry";

const styleFor = (id: string) =>
  document.head.querySelector<HTMLStyleElement>(
    `style[data-telestrator-css="${id}"]`,
  );
const varsStyle = () =>
  document.head.querySelector<HTMLStyleElement>("style[data-telestrator-vars]");

afterEach(() => {
  cssRegistry.remove("a");
  cssRegistry.remove("b");
  cssRegistry.setVars({});
});

test("set() injects a <style> whose selectors are scoped to output regions", () => {
  cssRegistry.set("a", ".card { color: red; } h1 { margin: 0; }");

  const el = styleFor("a");
  expect(el).not.toBeNull();

  const selectors = [...(el!.sheet!.cssRules as unknown as CSSStyleRule[])].map(
    (r) => r.selectorText,
  );
  // Every rule is prefixed with the output-scope class, so cell CSS only styles
  // output regions (and other cells' output can use the class).
  for (const sel of selectors) {
    expect(sel).toContain(`.${OUTPUT_CLASS}`);
  }
  expect(selectors.join(" ")).toContain(`.${OUTPUT_CLASS} .card`);
});

test("set() replaces content on re-inject; remove() cleans up", () => {
  cssRegistry.set("b", ".x { color: red }");
  const el = styleFor("b");
  cssRegistry.set("b", ".y { color: blue }");
  // Same element reused, new content.
  expect(styleFor("b")).toBe(el);
  expect(el!.textContent).toContain(".y");

  cssRegistry.remove("b");
  expect(styleFor("b")).toBeNull();
});

test("parseApi extracts class names and custom-property references", () => {
  const api = parseApi(
    ".card { padding: 12px } :root { --gap: 8px; --bg: red }",
  );
  expect(api.classes).toEqual({ card: "card" });
  expect(api.vars).toEqual({ gap: "var(--gap)", bg: "var(--bg)" });
});

test("cssVarsFromEntries keeps top-level primitives under ident keys only", () => {
  expect(
    cssVarsFromEntries([
      { key: "pad", value: 16 },
      { key: "label", value: "hi" },
      { key: "on", value: true },
      { key: "styles", value: { a: 1 } }, // object → dropped
      { key: "rows", value: [1, 2] }, // array → dropped
      { key: "n", value: NaN }, // non-finite → dropped
      { key: "2bad", value: 1 }, // invalid ident → dropped
    ]),
  ).toEqual({ pad: 16, label: "hi", on: true });
});

test("setVars publishes primitives as scoped custom properties (js → css)", () => {
  cssRegistry.setVars({ pad: 16, label: "hi" });
  const el = varsStyle();
  expect(el).not.toBeNull();
  expect(el!.textContent).toContain(`.${OUTPUT_CLASS} {`);
  expect(el!.textContent).toContain("--pad: 16;");
  expect(el!.textContent).toContain("--label: hi;");
  // Empty set clears the declarations.
  cssRegistry.setVars({});
  expect(el!.textContent).toBe("");
});

test("root selectors are replaced by the output scope, not nested under it", () => {
  cssRegistry.set("a", ":root { --bg: red } .card { color: blue }");
  const rules = [
    ...(styleFor("a")!.sheet!.cssRules as unknown as CSSStyleRule[]),
  ].map((r) => r.selectorText);
  // `:root` → `.telestrator-output` (so the var lands on the container), and
  // `.card` → `.telestrator-output .card`.
  expect(rules).toContain(`.${OUTPUT_CLASS}`);
  expect(rules.join(" ")).toContain(`.${OUTPUT_CLASS} .card`);
});
