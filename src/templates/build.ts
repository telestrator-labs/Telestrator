import type { JSONContent } from "@tiptap/core";
import type { MarkdownManager } from "@tiptap/markdown";
import { generateId, type Language } from "../core/notebook";
import { CODE_CELL_NODE } from "@/editor/cells/code/codeCellNode";
import {
  INPUT_CELL_NODE,
  type InputCellConfig,
} from "@/editor/cells/input/inputCellNode";
import { KNOWLEDGE_CHECK_NODE } from "@/editor/cells/check/knowledgeCheckNode";
import { CHART_NODE } from "@/editor/cells/chart/chartNode";
import type {
  AnswerKind,
  KnowledgeCheckConfig,
} from "@/editor/cells/check/knowledgeCheck";
import type { ChartConfig, ChartType } from "@/editor/cells/chart/chart";
import type { InputKind } from "@/editor/cells/input/binding";

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

// A graded question. `name` (optional) publishes `$[name]` + `$[name]Correct`
// for a later scoring cell. `config` carries the answer definition + feedback per
// kind (choice: options/correctChoice; number: correctNumber/tolerance; text:
// correctText/caseSensitive; plus hint/explanation).
export function knowledgeCheck(opts: {
  question: string;
  answerKind: AnswerKind;
  name?: string;
  value?: unknown;
  config?: KnowledgeCheckConfig;
}): JSONContent {
  return {
    type: KNOWLEDGE_CHECK_NODE,
    attrs: {
      id: generateId(),
      name: opts.name ?? "",
      question: opts.question,
      answerKind: opts.answerKind,
      value: opts.value ?? "",
      config: opts.config ?? {},
    },
  };
}

// A chart cell. `expression` is evaluated in the runtime (reads `$`) to a list of
// rows; `index` is the x-axis field and `categories` the value series (both
// inferred from the data when omitted).
export function chart(opts: {
  expression: string;
  chartType?: ChartType;
  index?: string;
  categories?: string[];
  config?: ChartConfig;
}): JSONContent {
  return {
    type: CHART_NODE,
    attrs: {
      id: generateId(),
      chartType: opts.chartType ?? "area",
      expression: opts.expression,
      index: opts.index ?? "",
      categories: opts.categories ?? [],
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
