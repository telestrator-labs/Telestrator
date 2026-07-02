import type { NotebookTemplate } from "./types";
import { codeCell, doc, inputCell, md, p, para, valueRef } from "./build";

// Demonstrates rich cell output: a css cell whose classes/vars are first-class
// `$` values, a vanilla-DOM view, and a live React (JSX) view with hooks — all
// styled by the same css cell and driven by two inputs (a label and a size).
export const reactViews: NotebookTemplate = {
  id: "react-views",
  title: "Views: DOM, React & CSS",
  description:
    "Cells that render — a styled DOM node, a live React component, and a css cell whose classes are $ values.",
  build: (m) =>
    doc(
      md(
        m,
        "# Cells that render\n\nA cell's output isn't only numbers — it can be a **DOM node** or a **React component**. And a **css cell** styles that output; name it and its classes/vars become `$` values you reference from code.",
      ),

      md(m, "## The stylesheet, as a value"),
      md(
        m,
        "This css cell is named `styles`, so it publishes `$.styles`: `styles.card` is the class name, `styles.vars.*` are its variables. Edit a color and everything below re-renders.",
      ),
      codeCell(
        "css",
        [
          ":root {",
          "  --pad: 16px;",
          "  --bg: #bdee63;",
          "  --fg: #1a2e05;",
          "}",
          ".card {",
          "  display: inline-block;",
          "  padding: var(--pad);",
          "  border-radius: 12px;",
          "  background: var(--bg);",
          "  color: var(--fg);",
          "  font: 600 15px/1.3 'IBM Plex Sans', system-ui, sans-serif;",
          "}",
          ".card button {",
          "  font: inherit;",
          "  cursor: pointer;",
          "  border: 0;",
          "  border-radius: 8px;",
          "  padding: 6px 12px;",
          "  background: var(--fg);",
          "  color: var(--bg);",
          "}",
        ].join("\n"),
        "styles", // ← the $ name (first-class CSS values)
      ),

      md(m, "## Two knobs"),
      md(
        m,
        "A text label and a number — the views below read both. Change either and every rendered cell updates in place; nothing re-mounts.",
      ),
      inputCell({ name: "label", kind: "text", value: "hello", config: {} }),
      inputCell({
        name: "pad",
        kind: "slider",
        value: 16,
        config: { min: 4, max: 40, step: 2 },
      }),
      p(
        "Right now the label is ",
        valueRef("$.label"),
        " and the padding is ",
        valueRef("$.pad"),
        "px.",
      ),

      md(m, "## A vanilla DOM view"),
      md(
        m,
        "A plain DOM node, `export default`ed. It takes its class from `styles.card` and its padding from the `$.pad` knob — real, live DOM in the page.",
      ),
      codeCell(
        "typescript",
        [
          "// reads $.label, $.pad, $.styles → a styled <div>",
          "const el = document.createElement('div');",
          "el.className = $.styles.card;",
          "el.style.padding = `${$.pad}px`;",
          "el.textContent = `label: ${$.label}`;",
          "export default el;",
        ].join("\n"),
      ),

      md(m, "## A live React view"),
      md(
        m,
        "JSX works too — a component with `useState` (clicking the button updates local state). Read `$` in the cell *body* and pass it as props, so the cell tracks the dependency and re-renders when an input changes. (Local `useState` resets on a `$`-driven re-run.)",
      ),
      codeCell(
        "typescript",
        [
          "import { useState } from 'react';",
          "",
          "function Counter({ styles, label, pad }) {",
          "  const [n, setN] = useState(0);",
          "  return (",
          "    <div className={styles.card} style={{ padding: pad }}>",
          "      <div>label: {label}</div>",
          "      <button onClick={() => setN(n + 1)}>clicked {n}×</button>",
          "    </div>",
          "  );",
          "}",
          "",
          "// read $ here (in the body) so the cell is reactive to the inputs",
          "export default (",
          "  <Counter styles={$.styles} label={$.label} pad={$.pad} />",
          ");",
        ].join("\n"),
      ),

      md(
        m,
        "Same `$.styles` styles both; the two knobs above flow into both views. Output is now a first-class thing — data, DOM, or React.",
      ),
      para(),
    ),
};
