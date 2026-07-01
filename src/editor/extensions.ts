import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import { CodeCell } from "./codeCellNode";
import { InputCell } from "./inputCellNode";
import { KnowledgeCheck } from "./knowledgeCheckNode";
import { Chart } from "./chartNode";
import { SlashCommand } from "./slashCommand";
import { AddBlock } from "./addBlock";

// The single source of truth for the editor's schema. Shared by the live editor
// (NotebookEditor) and the headless bridge test so they can never drift.
//   - StarterKit: prose nodes/marks. `undoRedo: false` because the Collaboration
//     extension (added per-editor in NotebookEditor, where the Y.Doc is known)
//     provides Yjs-backed undo/redo — running both corrupts history.
//   - Markdown:   bidirectional prose <-> markdown (powers the bridge)
//   - CodeCell:   our executable-code-cell node
//   - InputCell:  a `$`-bound knob (slider/number/text/select/toggle)
//   - KnowledgeCheck: a graded question that can publish its result to `$`
//   - Chart:      a viz cell that reads a `$` expression and re-renders reactively
//   - SlashCommand: `/` menu to insert blocks/cells at the cursor
export const editorExtensions = [
  StarterKit.configure({ undoRedo: false }),
  Markdown,
  CodeCell,
  InputCell,
  KnowledgeCheck,
  Chart,
  SlashCommand,
  AddBlock,
];
