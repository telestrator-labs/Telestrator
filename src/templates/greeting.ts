import type { NotebookTemplate } from "./types";
import { codeCell, doc, inputCell, md, p, para, valueRef } from "./build";

// Text + select + toggle feeding one string — exercises the non-numeric kinds.
export const greeting: NotebookTemplate = {
  id: "greeting",
  title: "Greeting, composed",
  description:
    "Text, select, and toggle inputs assemble a live string — exercises every other knob.",
  build: (m) =>
    doc(
      md(
        m,
        "Three kinds of knob — a text field, a dropdown, and a switch — feed one reactive cell. `$.tone` picks the phrasing, `$.who` fills the blank, and `$.shout` decides the volume.",
      ),
      inputCell({ name: "who", kind: "text", value: "world" }),
      inputCell({
        name: "tone",
        kind: "select",
        value: "casual",
        config: { options: ["casual", "formal", "excited"] },
      }),
      inputCell({ name: "shout", kind: "toggle", value: false }),
      codeCell(
        "typescript",
        [
          "// reads $.who, $.tone, $.shout → writes $.result",
          "let s =",
          '  $.tone === "formal" ? `Greetings, ${$.who}.`',
          '  : $.tone === "excited" ? `Hey ${$.who}!! 🎉`',
          "  : `hey ${$.who}`;",
          "if ($.shout) s = s.toUpperCase();",
          "$.result = s;",
        ].join("\n"),
      ),
      p("It reads: ", valueRef("$.result")),
      md(
        m,
        "Flip any knob and the sentence reassembles — same wiring an interactive doc would use to react to a reader.",
      ),
      para(),
    ),
};
