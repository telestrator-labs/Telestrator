import type { NotebookTemplate } from "./types";
import { codeCell, doc, inputCell, md, para } from "./build";

// Number inputs feeding a closed-form calculation — exercises the `number` kind.
export const compoundInterest: NotebookTemplate = {
  id: "compound-interest",
  title: "Compound interest",
  description:
    "Principal, rate, and years as number inputs — watch the balance grow.",
  build: (m) =>
    doc(
      md(
        m,
        "Set the inputs and the final balance recomputes. The explanation and the calculation are the same artifact.",
      ),
      inputCell({ name: "principal", kind: "number", value: 1000 }),
      inputCell({ name: "rate", kind: "number", value: 5 }),
      inputCell({ name: "years", kind: "number", value: 10 }),
      md(
        m,
        "With annual compounding the balance is `principal · (1 + rate)^years`, where `$.rate` is a percentage.",
      ),
      codeCell(
        "typescript",
        [
          "// reads $.principal, $.rate, $.years → writes $.result",
          "const r = $.rate / 100;",
          "const balance = $.principal * Math.pow(1 + r, $.years);",
          "$.result = {",
          "  balance: Math.round(balance),",
          "  interest: Math.round(balance - $.principal),",
          "};",
        ].join("\n"),
      ),
      md(
        m,
        "Nudge the rate by a point or add a few years — small changes compound into large differences.",
      ),
      para(),
    ),
};
