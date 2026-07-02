import type { NotebookTemplate } from "./types";
import { codeCell, doc, inputCell, md, p, para, valueRef } from "./build";

// Consolidates the old greeting (text/select/toggle) and compound-interest
// (number) examples into one: every input kind — text, number, slider, toggle,
// select — assembles a single live, formatted computation. The "form → summary"
// use case, distinct from the simulation (rate limiting) and rendering (views)
// examples.
export const orderSummary: NotebookTemplate = {
  id: "order-summary",
  title: "Order summary",
  description:
    "Text, number, slider, toggle, and select inputs assemble a live, formatted total.",
  build: (m) =>
    doc(
      md(
        m,
        "Every kind of knob in one place — a text field, a number, a slider, a switch, and a dropdown — feeding a single reactive summary. This is the shape of most interactive docs: inputs on top, a computed result that reads back in the prose.",
      ),
      inputCell({ name: "item", kind: "text", value: "Widget" }),
      inputCell({ name: "qty", kind: "number", value: 3 }),
      inputCell({
        name: "discount",
        kind: "slider",
        value: 10,
        config: { min: 0, max: 50, step: 5 },
      }),
      inputCell({ name: "express", kind: "toggle", value: false }),
      inputCell({
        name: "currency",
        kind: "select",
        value: "$",
        config: { options: ["$", "€", "£"] },
      }),
      md(
        m,
        "Each item is $12. `$.discount` comes off the subtotal, `$.express` shipping adds a flat fee, and `$.currency` picks the symbol.",
      ),
      codeCell(
        "typescript",
        [
          "// reads $.item, $.qty, $.discount, $.express, $.currency → $.order",
          "const unit = 12;",
          "const subtotal = $.qty * unit;",
          "const discounted = subtotal * (1 - $.discount / 100);",
          "const shipping = $.express ? 15 : 0;",
          "const total = discounted + shipping;",
          "const fmt = (n: number) => `${$.currency}${n.toFixed(2)}`;",
          "$.order = {",
          "  label: `${$.qty}× ${$.item}`,",
          "  total: fmt(total),",
          "  shipping: fmt(shipping),",
          "};",
        ].join("\n"),
      ),
      p(
        "Your order — ",
        valueRef("$.order.label"),
        " — comes to ",
        valueRef("$.order.total"),
        " including ",
        valueRef("$.order.shipping"),
        " shipping.",
      ),
      md(
        m,
        "Flip express on, slide the discount, switch the currency — the sentence reassembles under your hands. Same wiring an interactive form or pricing page would use.",
      ),
      para(),
    ),
};
