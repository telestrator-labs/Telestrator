import { useEffect, useState } from "react";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { TextSelection } from "@tiptap/pm/state";
import type { Language } from "../core/notebook";
import { useRuntime, useCellOutput } from "./RuntimeProvider";
import { useReadingMode } from "./ReadingMode";
import { CodeEditor } from "./CodeEditor";
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
} from "../ui/Popover";
import { StopEditorEvents } from "./StopEditorEvents";
import { cx } from "../ui/cx";

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
  // Edit-mode collapse: the source (header + editor) and the output can each be
  // folded away. Collapsing the source leaves the output as the expand trigger.
  const [sourceOpen, setSourceOpen] = useState(true);
  const [outputOpen, setOutputOpen] = useState(true);

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

  const sourceVisible = reading ? showCode : sourceOpen;
  const cellCollapsed = !reading && !sourceOpen;
  const hasOutput =
    runnable &&
    !!output &&
    (!!output.error ||
      output.logs.length > 0 ||
      Object.keys(output.values).length > 0);

  return (
    <NodeViewWrapper
      className={cx("code-cell", cellCollapsed && "code-cell--collapsed")}
      contentEditable={false}
    >
      {!reading && sourceOpen && (
        <div className="code-cell__header">
          <button
            type="button"
            className="code-cell__caret"
            title="Collapse cell"
            onClick={() => setSourceOpen(false)}
          >
            <Caret open />
          </button>
          <StopEditorEvents>
            <Popover>
              <PopoverTrigger
                aria-label="cell language"
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-raised px-2 py-1 font-mono text-[11px] text-text-muted outline-none hover:border-border-strong focus-visible:ring-2 focus-visible:ring-accent-8"
              >
                {language}
                <svg
                  className="size-3 text-text-faint"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 6l4 4 4-4" />
                </svg>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-36 p-1">
                {CODE_LANGUAGES.map((lang) => (
                  <PopoverClose asChild key={lang}>
                    <button
                      type="button"
                      onClick={() => updateAttributes({ language: lang })}
                      className={
                        "flex w-full items-center justify-between rounded px-2 py-1.5 text-left font-mono text-[12px] hover:bg-action-subtle hover:text-action-text " +
                        (lang === language ? "text-action-text" : "text-text")
                      }
                    >
                      {lang}
                      {lang === language && (
                        <svg
                          className="size-3.5"
                          viewBox="0 0 16 16"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M3.5 8.5l3 3 6-7" />
                        </svg>
                      )}
                    </button>
                  </PopoverClose>
                ))}
              </PopoverContent>
            </Popover>
          </StopEditorEvents>
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
          <CellMenu onDelete={deleteSelf} />
        </div>
      )}
      {/* Edit-mode collapsed cell: a slim trigger; the output below stands in
          as the preview. Click to expand the source back. */}
      {cellCollapsed && (
        <button
          type="button"
          className="code-cell__expand"
          title="Expand cell"
          onClick={() => setSourceOpen(true)}
        >
          <Caret />
          <span className="font-mono text-[11px] text-text-muted">
            {language}
          </span>
          {!hasOutput && (
            <span className="text-[11px] text-text-faint">· collapsed</span>
          )}
        </button>
      )}

      {sourceVisible && (
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

      {/* Output: independently collapsible in edit mode; always shown reading. */}
      {hasOutput && (reading || outputOpen) && (
        <CellOutputView
          output={output!}
          onCollapse={!reading ? () => setOutputOpen(false) : undefined}
        />
      )}
      {!reading && hasOutput && !outputOpen && (
        <button
          type="button"
          className="code-cell__output-reveal"
          onClick={() => setOutputOpen(true)}
        >
          <Caret /> output
        </button>
      )}
    </NodeViewWrapper>
  );
}

function OutputCaret({ onCollapse }: { onCollapse?: () => void }) {
  if (!onCollapse) return null;
  return (
    <button
      type="button"
      title="Collapse output"
      onClick={onCollapse}
      className="absolute right-2 top-2 flex size-5 items-center justify-center rounded text-text-faint hover:text-text-muted"
    >
      <Caret open />
    </button>
  );
}

function Caret({ open = false }: { open?: boolean }) {
  return (
    <svg
      className={cx(
        "size-3.5 transition-transform",
        open ? "rotate-0" : "-rotate-90",
      )}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 6l4 4 4-4" />
    </svg>
  );
}

// The cell overflow menu (⋯). Delete for now; reorder/duplicate can hang off the
// same menu later.
function CellMenu({ onDelete }: { onDelete: () => void }) {
  return (
    <StopEditorEvents>
      <Popover>
        <PopoverTrigger
          aria-label="Cell actions"
          className="flex size-6 items-center justify-center rounded text-text-faint outline-none hover:text-text-muted focus-visible:ring-2 focus-visible:ring-accent-8"
        >
          <svg viewBox="0 0 16 16" fill="currentColor" className="size-4">
            <circle cx="3.5" cy="8" r="1.3" />
            <circle cx="8" cy="8" r="1.3" />
            <circle cx="12.5" cy="8" r="1.3" />
          </svg>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-40 p-1">
          <PopoverClose asChild>
            <button
              type="button"
              onClick={onDelete}
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[13px] text-danger-text hover:bg-danger-bg"
            >
              <TrashIcon />
              Delete cell
            </button>
          </PopoverClose>
        </PopoverContent>
      </Popover>
    </StopEditorEvents>
  );
}

function TrashIcon() {
  return (
    <svg
      className="size-3.5"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 4.5h10M6.5 4.5V3.5a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1M5 4.5l.5 8a1 1 0 0 0 1 .9h3a1 1 0 0 0 1-.9l.5-8" />
    </svg>
  );
}

function CellOutputView({
  output,
  onCollapse,
}: {
  output: NonNullable<ReturnType<typeof useCellOutput>>;
  onCollapse?: () => void;
}) {
  const valueKeys = Object.keys(output.values);
  const hasAnything =
    output.error || output.logs.length > 0 || valueKeys.length > 0;
  if (!hasAnything) return null;

  // An error replaces the output well with a plain-language band, not a raw
  // stack dump (the telestrator points at the problem).
  if (output.error) {
    return (
      <div className="code-cell__error relative">
        <OutputCaret onCollapse={onCollapse} />
        <span className="code-cell__error-icon">!</span>
        <div>
          This cell couldn’t run.{" "}
          <span className="code-cell__error-msg">{output.error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="code-cell__output relative">
      <OutputCaret onCollapse={onCollapse} />
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
