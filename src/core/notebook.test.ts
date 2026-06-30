import { expect, test } from "vitest";
import { createNotebook, serialize, deserialize } from "./notebook";

test("notebook round-trips through JSON", () => {
  const doc = createNotebook("Test");
  expect(serialize(deserialize(serialize(doc)))).toBe(serialize(doc));
});
