import type { JSONContent } from "@tiptap/core";
import type { MarkdownManager } from "@tiptap/markdown";
import {
  createCell,
  type Cell,
  type Language,
  type NotebookDocument,
} from "../core/notebook";
import { CODE_CELL_NODE } from "@/editor/cells/code/codeCellNode";
import { INPUT_CELL_NODE } from "@/editor/cells/input/inputCellNode";
import { KNOWLEDGE_CHECK_NODE } from "@/editor/cells/check/knowledgeCheckNode";
import { CHART_NODE } from "@/editor/cells/chart/chartNode";
import { VALUE_REF_NODE } from "@/editor/cells/valueRef/valueRefNode";

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
    // Inline `$`-chips live inside paragraphs, so they reach markdown.serialize
    // (unlike the block atoms, which are dropped above). The markdown serializer
    // has no rule for them, so collapse each to its `$.name` text first — the
    // reference degrades to plain text in the export/core stream.
    const content = proseRun.map(valueRefsToText);
    const source = markdown.serialize({ type: "doc", content }).trim();
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
    } else if (
      node.type === INPUT_CELL_NODE ||
      node.type === KNOWLEDGE_CHECK_NODE ||
      node.type === CHART_NODE
    ) {
      // Editor-only atoms (input cells, knowledge checks, charts) aren't part of
      // the core cell model / export path yet (M8); flush prose and skip so they
      // never reach markdown.serialize (which would mangle the prose stream).
      flushProse();
    } else {
      proseRun.push(node);
    }
  }
  flushProse();

  return { id: base.id, title: base.title, cells };
}

// Recursively replace inline `valueRef` nodes with their `$.name` text so a
// paragraph containing chips serializes cleanly to markdown.
function valueRefsToText(node: JSONContent): JSONContent {
  if (node.type === VALUE_REF_NODE) {
    const expr = ((node.attrs?.expr as string) ?? "").trim();
    // Fall back to the legacy bare-key `name` attr for pre-`expr` docs.
    const name = (node.attrs?.name as string) ?? "";
    const text = expr || (name ? `$.${name}` : "$");
    return { type: "text", text };
  }
  if (node.content) {
    return { ...node, content: node.content.map(valueRefsToText) };
  }
  return node;
}
