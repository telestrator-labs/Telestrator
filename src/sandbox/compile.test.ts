import { expect, test } from "vitest";
import { compile } from "./compile";

// Run a compiled cell body against a plain `$` (no reactive recorder needed to
// exercise the transpile layer) and return the view + the resulting `$`.
async function run(code: string) {
  const body = await compile(code);
  const $: Record<string, unknown> = {};
  const view = body($, { onDispose: () => {} });
  return { $, view };
}

test("a named export writes $ (the export sugar), not the view", async () => {
  const { $, view } = await run("export const foo = 5;");
  expect($.foo).toBe(5);
  expect(view).toBeUndefined();
});

test("export default is the view; named exports still write $", async () => {
  const { $, view } = await run("export default 42;\nexport const a = 1;");
  expect(view).toBe(42);
  expect($.a).toBe(1);
});

test("exported functions land in $ too", async () => {
  const { $ } = await run("export function greet() { return 'hi'; }");
  expect(typeof $.greet).toBe("function");
  expect(($.greet as () => string)()).toBe("hi");
});

test("only exports reach $ — locals and plain $ writes are unaffected", async () => {
  const { $ } = await run(
    "const local = 9;\n$.b = (($.a as number) ?? 0) + 1;\nexport const shown = local;",
  );
  expect($.local).toBeUndefined(); // a local is not exported
  expect($.b).toBe(1); // explicit $ write still works
  expect($.shown).toBe(9); // exported value published
});
