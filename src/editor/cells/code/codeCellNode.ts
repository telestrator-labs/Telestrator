import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { CodeCellView } from "@/editor/cells/code/CodeCellView";

// A code cell is the greenfield analog of TypeCell's executable block: a
// block-level *atom* node (its source lives in the `code` attr, not as editable
// ProseMirror content) carrying the same `id` / `language` / `code` the core
// `Cell` model uses. The NodeView (CodeCellView) is where CodeMirror/Sandpack
// will eventually live; for now it renders an inert editor.
export const CODE_CELL_NODE = "codeCell";

export interface CodeCellAttributes {
  id: string | null;
  language: "typescript" | "css";
  code: string;
}

export const CodeCell = Node.create({
  name: CODE_CELL_NODE,
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
      language: {
        default: "typescript",
        parseHTML: (element) =>
          element.getAttribute("data-language") ?? "typescript",
        renderHTML: (attrs) => ({ "data-language": attrs.language }),
      },
      code: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-code") ?? "",
        renderHTML: (attrs) => ({ "data-code": attrs.code }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-code-cell]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes({ "data-code-cell": "" }, HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CodeCellView);
  },
});
