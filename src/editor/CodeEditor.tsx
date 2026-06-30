import { useEffect, useRef } from "react";
import { Compartment, EditorState } from "@codemirror/state";
import {
  EditorView,
  keymap,
  lineNumbers,
  drawSelection,
} from "@codemirror/view";
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from "@codemirror/commands";
import {
  bracketMatching,
  defaultHighlightStyle,
  indentOnInput,
  syntaxHighlighting,
} from "@codemirror/language";
import { javascript } from "@codemirror/lang-javascript";
import { css } from "@codemirror/lang-css";

type CellLanguage = "typescript" | "css";

const languageExtension = (language: CellLanguage) =>
  language === "css" ? css() : javascript({ typescript: true });

// Nudge CodeMirror's selection/cursor to the design-language violet accent so
// the cell island matches the rest of the chrome. Colors reference the Radix
// tokens exposed in src/index.css. (Syntax highlighting keeps the CM default.)
const cellTheme = EditorView.theme({
  "&": { color: "var(--olive-12)" },
  ".cm-cursor, .cm-dropCursor": { borderLeftColor: "var(--violet-11)" },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection":
    {
      backgroundColor: "var(--violet-4)",
    },
  ".cm-activeLine": { backgroundColor: "transparent" },
});

// A thin CodeMirror 6 wrapper for a code cell. It owns the EditorView directly
// (created once) so it can drive language reconfiguration and keep the inner
// editor isolated from ProseMirror. The cell is an atom NodeView
// (contentEditable=false), so there is no selection bridging to do — CM is a
// self-contained island.
export function CodeEditor({
  value,
  language,
  onChange,
}: {
  value: string;
  language: CellLanguage;
  onChange: (code: string) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const langCompartment = useRef(new Compartment());
  // Keep the latest onChange without recreating the editor.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Create the EditorView once.
  useEffect(() => {
    if (!host.current) return;
    const view = new EditorView({
      parent: host.current,
      state: EditorState.create({
        doc: value,
        extensions: [
          lineNumbers(),
          history(),
          drawSelection(),
          indentOnInput(),
          bracketMatching(),
          syntaxHighlighting(defaultHighlightStyle),
          cellTheme,
          keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
          langCompartment.current.of(languageExtension(language)),
          EditorView.updateListener.of((update) => {
            if (update.docChanged)
              onChangeRef.current(update.state.doc.toString());
          }),
        ],
      }),
    });
    viewRef.current = view;
    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // External value → CM, guarded so our own edits don't loop back.
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (value !== current) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value },
      });
    }
  }, [value]);

  // Language swap without recreating the editor.
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: langCompartment.current.reconfigure(languageExtension(language)),
    });
  }, [language]);

  return (
    <div
      className="code-cell__cm"
      ref={host}
      onMouseDown={(e) => e.stopPropagation()}
    />
  );
}
