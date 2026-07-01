import { useEffect, useRef } from "react";
import { Compartment, EditorState, Prec } from "@codemirror/state";
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
  HighlightStyle,
  indentOnInput,
  syntaxHighlighting,
} from "@codemirror/language";
import { tags as t } from "@lezer/highlight";
import { javascript } from "@codemirror/lang-javascript";
import { css } from "@codemirror/lang-css";

type CellLanguage = "typescript" | "css";

const isDark = () => document.documentElement.classList.contains("dark");

// Light keeps CodeMirror's defaultHighlightStyle (reads well on the near-white
// cell). Dark needs its own palette — the light style washes out on the
// near-black cell. Rather than collapse most tokens to the default text color,
// spread them across the Radix hues already imported for the design system so
// each category is distinguishable: two purples separate declarations from
// control flow, blue for functions, teal for types, amber for numbers, gold for
// properties, green for strings, jade for regex/escapes, red for invalid, with
// muted olive for plain identifiers / operators / comments.
const darkHighlightStyle = HighlightStyle.define([
  // Declarations (const/let/function/class/import) vs. control flow
  // (if/return/await, typeof) — two related purples.
  {
    tag: [t.keyword, t.definitionKeyword, t.moduleKeyword],
    color: "var(--violet-11)",
  },
  { tag: [t.controlKeyword, t.operatorKeyword], color: "var(--plum-11)" },
  // Functions & method calls.
  {
    tag: [t.function(t.variableName), t.function(t.propertyName), t.labelName],
    color: "var(--indigo-11)",
  },
  // Types, classes, annotations.
  {
    tag: [t.typeName, t.className, t.namespace, t.annotation],
    color: "var(--cyan-11)",
  },
  // Numbers, booleans, constants, this/super.
  {
    tag: [
      t.number,
      t.bool,
      t.atom,
      t.constant(t.variableName),
      t.special(t.variableName),
    ],
    color: "var(--amber-11)",
  },
  // Property / attribute names (member access, object keys) — warm gold, our
  // "value" hue, so `$.rate`-style access reads as data.
  { tag: [t.propertyName, t.attributeName], color: "var(--gold-11)" },
  // Strings.
  {
    tag: [t.string, t.special(t.string), t.inserted],
    color: "var(--lime-11)",
  },
  // Regex & escapes.
  { tag: [t.regexp, t.escape], color: "var(--jade-11)" },
  // Errors / removed.
  { tag: [t.invalid, t.deleted], color: "var(--tomato-11)" },
  // Plain identifiers = base text.
  {
    tag: [t.variableName, t.definition(t.variableName)],
    color: "var(--olive-12)",
  },
  // Structural punctuation — muted so the colored tokens carry the eye.
  {
    tag: [
      t.operator,
      t.punctuation,
      t.separator,
      t.bracket,
      t.brace,
      t.paren,
      t.squareBracket,
    ],
    color: "var(--olive-11)",
  },
  // Comments & meta.
  {
    tag: [t.comment, t.lineComment, t.blockComment, t.meta],
    color: "var(--olive-10)",
    fontStyle: "italic",
  },
  { tag: t.strong, fontWeight: "bold" },
  { tag: t.emphasis, fontStyle: "italic" },
]);

const highlightFor = (dark: boolean) =>
  syntaxHighlighting(dark ? darkHighlightStyle : defaultHighlightStyle);

const languageExtension = (language: CellLanguage) =>
  // TS cells can return JSX (React output), so parse TSX — otherwise `<div>` reads
  // as a syntax error and highlighting breaks.
  language === "css" ? css() : javascript({ typescript: true, jsx: true });

// The cell editor's look — the CodeMirror-idiomatic home for what used to live in
// editor.css as `.code-cell__cm .cm-*` rules (you can't put Tailwind classes on
// CM's internal DOM). Transparent surface so the cell shell shows through, mono
// type, a quiet gutter, and the design-language violet cursor/selection. Colors
// reference the Radix tokens in src/index.css.
const cellTheme = EditorView.theme({
  "&": {
    color: "var(--olive-12)",
    backgroundColor: "transparent",
    maxHeight: "360px",
  },
  "&.cm-focused": { outline: "none" },
  ".cm-scroller": {
    fontFamily: "var(--font-mono)",
    fontSize: "13px",
    lineHeight: "1.65",
  },
  ".cm-gutters": {
    backgroundColor: "transparent",
    borderRight: "1px solid var(--color-border-subtle)",
    color: "var(--color-text-faint)",
  },
  ".cm-cursor, .cm-dropCursor": { borderLeftColor: "var(--violet-11)" },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection":
    {
      backgroundColor: "var(--color-accent-a5)",
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
  autoFocus,
  onChange,
  onArrowOut,
  onDeleteEmpty,
  onEscape,
  onRun,
}: {
  value: string;
  language: CellLanguage;
  // Focus the editor on mount (set for a freshly inserted cell).
  autoFocus?: boolean;
  onChange: (code: string) => void;
  // Escape affordances so the cursor flows between the code island and prose.
  onArrowOut?: (dir: "up" | "down") => void;
  onDeleteEmpty?: () => void;
  onEscape?: () => void;
  onRun?: () => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const langCompartment = useRef(new Compartment());
  const highlightCompartment = useRef(new Compartment());
  // Keep the latest callbacks without recreating the editor.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const cbRef = useRef({ onArrowOut, onDeleteEmpty, onEscape, onRun });
  cbRef.current = { onArrowOut, onDeleteEmpty, onEscape, onRun };
  // Read once at mount via a ref so toggling it later never recreates the view.
  const autoFocusRef = useRef(autoFocus);

  // Create the EditorView once.
  useEffect(() => {
    if (!host.current) return;
    const view = new EditorView({
      parent: host.current,
      state: EditorState.create({
        doc: value,
        extensions: [
          // Escape keys take precedence over CodeMirror defaults; each consumes
          // only when it acts (at a boundary), else falls through to CM.
          Prec.highest(
            keymap.of([
              {
                key: "ArrowUp",
                run: (v) => {
                  const f = cbRef.current.onArrowOut;
                  const onFirst =
                    v.state.doc.lineAt(v.state.selection.main.head).number ===
                    1;
                  if (f && onFirst) {
                    f("up");
                    return true;
                  }
                  return false;
                },
              },
              {
                key: "ArrowDown",
                run: (v) => {
                  const f = cbRef.current.onArrowOut;
                  const onLast =
                    v.state.doc.lineAt(v.state.selection.main.head).number ===
                    v.state.doc.lines;
                  if (f && onLast) {
                    f("down");
                    return true;
                  }
                  return false;
                },
              },
              {
                key: "Backspace",
                run: (v) => {
                  const f = cbRef.current.onDeleteEmpty;
                  if (f && v.state.doc.length === 0) {
                    f();
                    return true;
                  }
                  return false;
                },
              },
              {
                key: "Mod-Enter",
                run: () => {
                  cbRef.current.onRun?.();
                  return true;
                },
              },
              {
                key: "Escape",
                run: () => {
                  cbRef.current.onEscape?.();
                  return true;
                },
              },
            ]),
          ),
          lineNumbers(),
          history(),
          drawSelection(),
          indentOnInput(),
          bracketMatching(),
          highlightCompartment.current.of(highlightFor(isDark())),
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
    // Move focus into the cell when it was just inserted (empty doc → cursor at
    // the start), instead of leaving it in the prose after the cell. Defer to the
    // next frame so we win over any focus-return that happens on the same tick —
    // e.g. the toolbar/slash Radix popover returning focus to its trigger on close.
    let alive = true;
    if (autoFocusRef.current) {
      requestAnimationFrame(() => {
        if (alive) view.focus();
      });
    }

    // Swap the syntax palette when the theme flips (the ThemeProvider toggles
    // `.dark` on <html>). One observer per cell; cheap and self-contained.
    let dark = isDark();
    const themeObserver = new MutationObserver(() => {
      if (isDark() === dark) return;
      dark = isDark();
      view.dispatch({
        effects: highlightCompartment.current.reconfigure(highlightFor(dark)),
      });
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      alive = false;
      themeObserver.disconnect();
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
      data-slot="cell-editor"
      ref={host}
      onMouseDown={(e) => e.stopPropagation()}
    />
  );
}
