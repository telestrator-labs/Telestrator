import type { Editor } from "@tiptap/core";
import { createCell, generateId } from "../core/notebook";
import { requestCellFocus } from "./pendingFocus";

// Shared cell-insertion helpers so the toolbar buttons and the slash menu
// produce identical cells from one source of truth. `at` is the document
// position to insert at: `editor.state.selection.to` for the toolbar, or
// `range.from` (after the slash menu's deleteRange) for `/` insertion. A trailing
// paragraph keeps a typing target after the atom.

export function insertCodeCellAt(
  editor: Editor,
  at: number,
  language: "typescript" | "css" = "typescript",
): void {
  const cell = createCell(language, "");
  // Hand focus to the new cell's CodeMirror once its NodeView mounts, rather than
  // .focus()-ing into the trailing paragraph.
  requestCellFocus(cell.id);
  editor
    .chain()
    .insertContentAt(at, [
      { type: "codeCell", attrs: { id: cell.id, language, code: "" } },
      { type: "paragraph" },
    ])
    .run();
}

export function insertInputCellAt(editor: Editor, at: number): void {
  editor
    .chain()
    .insertContentAt(at, [
      {
        type: "inputCell",
        attrs: {
          id: generateId(),
          name: "input1",
          kind: "slider",
          value: 0,
          config: { min: 0, max: 100, step: 1 },
        },
      },
      { type: "paragraph" },
    ])
    .focus()
    .run();
}

// A graded question — starts as a two-option multiple choice (first correct) so
// it's functional the moment it lands; the author fills in the real question and
// answers via the settings gear.
export function insertKnowledgeCheckAt(editor: Editor, at: number): void {
  editor
    .chain()
    .insertContentAt(at, [
      {
        type: "knowledgeCheck",
        attrs: {
          id: generateId(),
          name: "",
          question: "",
          answerKind: "choice",
          value: "",
          config: {
            options: ["Option A", "Option B"],
            optionsText: "Option A, Option B",
            correctChoice: 0,
          },
        },
      },
      { type: "paragraph" },
    ])
    .focus()
    .run();
}
