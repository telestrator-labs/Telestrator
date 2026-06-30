import { expect, test } from "vitest";
import { bindingCode } from "./binding";

test("bindingCode generates a $-assignment for each input kind", () => {
  // slider / number → numeric literal
  expect(bindingCode("slider", "rate", 12)).toBe('$["rate"] = 12');
  expect(bindingCode("number", "count", "7")).toBe('$["count"] = 7');
  // text / select → JSON string literal
  expect(bindingCode("text", "label", "hi")).toBe('$["label"] = "hi"');
  expect(bindingCode("select", "mode", "fast")).toBe('$["mode"] = "fast"');
  // toggle → boolean literal
  expect(bindingCode("toggle", "on", true)).toBe('$["on"] = true');
  expect(bindingCode("toggle", "on", false)).toBe('$["on"] = false');
});

test("bindingCode is defensive: bad numbers → 0, names are JSON-encoded", () => {
  expect(bindingCode("slider", "rate", "not a number")).toBe('$["rate"] = 0');
  // A name needing escaping stays a valid key.
  expect(bindingCode("number", 'a"b', 1)).toBe('$["a\\"b"] = 1');
});
