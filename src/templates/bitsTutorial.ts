import type { NotebookTemplate } from "./types";
import { codeCell, doc, inputCell, md, para } from "./build";

// A guided tutorial that shows the "knowledge check" pattern: a question, an
// input for the reader's answer, and a code cell that grades it live via
// console.log (re-runs whenever the answer changes). Exercises number + select
// inputs and reactive feedback with no persisted quiz state.
export const bitsTutorial: NotebookTemplate = {
  id: "bits-tutorial",
  title: "Counting with bits",
  description:
    "A short tutorial with knowledge checks — play with the bits, then test your understanding.",
  build: (m) =>
    doc(
      md(
        m,
        "Computers count in **bits** — each bit is a single 0-or-1 switch. Line up *n* of them and you can represent 2ⁿ distinct patterns. Drag the slider and watch how fast that grows.",
      ),
      inputCell({
        name: "bits",
        kind: "slider",
        value: 8,
        config: { min: 1, max: 16, step: 1 },
      }),
      codeCell(
        "typescript",
        ["// reads $.bits → writes $.values", "$.values = 2 ** $.bits;"].join(
          "\n",
        ),
      ),
      md(
        m,
        "Every extra bit **doubles** the range: 1 bit → 2, 2 bits → 4, and eight bits — a *byte* — → 256. Now check your understanding. Each answer is graded the moment you change it.",
      ),

      md(
        m,
        "## Knowledge check 1\n\nHow many distinct values can a single **byte** (8 bits) hold?",
      ),
      inputCell({ name: "q1", kind: "number", value: 0 }),
      codeCell(
        "typescript",
        [
          "// reads $.q1 — grades live",
          'if ($.q1 === 0) console.log("Enter your answer above.");',
          'else if ($.q1 === 256) console.log("✓ Correct — a byte holds 256 values (2^8).");',
          'else console.log("✗ Not 256. A byte is 8 bits, and 2^8 = 256.");',
        ].join("\n"),
      ),

      md(
        m,
        "## Knowledge check 2\n\nYou need to give every one of **1,000** items a unique binary code. What is the *fewest* number of bits that will do?",
      ),
      inputCell({ name: "q2", kind: "number", value: 0 }),
      codeCell(
        "typescript",
        [
          "// reads $.q2 — grades live",
          'if ($.q2 === 0) console.log("Enter your answer above.");',
          'else if ($.q2 === 10) console.log("✓ Correct — 2^9 = 512 is too few, but 2^10 = 1024 covers 1,000.");',
          'else if (2 ** $.q2 >= 1000) console.log("✗ " + $.q2 + " bits works, but it is more than you need — try fewer.");',
          'else console.log("✗ " + $.q2 + " bits only reaches " + (2 ** $.q2) + " — not enough for 1,000.");',
        ].join("\n"),
      ),

      md(
        m,
        "## Knowledge check 3\n\nAdd exactly **one** more bit to any number. The count of representable values…",
      ),
      inputCell({
        name: "q3",
        kind: "select",
        value: "— select —",
        config: {
          options: ["— select —", "doubles", "stays the same", "gets squared"],
        },
      }),
      codeCell(
        "typescript",
        [
          "// reads $.q3 — grades live",
          'if ($.q3 === "— select —") console.log("Choose an answer above.");',
          'else if ($.q3 === "doubles") console.log("✓ Right — one more bit always doubles the range.");',
          'else console.log("✗ " + $.q3 + " — not quite. Each extra bit multiplies the count by 2.");',
        ].join("\n"),
      ),

      md(
        m,
        "That is the whole trick: bits double. Eight of them make a byte (256 values); ten cover a thousand; thirty-two cover four billion.",
      ),
      para(),
    ),
};
