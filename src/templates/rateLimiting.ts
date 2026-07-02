import type { NotebookTemplate } from "./types";
import { chart, codeCell, doc, inputCell, md, p, para, valueRef } from "./build";

// The mockup's hero explorable: sliders drive a token-bucket simulation, with
// the live results woven into the prose and a loss-vs-rate curve below.
export const rateLimiting: NotebookTemplate = {
  id: "rate-limiting",
  title: "Rate limiting, by feel",
  description:
    "Sliders drive a token-bucket simulation — watch loss climb as you turn the dials.",
  build: (m) =>
    doc(
      md(
        m,
        "A rate limiter decides which requests get through and which get dropped. The usual explanation is a diagram and a paragraph. Here you set the dials — drag a slider and the numbers below update under your hands.",
      ),

      md(
        m,
        "A burst of traffic arrives each window. The limiter serves up to `$.rate` requests per second and buffers up to `$.capacity` more; the rest overflow and are dropped.",
      ),
      inputCell({
        name: "demand",
        kind: "slider",
        value: 1600,
        config: { min: 0, max: 4000, step: 50 },
      }),
      inputCell({
        name: "rate",
        kind: "slider",
        value: 10,
        config: { min: 0, max: 100, step: 1 },
      }),
      inputCell({
        name: "capacity",
        kind: "slider",
        value: 20,
        config: { min: 0, max: 400, step: 1 },
      }),

      codeCell(
        "typescript",
        [
          "// reads $.demand, $.rate, $.capacity → writes $.result",
          "const window = 60; // seconds",
          "const incoming = $.demand;",
          "const served = Math.min(incoming, $.rate * window + $.capacity);",
          "const dropped = Math.max(0, incoming - served);",
          "$.result = {",
          "  served: Math.round(served),",
          "  dropped: Math.round(dropped),",
          "  lossPct: incoming ? Math.round((dropped / incoming) * 100) : 0,",
          "};",
        ].join("\n"),
      ),
      p(
        "Of ",
        valueRef("$.demand"),
        " incoming requests, ",
        valueRef("$.result.served"),
        " are served and ",
        valueRef("$.result.dropped"),
        " dropped — a ",
        valueRef("$.result.lossPct"),
        "% loss.",
      ),

      md(
        m,
        "Loss isn't one number — it's a curve. This sweeps the allowed rate from 0 up, holding demand and capacity at what you set above. Drag `$.capacity` and the whole curve lifts; the cliff is where the limiter finally keeps up.",
      ),
      codeCell(
        "typescript",
        [
          "// reads $.demand, $.capacity → writes $.curve",
          "const window = 60;",
          "$.curve = Array.from({ length: 21 }, (_, i) => {",
          "  const rate = i * 5;",
          "  const served = Math.min($.demand, rate * window + $.capacity);",
          "  const lossPct = $.demand",
          "    ? Math.round((($.demand - served) / $.demand) * 100)",
          "    : 0;",
          "  return { rate, lossPct };",
          "});",
        ].join("\n"),
      ),
      chart({
        chartType: "line",
        expression: "$.curve",
        index: "rate",
        categories: ["lossPct"],
      }),

      md(
        m,
        "Push the rate down and watch loss climb. Widen the capacity and the same bursts get absorbed — the bucket has somewhere to put them.",
      ),
      para(),
    ),
};
