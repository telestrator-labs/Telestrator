import { lazy, Suspense, useState } from "react";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import type { Language } from "../core/notebook";

// Sandpack is heavy, so the runner is loaded only when a cell is first run.
const CellOutput = lazy(() => import("./CellOutput"));

// The languages a code cell can hold. Markdown is prose, not a code cell, so it
// is intentionally excluded here.
const CODE_LANGUAGES: Array<Exclude<Language, "markdown">> = [
  "typescript",
  "css",
];

// The React NodeView for a code cell. In M1 the cell is inert; M2 adds a Run
// button (TypeScript cells only) that mounts a Sandpack runner below the editor.
// M4 swaps the textarea for CodeMirror.
export function CodeCellView({ node, updateAttributes }: NodeViewProps) {
  const language = node.attrs.language as string;
  const code = node.attrs.code as string;
  const runnable = language === "typescript";

  // Run state is ephemeral UI — not part of the persisted cell model. `runNonce`
  // bumps on each Run so CellOutput remounts a fresh sandbox from the latest code.
  const [ran, setRan] = useState(false);
  const [runNonce, setRunNonce] = useState(0);
  const [ranCode, setRanCode] = useState("");

  const run = () => {
    setRanCode(code);
    setRan(true);
    setRunNonce((n) => n + 1);
  };

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
        {runnable ? (
          <button type="button" className="code-cell__run" onClick={run}>
            ▶ Run
          </button>
        ) : (
          <span className="code-cell__badge">inert</span>
        )}
      </div>
      <textarea
        className="code-cell__editor"
        value={code}
        spellCheck={false}
        rows={Math.max(3, code.split("\n").length)}
        placeholder={language === "css" ? "/* css */" : "// typescript"}
        onChange={(event) => updateAttributes({ code: event.target.value })}
        // Keep keystrokes/selection inside the textarea instead of letting
        // ProseMirror treat them as document edits.
        onMouseDown={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      />
      {ran && (
        <Suspense
          fallback={<div className="code-cell__loading">Loading runner…</div>}
        >
          <CellOutput code={ranCode} nonce={runNonce} />
        </Suspense>
      )}
    </NodeViewWrapper>
  );
}
