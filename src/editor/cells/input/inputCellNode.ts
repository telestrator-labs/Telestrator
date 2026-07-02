import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { InputCellView } from "@/editor/cells/input/InputCellView";
import type { InputKind } from "@/editor/cells/input/binding";

// An input cell is the explorable's *knob*: a block-level atom that writes one
// `$` key (a slider/number/text/select/toggle). It mirrors codeCellNode — atom,
// selectable, draggable, attrs on `data-*` — but instead of holding source it
// holds the bound key + value, and the NodeView generates the assignment cell.
export const INPUT_CELL_NODE = "inputCell";

// Per-kind config persisted as JSON in `data-config` (slider min/max/step,
// select options, an optional label).
export interface InputCellConfig {
  // A slider bound is a literal number OR a `$`-reference (e.g. `$.capacity`)
  // resolved against the live graph, so bounds/step can be driven by another
  // value. Non-slider kinds ignore these.
  min?: number | string;
  max?: number | string;
  step?: number | string;
  options?: string[];
  // Raw, comma-separated text the author typed for `options`. Kept as the
  // select field's source of truth so separators survive keystrokes/re-renders;
  // `options` is the parsed array used by the control + binding.
  optionsText?: string;
  label?: string;
}

export interface InputCellAttributes {
  id: string | null;
  name: string;
  kind: InputKind;
  value: unknown;
  config: InputCellConfig;
}

// JSON attrs round-trip through ProseMirror/Yjs via `data-*`; parse defensively.
function parseJSON<T>(raw: string | null, fallback: T): T {
  if (raw == null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export const InputCell = Node.create({
  name: INPUT_CELL_NODE,
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-id"),
        renderHTML: (attrs) => (attrs.id ? { "data-id": attrs.id } : {}),
      },
      name: {
        default: "input1",
        parseHTML: (element) => element.getAttribute("data-name") ?? "input1",
        renderHTML: (attrs) => ({ "data-name": attrs.name }),
      },
      kind: {
        default: "slider",
        parseHTML: (element) =>
          (element.getAttribute("data-kind") as InputKind) ?? "slider",
        renderHTML: (attrs) => ({ "data-kind": attrs.kind }),
      },
      value: {
        default: 0,
        parseHTML: (element) =>
          parseJSON(element.getAttribute("data-value"), 0),
        renderHTML: (attrs) => ({ "data-value": JSON.stringify(attrs.value) }),
      },
      config: {
        default: { min: 0, max: 100, step: 1 } as InputCellConfig,
        parseHTML: (element) =>
          parseJSON<InputCellConfig>(element.getAttribute("data-config"), {}),
        renderHTML: (attrs) => ({
          "data-config": JSON.stringify(attrs.config),
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-input-cell]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes({ "data-input-cell": "" }, HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(InputCellView);
  },
});
