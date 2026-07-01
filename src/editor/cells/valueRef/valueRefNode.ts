import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { ValueRefView } from "@/editor/cells/valueRef/ValueRefView";

// An inline `$`-value reference in prose — the "live value in the sentence". A
// single inline atom holding the `$` key it points at (`name`); the NodeView
// renders the key + its current value and draws the trace on hover. The first
// INLINE node in the schema; everything else (code/input/chart/check) is a block
// atom. Attrs round-trip through ProseMirror/Yjs via `data-*`, so it persists and
// collaborates for free — same pattern as inputCellNode.
export const VALUE_REF_NODE = "valueRef";

export interface ValueRefAttributes {
  // A `$`-expression: a plain path (`$.rate`, `$.styles.vars.gap`) or a computed
  // expression (`$.rate * $.qty`). Legacy chips stored a bare key in `name`.
  expr: string;
  // Stable id — only computed chips need one (they register a hidden runtime cell
  // keyed by it); empty for plain-path chips.
  id: string;
  // "path" (default) resolves host-side; "compute" evaluates in the sandbox.
  mode: "path" | "compute";
  // Deprecated: a bare top-level key. Read as a fallback so pre-`expr` docs still
  // resolve; new chips write `expr`.
  name: string;
}

export const ValueRef = Node.create({
  name: VALUE_REF_NODE,
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,
  // Not draggable: an inline chip reads like a word, and PM drag handles on
  // inline atoms are fiddly. Backspace still deletes it as one unit (atom).
  draggable: false,

  addAttributes() {
    return {
      expr: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-expr") ?? "",
        renderHTML: (attrs) =>
          attrs.expr ? { "data-expr": attrs.expr } : {},
      },
      id: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-id") ?? "",
        renderHTML: (attrs) => (attrs.id ? { "data-id": attrs.id } : {}),
      },
      mode: {
        default: "path",
        parseHTML: (element) =>
          element.getAttribute("data-mode") === "compute"
            ? "compute"
            : "path",
        renderHTML: (attrs) =>
          attrs.mode === "compute" ? { "data-mode": "compute" } : {},
      },
      name: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-name") ?? "",
        renderHTML: (attrs) =>
          attrs.name ? { "data-name": attrs.name } : {},
      },
    };
  },

  parseHTML() {
    return [{ tag: "span[data-value-ref]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes({ "data-value-ref": "" }, HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ValueRefView);
  },
});
