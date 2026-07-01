import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { ValueRefView } from "./ValueRefView";

// An inline `$`-value reference in prose — the "live value in the sentence". A
// single inline atom holding the `$` key it points at (`name`); the NodeView
// renders the key + its current value and draws the trace on hover. The first
// INLINE node in the schema; everything else (code/input/chart/check) is a block
// atom. Attrs round-trip through ProseMirror/Yjs via `data-*`, so it persists and
// collaborates for free — same pattern as inputCellNode.
export const VALUE_REF_NODE = "valueRef";

export interface ValueRefAttributes {
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
      name: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-name") ?? "",
        renderHTML: (attrs) => ({ "data-name": attrs.name }),
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
