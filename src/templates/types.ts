import type { JSONContent } from "@tiptap/core";
import type { MarkdownManager } from "@tiptap/markdown";

// A template is a *function* that produces a Tiptap document, not a static
// constant — each instantiation must mint fresh cell ids (see build.ts). It is
// authored as Tiptap JSONContent rather than a core `NotebookDocument` because
// input cells live only in the editor layer (the core model + bridge export
// handle markdown/code cells, not inputs). Templates seed straight through
// `editor.commands.setContent`.
export interface NotebookTemplate {
  id: string; // stable key, e.g. "rate-limiting"
  title: string; // becomes the notebook title
  description: string; // card copy
  build(markdown: MarkdownManager): JSONContent; // { type: "doc", content: [...] }
}
