import { expect, test } from "vitest";
import { Editor } from "@tiptap/core";
import { editorExtensions } from "./extensions";
import { docToNotebook, notebookToDocJSON } from "./bridge";
import {
  createCell,
  createNotebook,
  type NotebookDocument,
} from "../core/notebook";

// A headless editor only to obtain a real, schema-aware MarkdownManager. We
// never load content into it, so no code-cell NodeView is ever rendered.
function makeMarkdownManager() {
  const editor = new Editor({ extensions: editorExtensions });
  return {
    manager: editor.storage.markdown.manager,
    destroy: () => editor.destroy(),
  };
}

test("notebook round-trips through the editor bridge", () => {
  const { manager, destroy } = makeMarkdownManager();
  try {
    const notebook: NotebookDocument = {
      ...createNotebook("Round trip"),
      cells: [
        createCell("markdown", "# Title\n\nSome **bold** prose."),
        createCell("typescript", "export const x = 1;"),
        createCell("css", "body { color: red; }"),
      ],
    };

    const docJSON = notebookToDocJSON(manager, notebook);
    const result = docToNotebook(manager, docJSON, notebook);

    // Code cells survive exactly — id, language, and code are all preserved.
    const codeCells = result.cells.filter(
      (cell) => cell.language !== "markdown",
    );
    expect(codeCells).toEqual([
      {
        id: notebook.cells[1].id,
        language: "typescript",
        code: "export const x = 1;",
      },
      {
        id: notebook.cells[2].id,
        language: "css",
        code: "body { color: red; }",
      },
    ]);

    // Prose round-trips by content (markdown-cell ids are regenerated each save).
    const prose =
      result.cells.find((cell) => cell.language === "markdown")?.code ?? "";
    expect(prose).toContain("# Title");
    expect(prose).toContain("**bold**");

    // Identity (id/title) is carried through unchanged.
    expect(result.id).toBe(notebook.id);
    expect(result.title).toBe(notebook.title);
  } finally {
    destroy();
  }
});

test("editor-only atoms (input/knowledge-check/chart) are dropped, prose survives", () => {
  const { manager, destroy } = makeMarkdownManager();
  try {
    const docJSON = {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "Before." }] },
        {
          type: "knowledgeCheck",
          attrs: {
            id: "kc1",
            name: "q1",
            question: "Secret question?",
            answerKind: "choice",
            value: "",
            config: { options: ["a", "b"], correctChoice: 0 },
          },
        },
        {
          type: "chart",
          attrs: {
            id: "ch1",
            chartType: "area",
            expression: "$.secretSeries",
            index: "x",
            categories: ["y"],
            config: {},
          },
        },
        { type: "paragraph", content: [{ type: "text", text: "After." }] },
      ],
    };

    const result = docToNotebook(manager, docJSON, createNotebook("x"));

    // The atoms never become cells and never leak into the prose stream.
    expect(result.cells.every((c) => c.language === "markdown")).toBe(true);
    const prose = result.cells.map((c) => c.code).join("\n");
    expect(prose).toContain("Before.");
    expect(prose).toContain("After.");
    expect(prose).not.toContain("Secret question?");
    expect(prose).not.toContain("secretSeries");
  } finally {
    destroy();
  }
});

test("inline $-value chips serialize to $.name text in the prose stream", () => {
  const { manager, destroy } = makeMarkdownManager();
  try {
    const docJSON = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "The limiter drains " },
            { type: "valueRef", attrs: { name: "rate" } },
            { type: "text", text: " per tick." },
          ],
        },
      ],
    };

    const result = docToNotebook(manager, docJSON, createNotebook("x"));
    const prose = result.cells.map((c) => c.code).join("\n");

    // The chip degrades to its reference text; the sentence stays intact.
    expect(prose).toContain("The limiter drains $.rate per tick.");
  } finally {
    destroy();
  }
});
