import { describe, expect, test } from "vitest";
import { createEngine } from "./engine";
import type { Context } from "./types";

// Re-runs are batched on a microtask; wait a macrotask to let the queue drain.
const flush = () => new Promise((r) => setTimeout(r, 0));

describe("reactive engine", () => {
  test("cells communicate through $ and dependents re-run on change", async () => {
    const engine = createEngine();
    engine.setCell("a", ($: Context) => {
      $.a = 2;
    });
    engine.setCell("b", ($: Context) => {
      $.b = ($.a as number) * 10;
    });

    // Initial runs are synchronous.
    expect(engine.context.b).toBe(20);

    // Editing cell A writes $.a = 5 → cell B re-runs (no reload).
    engine.setCell("a", ($: Context) => {
      $.a = 5;
    });
    await flush();
    expect(engine.context.b).toBe(50);
    expect(engine.getOutput("b")?.values).toEqual({ b: 50 });

    engine.dispose();
  });

  test("a burst of writes re-runs a dependent only once (batched)", async () => {
    const engine = createEngine();
    let runs = 0;
    engine.setCell("vals", ($: Context) => {
      $.x = 1;
      $.y = 1;
    });
    engine.setCell("reader", ($: Context) => {
      runs += 1;
      void $.x;
      void $.y;
    });
    expect(runs).toBe(1); // initial run

    engine.setCell("vals", ($: Context) => {
      $.x = 2;
      $.y = 2;
    });
    await flush();
    expect(runs).toBe(2); // both writes coalesced into one re-run

    engine.dispose();
  });

  test("onDispose runs before re-run and on removal", async () => {
    const engine = createEngine();
    let cleanups = 0;
    engine.setCell("driver", ($: Context) => {
      $.k = 0;
    });
    engine.setCell("d", ($: Context, api) => {
      void $.k;
      api.onDispose(() => {
        cleanups += 1;
      });
    });
    expect(cleanups).toBe(0);

    engine.setCell("driver", ($: Context) => {
      $.k = 1;
    });
    await flush();
    expect(cleanups).toBe(1); // cleanup fired before D re-ran

    engine.removeCell("d");
    expect(cleanups).toBe(2); // cleanup fired on removal

    engine.dispose();
  });

  test("a mutual reactive cycle is bounded and reported, not hung", async () => {
    const engine = createEngine();
    // A reads $.y and writes $.x; B reads $.x and writes $.y — an escalating
    // cross-cell cycle that would re-run forever without the loop guard.
    engine.setCell("a", ($: Context) => {
      $.x = (($.y as number) ?? 0) + 1;
    });
    engine.setCell("b", ($: Context) => {
      $.y = (($.x as number) ?? 0) + 1;
    });
    await flush();

    const error = engine.getOutput("a")?.error ?? engine.getOutput("b")?.error;
    expect(error).toMatch(/loop detected/i);

    engine.dispose();
  });

  test("removed cells stop re-running", async () => {
    const engine = createEngine();
    engine.setCell("a", ($: Context) => {
      $.a = 1;
    });
    engine.setCell("b", ($: Context) => {
      $.b = ($.a as number) + 100;
    });
    expect(engine.context.b).toBe(101);

    engine.removeCell("b");
    engine.setCell("a", ($: Context) => {
      $.a = 2;
    });
    await flush();

    expect(engine.context.b).toBe(101); // b did not re-run
    expect(engine.getOutput("b")).toBeUndefined();

    engine.dispose();
  });

  test("restart resets $ and re-runs all cells", async () => {
    const engine = createEngine();
    engine.setCell("a", ($: Context) => {
      $.a = 1;
    });
    engine.setCell("b", ($: Context) => {
      $.b = ($.a as number) + 1;
    });
    expect(engine.context.b).toBe(2);

    engine.restart();
    await flush();
    expect(engine.context.a).toBe(1);
    expect(engine.context.b).toBe(2);

    engine.dispose();
  });

  test("console output and errors are captured per cell", async () => {
    const engine = createEngine();
    engine.setCell("log", () => {
      console.log("hello", 42);
    });
    engine.setCell("boom", () => {
      throw new Error("kaboom");
    });

    expect(engine.getOutput("log")?.logs).toEqual([
      { level: "log", text: "hello 42" },
    ]);
    expect(engine.getOutput("boom")?.error).toMatch(/kaboom/);

    engine.dispose();
  });

  test("a cell reports the $ keys it reads (its dependencies) and writes", () => {
    const engine = createEngine();
    engine.setCell("src", ($: Context) => {
      $.a = 2;
      $.k = 3;
    });
    engine.setCell("derived", ($: Context) => {
      $.b = ($.a as number) + ($.k as number);
    });

    const out = engine.getOutput("derived");
    expect(out?.values).toEqual({ b: 5 });
    expect(new Set(out?.reads)).toEqual(new Set(["a", "k"]));
    // A pure producer records no reads.
    expect(engine.getOutput("src")?.reads).toEqual([]);

    engine.dispose();
  });

  test("reads are recomputed each run (stale dependencies drop off)", async () => {
    const engine = createEngine();
    engine.setCell("src", ($: Context) => {
      $.a = 1;
      $.b = 1;
    });
    engine.setCell("reader", ($: Context) => {
      void $.a;
      void $.b;
    });
    expect(new Set(engine.getOutput("reader")?.reads)).toEqual(
      new Set(["a", "b"]),
    );

    // Re-register the reader to depend on `a` only — `b` should drop out.
    engine.setCell("reader", ($: Context) => {
      void $.a;
    });
    await flush();
    expect(engine.getOutput("reader")?.reads).toEqual(["a"]);

    engine.dispose();
  });
});
