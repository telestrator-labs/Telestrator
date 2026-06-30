import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import { CodeCell } from "./codeCellNode";

// The single source of truth for the editor's schema. Shared by the live editor
// (NotebookEditor) and the headless bridge test so they can never drift.
//   - StarterKit: the prose nodes/marks (headings, lists, bold, etc.)
//   - Markdown:   bidirectional prose <-> markdown (powers the bridge)
//   - CodeCell:   our executable-code-cell node
export const editorExtensions = [StarterKit, Markdown, CodeCell];
