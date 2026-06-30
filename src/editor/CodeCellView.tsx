import { useEffect } from "react";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import type { Language } from "../core/notebook";
import { useRuntime, useCellOutput } from "./RuntimeProvider";

// The languages a code cell can hold. Markdown is prose, not a code cell, so it
// is intentionally excluded here.
const CODE_LANGUAGES: Array<Exclude<Language, "markdown">> = [
  "typescript",
  "css",
];

const REGISTER_DEBOUNCE_MS = 120;

// The React NodeView for a code cell. As of M3, TypeScript cells participate in
// the shared reactive runtime: editing one re-runs any cell that reads the `$`
// values it writes. Each cell registers its source (debounced) and shows its
// live output (the `$` keys it wrote + console + errors) below the editor.
export function CodeCellView({ node, updateAttributes }: NodeViewProps) {
  const language = node.attrs.language as string;
  const code = node.attrs.code as string;
  const id = node.attrs.id as string | null;
  const runnable = language === "typescript" && !!id;

  const rt = useRuntime();
  const output = useCellOutput(id ?? "");

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

  return (
    <NodeViewWrapper className="code-cell" contentEditable={false}>
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
        <span className="code-cell__badge">
          {runnable ? "reactive · shares $" : "inert"}
        </span>
      </div>
      <textarea
        className="code-cell__editor"
        value={code}
        spellCheck={false}
        rows={Math.max(3, code.split("\n").length)}
        placeholder={
          language === "css" ? "/* css */" : "// e.g. $.total = $.price * 2"
        }
        onChange={(event) => updateAttributes({ code: event.target.value })}
        // Keep keystrokes/selection inside the textarea instead of letting
        // ProseMirror treat them as document edits.
        onMouseDown={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      />
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

  return (
    <div className="code-cell__output">
      {output.error && <div className="code-cell__error">{output.error}</div>}
      {output.logs.map((log, i) => (
        <div key={i} className={`code-cell__log code-cell__log--${log.level}`}>
          {log.text}
        </div>
      ))}
      {valueKeys.length > 0 && (
        <div className="code-cell__values">
          {valueKeys.map((k) => (
            <span key={k} className="code-cell__value">
              <span className="code-cell__value-key">${k}</span> ={" "}
              {formatValue(output.values[k])}
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
