import type { JSONContent } from "@tiptap/core";
import type { MarkdownManager } from "@tiptap/markdown";
import {
  createCell,
  type Cell,
  type Language,
  type NotebookDocument,
} from "../core/notebook";
import { CODE_CELL_NODE } from "./codeCellNode";

// The bridge between the editor's ProseMirror document and the framework-
// agnostic core `NotebookDocument`. The mapping (TypeCell-style):
//   - a `codeCell` node          -> one typescript/css `Cell`
//   - each maximal run of prose  -> one `markdown` `Cell` (serialized to markdown)
// The MarkdownManager (from `editor.storage.markdown.manager`) does the
// prose <-> markdown conversion; code cells never enter the markdown stream
// because runs are split at every code-cell boundary.

// Build a ProseMirror doc JSON from a notebook, for loading into the editor.
export function notebookToDocJSON(
  markdown: MarkdownManager,
  notebook: NotebookDocument,
): JSONContent {
  const content: JSONContent[] = [];

  for (const cell of notebook.cells) {
    if (cell.language === "markdown") {
      const parsed = markdown.parse(cell.code);
      if (parsed.content) content.push(...parsed.content);
    } else {
      content.push({
        type: CODE_CELL_NODE,
        attrs: { id: cell.id, language: cell.language, code: cell.code },
      });
    }
  }

  // ProseMirror requires at least one block; an empty notebook gets a paragraph.
  if (content.length === 0) content.push({ type: "paragraph" });

  return { type: "doc", content };
}

// Build a notebook from the editor's current doc JSON. `base` carries the
// stable id/title (those live outside the ProseMirror doc in M1).
export function docToNotebook(
  markdown: MarkdownManager,
  doc: JSONContent,
  base: Pick<NotebookDocument, "id" | "title">,
): NotebookDocument {
  const cells: Cell[] = [];
  let proseRun: JSONContent[] = [];

  const flushProse = () => {
    if (proseRun.length === 0) return;
    const source = markdown
      .serialize({ type: "doc", content: proseRun })
      .trim();
    if (source.length > 0) cells.push(createCell("markdown", source));
    proseRun = [];
  };

  for (const node of doc.content ?? []) {
    if (node.type === CODE_CELL_NODE) {
      flushProse();
      const attrs = node.attrs ?? {};
      const language = (attrs.language as Language) ?? "typescript";
      const code = (attrs.code as string) ?? "";
      // Reuse an existing stable id; mint one only if the node somehow lacks it.
      const id = (attrs.id as string | null) || createCell(language, code).id;
      cells.push({ id, language, code });
    } else {
      proseRun.push(node);
    }
  }
  flushProse();

  return { id: base.id, title: base.title, cells };
}
