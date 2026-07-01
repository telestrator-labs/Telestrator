import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import { CodeCell } from "@/editor/cells/code/codeCellNode";
import { InputCell } from "@/editor/cells/input/inputCellNode";
import { KnowledgeCheck } from "@/editor/cells/check/knowledgeCheckNode";
import { Chart } from "@/editor/cells/chart/chartNode";
import { ValueRef } from "@/editor/cells/valueRef/valueRefNode";
import { SlashCommand } from "@/editor/commands/slashCommand";
import { ValueRefSuggestion } from "@/editor/cells/valueRef/valueRefSuggestion";
import { AddBlock } from "@/editor/commands/addBlock";
import { CodeSignal } from "@/editor/codeSignal";

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
//   - ValueRef:   an inline `$`-value reference chip in prose (live value)
//   - SlashCommand: `/` menu to insert blocks/cells at the cursor
//   - ValueRefSuggestion: `$` autocomplete to drop a value chip inline
//   - CodeSignal: tints inline `code` gold when it references a `$` value
export const editorExtensions = [
  StarterKit.configure({ undoRedo: false }),
  Markdown,
  CodeCell,
  InputCell,
  KnowledgeCheck,
  Chart,
  ValueRef,
  SlashCommand,
  ValueRefSuggestion,
  AddBlock,
  CodeSignal,
];
