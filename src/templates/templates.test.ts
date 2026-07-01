import { expect, test } from "vitest";
import { Editor, type JSONContent } from "@tiptap/core";
import { editorExtensions } from "../editor/extensions";
import { CODE_CELL_NODE } from "@/editor/cells/code/codeCellNode";
import { INPUT_CELL_NODE } from "@/editor/cells/input/inputCellNode";
import { templates } from "./index";

// A headless editor only to obtain a real, schema-aware MarkdownManager (the
// same trick bridge.test uses) so template prose parses exactly as in the app.
function makeMarkdownManager() {
  const editor = new Editor({ extensions: editorExtensions });
  return {
    manager: editor.storage.markdown.manager,
    destroy: () => editor.destroy(),
  };
}

function cellIds(doc: JSONContent): string[] {
  return (doc.content ?? [])
    .filter((n) => n.type === CODE_CELL_NODE || n.type === INPUT_CELL_NODE)
    .map((n) => n.attrs?.id as string);
}

test("every template builds a valid doc with cells", () => {
  const { manager, destroy } = makeMarkdownManager();
  try {
    for (const template of templates) {
      const doc = template.build(manager);
      expect(doc.type).toBe("doc");
      expect(Array.isArray(doc.content)).toBe(true);

      const ids = cellIds(doc);
      // Each template has at least its input cells + one reactive code cell.
      expect(ids.length).toBeGreaterThan(1);
      expect(ids.every((id) => typeof id === "string" && id.length > 0)).toBe(
        true,
      );
      // Ids are unique within a single instantiation.
      expect(new Set(ids).size).toBe(ids.length);
    }
  } finally {
    destroy();
  }
});

test("two instantiations of one template share no cell ids", () => {
  const { manager, destroy } = makeMarkdownManager();
  try {
    const template = templates[0];
    const a = cellIds(template.build(manager));
    const b = cellIds(template.build(manager));
    expect(a).toHaveLength(b.length);
    expect(a.some((id) => b.includes(id))).toBe(false);
  } finally {
    destroy();
  }
});
