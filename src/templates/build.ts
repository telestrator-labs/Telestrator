import type { JSONContent } from "@tiptap/core";
import type { MarkdownManager } from "@tiptap/markdown";
import { generateId, type Language } from "../core/notebook";
import { CODE_CELL_NODE } from "../editor/codeCellNode";
import { INPUT_CELL_NODE, type InputCellConfig } from "../editor/inputCellNode";
import type { InputKind } from "../editor/binding";

// Authoring helpers for templates. Cell ids are minted *here*, inside the
// builder call, so two notebooks made from one template never share ids (which
// would collide in Yjs and the runtime).

type CodeLanguage = Exclude<Language, "markdown">;

// Prose authored as markdown, parsed to ProseMirror nodes at build time (the
// MarkdownManager is in hand at the seed site). Returns the block run.
export function md(markdown: MarkdownManager, src: string): JSONContent[] {
  return markdown.parse(src).content ?? [];
}

export function codeCell(language: CodeLanguage, code: string): JSONContent {
  return { type: CODE_CELL_NODE, attrs: { id: generateId(), language, code } };
}

export function inputCell(opts: {
  name: string;
  kind: InputKind;
  value: unknown;
  config?: InputCellConfig;
}): JSONContent {
  return {
    type: INPUT_CELL_NODE,
    attrs: {
      id: generateId(),
      name: opts.name,
      kind: opts.kind,
      value: opts.value,
      // Must match inputCellNode's schema for the kind (slider: min/max/step;
      // select: options) or coerceValue silently resets the seeded value.
      config: opts.config ?? {},
    },
  };
}

export function para(): JSONContent {
  return { type: "paragraph" };
}

// Compose a doc from a mix of single nodes and block runs (md). One level of
// flatten spreads the md() arrays and keeps single nodes as-is.
export function doc(...parts: Array<JSONContent | JSONContent[]>): JSONContent {
  return { type: "doc", content: parts.flat() };
}
