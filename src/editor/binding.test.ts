import { expect, test } from "vitest";
import { bindingCode, coerceValue } from "./binding";

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

test("coerceValue keeps the value valid for the kind/config", () => {
  // a fresh select still holding the numeric default 0 → first option
  expect(coerceValue("select", 0, { options: ["a", "b"] })).toBe("a");
  // value not among options → first option; no options → ""
  expect(coerceValue("select", "x", { options: ["a", "b"] })).toBe("a");
  expect(coerceValue("select", 0, { options: [] })).toBe("");
  // slider: non-numeric → min; out-of-range → clamped
  expect(coerceValue("slider", "hi", { min: 10, max: 20 })).toBe(10);
  expect(coerceValue("slider", 50, { min: 0, max: 20 })).toBe(20);
  expect(coerceValue("slider", 5, { min: 0, max: 20 })).toBe(5);
  // toggle / text / number
  expect(coerceValue("toggle", 1)).toBe(true);
  expect(coerceValue("text", 5)).toBe("5");
  expect(coerceValue("number", "nope")).toBe(0);
});
