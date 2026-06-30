import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import { CodeCell } from "./codeCellNode";

// The single source of truth for the editor's schema. Shared by the live editor
// (NotebookEditor) and the headless bridge test so they can never drift.
//   - StarterKit: prose nodes/marks. `undoRedo: false` because the Collaboration
//     extension (added per-editor in NotebookEditor, where the Y.Doc is known)
//     provides Yjs-backed undo/redo — running both corrupts history.
//   - Markdown:   bidirectional prose <-> markdown (powers the bridge)
//   - CodeCell:   our executable-code-cell node
export const editorExtensions = [
  StarterKit.configure({ undoRedo: false }),
  Markdown,
  CodeCell,
];
