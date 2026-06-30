import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import type { Language } from "../core/notebook";

// The languages a code cell can hold. Markdown is prose, not a code cell, so it
// is intentionally excluded here.
const CODE_LANGUAGES: Array<Exclude<Language, "markdown">> = [
  "typescript",
  "css",
];

// The React NodeView for a code cell. In M1 the cell is *inert*: a plain
// monospace textarea bound to the node's `code` attr, with a language selector.
// M4 swaps the textarea for CodeMirror; M2 adds execution output below it.
export function CodeCellView({ node, updateAttributes }: NodeViewProps) {
  const language = node.attrs.language as string;
  const code = node.attrs.code as string;

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
        <span className="code-cell__badge">inert · runs in M2</span>
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
    </NodeViewWrapper>
  );
}
