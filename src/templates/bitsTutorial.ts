import type { NotebookTemplate } from "./types";
import { codeCell, doc, inputCell, knowledgeCheck, md, para } from "./build";

// A guided tutorial showcasing the knowledge-check block: an explorable (a bits
// slider driving 2^n) followed by three graded questions authored as single
// `knowledgeCheck` nodes, each publishing its result to `$` so the closing cell
// tallies a live score.
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
        "Every extra bit **doubles** the range: 1 bit → 2, 2 bits → 4, and eight bits — a *byte* — → 256. Now check your understanding.",
      ),

      knowledgeCheck({
        name: "q1",
        question: "How many distinct values can a single byte (8 bits) hold?",
        answerKind: "number",
        config: {
          correctNumber: 256,
          explanation: "A byte is 8 bits, and 2^8 = 256.",
          hint: "A byte is 8 bits — think 2^8.",
        },
      }),
      knowledgeCheck({
        name: "q2",
        question:
          "You need to give every one of 1,000 items a unique binary code. What is the fewest number of bits that will do?",
        answerKind: "number",
        config: {
          correctNumber: 10,
          explanation: "2^9 = 512 is too few, but 2^10 = 1024 covers 1,000.",
          hint: "2^9 = 512, 2^10 = 1024 — which is the first that reaches 1,000?",
        },
      }),
      knowledgeCheck({
        name: "q3",
        question:
          "Add exactly one more bit to any number. The count of representable values…",
        answerKind: "choice",
        config: {
          options: ["stays the same", "doubles", "gets squared"],
          optionsText: "stays the same, doubles, gets squared",
          correctChoice: 1,
          explanation: "Right — one more bit always doubles the range.",
          hint: "Each extra bit multiplies the count by 2.",
        },
      }),

      md(m, "### Your score"),
      codeCell(
        "typescript",
        [
          "// each check writes its pass boolean to $ → a live tally",
          "const got = [$.q1, $.q2, $.q3].filter(Boolean).length;",
          'console.log(got + " of 3 correct" + (got === 3 ? " — nice, you have it. 🎉" : "."));',
        ].join("\n"),
      ),

      md(
        m,
        "That is the whole trick: bits double. Eight of them make a byte (256 values); ten cover a thousand; thirty-two cover four billion.",
      ),
      para(),
    ),
};
