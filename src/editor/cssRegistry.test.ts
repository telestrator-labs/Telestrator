import { afterEach, expect, test } from "vitest";
import { cssRegistry, OUTPUT_CLASS } from "./cssRegistry";

const styleFor = (id: string) =>
  document.head.querySelector<HTMLStyleElement>(
    `style[data-telestrator-css="${id}"]`,
  );

afterEach(() => {
  cssRegistry.remove("a");
  cssRegistry.remove("b");
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
