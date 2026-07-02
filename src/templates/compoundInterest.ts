import type { NotebookTemplate } from "./types";
import { codeCell, doc, inputCell, md, p, para, valueRef } from "./build";

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
        "Set the inputs and the final balance recomputes — the explanation and the calculation are one artifact. With annual compounding the balance is `principal · (1 + rate)^years`, where `$.rate` is a percentage.",
      ),
      inputCell({ name: "principal", kind: "number", value: 1000 }),
      inputCell({ name: "rate", kind: "number", value: 5 }),
      inputCell({ name: "years", kind: "number", value: 10 }),
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
      p(
        "After ",
        valueRef("$.years"),
        " years the balance is ",
        valueRef("$.result.balance"),
        " — of which ",
        valueRef("$.result.interest"),
        " is interest.",
      ),
      md(
        m,
        "Nudge the rate by a point or add a few years — small changes compound into large differences.",
      ),
      para(),
    ),
};
