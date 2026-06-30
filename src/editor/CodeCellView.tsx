import { useEffect, useState } from "react";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { TextSelection } from "@tiptap/pm/state";
import type { Language } from "../core/notebook";
import { useRuntime, useCellOutput } from "./RuntimeProvider";
import { useReadingMode } from "./ReadingMode";
import { CodeEditor } from "./CodeEditor";

// The languages a code cell can hold. Markdown is prose, not a code cell, so it
// is intentionally excluded here.
const CODE_LANGUAGES: Array<Exclude<Language, "markdown">> = [
  "typescript",
  "css",
];

const REGISTER_DEBOUNCE_MS = 120;

// The React NodeView for a code cell. TypeScript cells participate in the shared
// reactive runtime; editing one re-runs any cell that reads the `$` values it
// writes. Keyboard flow lets the cursor escape the CodeMirror island into prose;
// reading mode collapses the cell to its output.
export function CodeCellView({
  node,
  updateAttributes,
  editor,
  getPos,
}: NodeViewProps) {
  const language = node.attrs.language as string;
  const code = node.attrs.code as string;
  const id = node.attrs.id as string | null;
  const runnable = language === "typescript" && !!id;

  const rt = useRuntime();
  const output = useCellOutput(id ?? "");
  const reading = useReadingMode();
  const [showCode, setShowCode] = useState(false);

  // Register / update this cell in the runtime (debounced); deregister non-TS
  // cells. Re-runs when code or language changes.
  useEffect(() => {
    if (!id) return;
    if (language !== "typescript") {
      rt.remove(id);
      return;
    }
    const timer = setTimeout(() => rt.update(id, code), REGISTER_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [rt, id, code, language]);

  // Remove from the runtime when the cell is deleted.
  useEffect(() => {
    if (!id) return;
    return () => rt.remove(id);
  }, [rt, id]);

  // Keyboard flow: move the selection out of the CodeMirror island into prose.
  // Use the raw ProseMirror view (dispatch a selection, then view.focus()) —
  // this reliably steals DOM focus back from CodeMirror, which Tiptap's
  // chain().focus() does not do synchronously from inside a CM keydown handler.
  const posOf = (): number | undefined =>
    typeof getPos === "function" ? getPos() : undefined;
  const moveOut = (dir: "up" | "down") => {
    const pos = posOf();
    if (pos == null) return;
    const view = editor.view;
    const target = dir === "up" ? pos : pos + node.nodeSize;
    const selection = TextSelection.near(
      view.state.doc.resolve(target),
      dir === "up" ? -1 : 1,
    );
    view.dispatch(view.state.tr.setSelection(selection).scrollIntoView());
    view.focus();
  };
  const deleteSelf = () => {
    const pos = posOf();
    if (pos == null) return;
    const view = editor.view;
    view.dispatch(view.state.tr.delete(pos, pos + node.nodeSize));
    view.focus();
  };
  const escapeToProse = () => moveOut("down");
  const runNow = () => {
    if (id) rt.update(id, code);
  };

  const codeHidden = reading && !showCode;

  return (
    <NodeViewWrapper className="code-cell" contentEditable={false}>
      {!reading && (
        <div className="code-cell__header">
          <select
            className="code-cell__lang"
            value={language}
            onChange={(event) =>
              updateAttributes({ language: event.target.value })
            }
          >
            {CODE_LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
          {runnable && (
            <button
              type="button"
              className="code-cell__run"
              title="Re-run cell"
              onClick={runNow}
            >
              <svg
                width="11"
                height="11"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path d="M5 3.5l7 4.5-7 4.5z" />
              </svg>
            </button>
          )}
          {runnable ? (
            <span className="code-cell__live">
              <i />
              LIVE
            </span>
          ) : (
            <span className="code-cell__badge">inert</span>
          )}
        </div>
      )}
      {!codeHidden && (
        <CodeEditor
          value={code}
          language={language === "css" ? "css" : "typescript"}
          onChange={(next) => updateAttributes({ code: next })}
          onArrowOut={moveOut}
          onDeleteEmpty={deleteSelf}
          onEscape={escapeToProse}
          onRun={runNow}
        />
      )}
      {reading && (
        <button
          type="button"
          className="code-cell__reveal"
          onClick={() => setShowCode((s) => !s)}
        >
          {showCode ? "Hide code" : "Show code"}
        </button>
      )}
      {runnable && output && <CellOutputView output={output} />}
    </NodeViewWrapper>
  );
}

function CellOutputView({
  output,
}: {
  output: NonNullable<ReturnType<typeof useCellOutput>>;
}) {
  const valueKeys = Object.keys(output.values);
  const hasAnything =
    output.error || output.logs.length > 0 || valueKeys.length > 0;
  if (!hasAnything) return null;

  // An error replaces the output well with a plain-language band, not a raw
  // stack dump (the telestrator points at the problem).
  if (output.error) {
    return (
      <div className="code-cell__error">
        <span className="code-cell__error-icon">!</span>
        <div>
          This cell couldn’t run.{" "}
          <span className="code-cell__error-msg">{output.error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="code-cell__output">
      {output.logs.map((log, i) => (
        <div key={i} className={`code-cell__log code-cell__log--${log.level}`}>
          {log.text}
        </div>
      ))}
      {valueKeys.length > 0 && (
        <div className="code-cell__values">
          <span className="code-cell__ok">✓</span>
          {valueKeys.map((k) => (
            <span key={k} className="code-cell__value">
              <span className="code-cell__value-key">${k}</span>
              <span className="code-cell__value-num">
                {formatValue(output.values[k])}
              </span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function formatValue(v: unknown): string {
  if (typeof v === "string") return JSON.stringify(v);
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}
