import { useEffect, useRef, useState } from "react";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { TextSelection } from "@tiptap/pm/state";
import type { Language } from "@/core/notebook";
import {
  useRuntime,
  useCellOutput,
  useIsLive,
} from "@/editor/reactive/RuntimeProvider";
import { cssRegistry, parseApi } from "@/editor/reactive/cssRegistry";
import { useCellTrace } from "@/editor/trace/TraceContext";
import { useReadingMode } from "@/editor/shared/ReadingMode";
import { CodeEditor } from "@/editor/cells/CodeEditor";
import { shouldFocusCell } from "@/editor/shared/pendingFocus";
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
} from "@/ui/Popover";
import { StopEditorEvents } from "@/editor/shared/StopEditorEvents";
import { cx } from "@/ui/cx";

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
  const name = (node.attrs.name as string) ?? "";
  const runnable = language === "typescript" && !!id;

  const rt = useRuntime();
  const output = useCellOutput(id ?? "");
  const trace = useCellTrace(id, output);
  // "Live" now means participating in reactivity — reads or writes a valid `$`
  // value — not merely "runnable". An empty/non-reactive TS cell reads as inert.
  const live = useIsLive(id);
  const reading = useReadingMode();
  const [showCode, setShowCode] = useState(false);
  // Edit-mode collapse: the source (header + editor) and the output can each be
  // folded away. Collapsing the source leaves the output as the expand trigger.
  const [sourceOpen, setSourceOpen] = useState(true);
  const [outputOpen, setOutputOpen] = useState(true);

  // Register / update this cell (debounced). TS cells run in the runtime; css
  // cells apply as a scoped stylesheet (cssRegistry); each path clears the other
  // so switching a cell's language leaves no stale registration. Re-runs on code
  // or language change.
  useEffect(() => {
    if (!id) return;
    if (language === "css") {
      const timer = setTimeout(() => {
        cssRegistry.set(id, code); // inject scoped styles
        const key = name.trim();
        if (key) {
          // Named css cell: also publish its classes/vars to `$[key]` so cells
          // can reference `styles.card` / `styles.vars.gap`.
          const { classes, vars } = parseApi(code);
          const api = { ...classes, vars };
          rt.update(id, `$[${JSON.stringify(key)}] = ${JSON.stringify(api)};`);
        } else {
          rt.remove(id); // styles only
        }
      }, REGISTER_DEBOUNCE_MS);
      return () => clearTimeout(timer);
    }
    if (language === "typescript") {
      cssRegistry.remove(id); // drop any prior stylesheet
      const timer = setTimeout(() => rt.update(id, code), REGISTER_DEBOUNCE_MS);
      return () => clearTimeout(timer);
    }
    rt.remove(id);
    cssRegistry.remove(id);
  }, [rt, id, code, language, name]);

  // Tear down both registrations when the cell is deleted.
  useEffect(() => {
    if (!id) return;
    return () => {
      rt.remove(id);
      cssRegistry.remove(id);
    };
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
      !!output.view ||
      output.logs.length > 0 ||
      Object.keys(output.values).length > 0);

  return (
    <NodeViewWrapper
      data-slot="code-cell"
      data-cellid={id ?? undefined}
      data-collapsed={cellCollapsed || undefined}
      className={cx(
        "my-[22px] overflow-hidden rounded-[11px] border border-border bg-surface shadow-[0_1px_2px_rgb(0_0_0/0.04),0_4px_16px_rgb(0_0_0/0.03)]",
        trace.className,
      )}
      {...trace.hoverProps}
      contentEditable={false}
    >
      {!reading && sourceOpen && (
        <div
          data-slot="cell-header"
          className="flex items-center gap-2.5 border-b border-border-subtle px-3 py-2 font-sans"
        >
          <button
            type="button"
            data-slot="cell-caret"
            className="flex size-5 flex-none items-center justify-center text-text-faint hover:text-text-muted"
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
          {/* css cells can bind their classes/vars to `$name` (first-class CSS
              values). Empty = styles only. */}
          {language === "css" && (
            <StopEditorEvents>
              <label
                className="inline-flex items-center gap-1 rounded-md border border-border bg-surface-raised pl-2 pr-1 font-mono text-[11px] text-text-muted focus-within:border-brand-8"
                title="Publish this cell's classes/vars to a $ value"
              >
                <span className="text-gold-11">$</span>
                <input
                  aria-label="bound $ key"
                  value={name}
                  placeholder="styles"
                  onChange={(e) => updateAttributes({ name: e.target.value })}
                  className="w-20 bg-transparent py-1 font-mono text-[11px] text-text outline-none placeholder:text-text-faint"
                />
              </label>
            </StopEditorEvents>
          )}
          {runnable && (
            <button
              type="button"
              data-slot="cell-run"
              title="Re-run cell"
              onClick={runNow}
              className="flex size-6 items-center justify-center rounded-md bg-action text-brand-contrast transition-colors hover:bg-action-hover"
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
          {live ? (
            <span
              data-slot="cell-live"
              className="ml-auto inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.04em] text-live-text"
            >
              <i className="size-2 flex-none rounded-full bg-live shadow-[0_0_0_2px_var(--color-live-subtle)] animate-breathe" />
              LIVE
            </span>
          ) : (
            <span
              data-slot="cell-badge"
              className="ml-auto text-[11px] text-text-faint"
            >
              inert
            </span>
          )}
          <CellMenu onDelete={deleteSelf} />
        </div>
      )}
      {/* Edit-mode collapsed cell: a slim trigger; the output below stands in
          as the preview. Click to expand the source back. */}
      {cellCollapsed && (
        <button
          type="button"
          data-slot="cell-expand"
          title="Expand cell"
          onClick={() => setSourceOpen(true)}
          className="flex w-full items-center gap-1.5 px-3 py-2 text-left text-text-muted hover:bg-surface-sunken"
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
          autoFocus={id ? shouldFocusCell(id) : false}
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
          data-slot="cell-reveal"
          onClick={() => setShowCode((s) => !s)}
          className="border-t border-border-subtle px-3.5 py-2 font-sans text-[11.5px] font-medium text-action-text"
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
          data-slot="cell-output-reveal"
          onClick={() => setOutputOpen(true)}
          className="flex w-full items-center gap-1.5 border-t border-border-subtle px-3 py-1.5 font-mono text-[11.5px] text-text-faint hover:text-text-muted"
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
    output.error ||
    output.view ||
    output.logs.length > 0 ||
    valueKeys.length > 0;
  if (!hasAnything) return null;

  // An error replaces the output well with a plain-language band, not a raw
  // stack dump (the telestrator points at the problem).
  if (output.error) {
    return (
      <div
        data-slot="cell-error"
        className="relative flex items-start gap-[11px] border-t border-danger-border bg-danger-bg px-4 py-3.5 font-sans text-[13.5px] leading-[1.55] text-text"
      >
        <OutputCaret onCollapse={onCollapse} />
        <span
          data-slot="cell-error-icon"
          className="flex size-[21px] flex-none items-center justify-center rounded-md bg-danger font-bold text-white"
        >
          !
        </span>
        <div>
          This cell couldn’t run.{" "}
          <span
            data-slot="cell-error-msg"
            className="whitespace-pre-wrap font-mono text-[12.5px] text-danger-text"
          >
            {output.error}
          </span>
        </div>
      </div>
    );
  }

  const hasData = output.logs.length > 0 || valueKeys.length > 0;

  return (
    <div
      data-slot="cell-output-group"
      className="relative border-t border-border"
    >
      <OutputCaret onCollapse={onCollapse} />
      {/* The rendered DOM view (the cell's main export), mounted from the sandbox
          into the `.telestrator-output` container — css cells style its contents. */}
      {output.view && <ViewMount id={output.id} runKey={output} />}
      {hasData && (
        <div
          data-slot="cell-output"
          className={cx(
            "flex flex-col gap-1.5 bg-surface-raised px-4 py-[11px] font-mono text-[12.5px]",
            output.view && "border-t border-border",
          )}
        >
          {output.logs.map((log, i) => (
            <div
              key={i}
              data-slot="cell-log"
              className={cx(
                "whitespace-pre-wrap text-text-muted",
                log.level === "warn" && "text-value",
                log.level === "error" && "text-danger-text",
              )}
            >
              {log.text}
            </div>
          ))}
          {valueKeys.length > 0 && (
            <div
              data-slot="cell-values"
              className="flex flex-wrap items-center gap-x-2 gap-y-1.5 font-mono"
            >
              <span data-slot="cell-ok" className="font-bold text-live-text">
                ✓
              </span>
              {valueKeys.map((k) => (
                <span
                  key={k}
                  data-slot="cell-value"
                  className="inline-flex items-baseline gap-[5px] rounded bg-value-bg px-[7px] py-px text-value shadow-[inset_0_-2px_0_var(--color-gold-a6)]"
                >
                  <span className="font-semibold">${k}</span>
                  <span className="text-text">
                    {formatValue(output.values[k])}
                  </span>
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Mounts the cell's live DOM view (produced in the sandbox) into a host
// `.telestrator-output` container. Re-mounts when the cell re-runs (`runKey`
// changes → the sandbox has a fresh node); unmounts on teardown.
function ViewMount({ id, runKey }: { id: string; runKey: unknown }) {
  const rt = useRuntime();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    rt.mountView(id, el);
    return () => rt.unmountView(el);
  }, [rt, id, runKey]);
  return (
    <div
      ref={ref}
      data-slot="cell-view"
      className="telestrator-output bg-surface-raised px-4 py-3 font-sans text-text"
    />
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
