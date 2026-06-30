import type { NotebookTemplate } from "./types";
import { codeCell, doc, inputCell, md, para } from "./build";

// The mockup's hero explorable: two sliders drive a token-bucket simulation.
export const rateLimiting: NotebookTemplate = {
  id: "rate-limiting",
  title: "Rate limiting, by feel",
  description:
    "Two sliders drive a token-bucket simulation — watch loss climb as you turn the dials.",
  build: (m) =>
    doc(
      md(
        m,
        "# Rate limiting, by feel\n\nA rate limiter decides which requests get through and which get dropped. The usual explanation is a diagram and a paragraph. Here you set the dials — drag a slider and the numbers below update under your hands.",
      ),
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
        config: { min: 0, max: 200, step: 1 },
      }),
      md(
        m,
        "Each window, `$.rate` requests are served and the queue can buffer up to `$.capacity` more. Anything past that overflows and is dropped.",
      ),
      codeCell(
        "typescript",
        [
          "// reads $.rate, $.capacity → writes $.result",
          "const window = 60;",
          "const incoming = Math.round($.rate * window * 1.5); // bursty: 50% over budget",
          "const served = Math.min(incoming, $.rate * window + $.capacity);",
          "const dropped = Math.max(0, incoming - served);",
          "$.result = {",
          "  served: Math.round(served),",
          "  dropped: Math.round(dropped),",
          "  lossPct: incoming ? Math.round((dropped / incoming) * 100) : 0,",
          "};",
        ].join("\n"),
      ),
      md(
        m,
        "Push the rate down and watch loss climb. Widen the capacity and the same bursts get absorbed — the bucket has somewhere to put them.",
      ),
      para(),
    ),
};
