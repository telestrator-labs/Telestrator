import { useEffect, useRef, useState } from "react";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { useRuntime } from "./RuntimeProvider";
import { useReadingMode } from "./ReadingMode";
import {
  bindingCode,
  gradeAnswer,
  type AnswerKind,
  type KnowledgeCheckConfig,
} from "./knowledgeCheck";
import { SelectNative } from "../ui/SelectNative";
import { Switch } from "../ui/Switch";
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
} from "../ui/Popover";
import { StopEditorEvents } from "./StopEditorEvents";
import { cx } from "../ui/cx";

const BIND_DEBOUNCE_MS = 120;

const KIND_LABEL: Record<AnswerKind, string> = {
  choice: "Multiple choice",
  number: "Number",
  text: "Short text",
};

// The NodeView for a knowledge check — after the "Knowledge Check" mockup's 1c
// "pedagogical flow card": a warm authoring header + a flow-summary footer in
// edit mode, and a clean reader (no chrome) with a pick → Check → feedback path,
// attempts, an optional hint, and reveal. A *named* check publishes
// `$[name] = passed` so downstream cells re-run (progress/scoring).
export function KnowledgeCheckView({
  node,
  updateAttributes,
  getPos,
  editor,
}: NodeViewProps) {
  const id = node.attrs.id as string | null;
  const name = node.attrs.name as string;
  const question = node.attrs.question as string;
  const answerKind = node.attrs.answerKind as AnswerKind;
  const config = (node.attrs.config ?? {}) as KnowledgeCheckConfig;
  const value = node.attrs.value;

  const rt = useRuntime();
  const reading = useReadingMode();
  const bindTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const attemptsTotal = Math.max(1, config.attempts ?? 2);
  const revealAllowed = config.reveal !== false;
  const [attemptsLeft, setAttemptsLeft] = useState(attemptsTotal);
  const [checked, setChecked] = useState(false); // locked (passed or spent)
  const [revealed, setRevealed] = useState(false);
  const [lastWrong, setLastWrong] = useState(false);
  const [hintOpen, setHintOpen] = useState(false);

  const grade = gradeAnswer(answerKind, value, config);
  const passed = checked && grade.correct;
  const shown = checked || revealed; // reveal the answer inline

  const setAnswer = (next: unknown) => {
    if (checked) return;
    updateAttributes({ value: next });
    setLastWrong(false);
  };
  const setConfig = (patch: Partial<KnowledgeCheckConfig>) =>
    updateAttributes({ config: { ...config, ...patch } });

  const check = () => {
    if (checked || !grade.answered) return;
    if (grade.correct) {
      setChecked(true);
      setLastWrong(false);
    } else {
      const left = attemptsLeft - 1;
      setAttemptsLeft(left);
      if (left <= 0) setChecked(true);
      setLastWrong(true);
    }
  };
  const reveal = () => {
    setRevealed(true);
    setChecked(true); // revealing ends the attempt (not a pass)
  };

  // Publish the pass boolean to `$` — only for *named* checks, debounced.
  useEffect(() => {
    if (!id || !name) return;
    if (bindTimer.current) clearTimeout(bindTimer.current);
    bindTimer.current = setTimeout(
      () => rt.update(id, bindingCode(name, passed)),
      BIND_DEBOUNCE_MS,
    );
    return () => {
      if (bindTimer.current) clearTimeout(bindTimer.current);
    };
  }, [rt, id, name, passed]);

  useEffect(() => {
    if (!id || !name) return;
    return () => rt.remove(id);
  }, [rt, id, name]);

  const deleteSelf = () => {
    const pos = typeof getPos === "function" ? getPos() : undefined;
    if (pos == null) return;
    const view = editor.view;
    view.dispatch(view.state.tr.delete(pos, pos + node.nodeSize));
    view.focus();
  };

  return (
    <NodeViewWrapper
      data-slot="knowledge-check"
      className={cx(
        "my-[22px] overflow-hidden rounded-xl bg-surface shadow-[0_1px_2px_rgb(0_0_0/0.04),0_4px_16px_rgb(0_0_0/0.03)]",
        reading ? "border border-border-subtle" : "border border-border",
      )}
      contentEditable={false}
    >
      {/* Warm authoring header — hidden for the reader. */}
      {!reading && (
        <div className="flex items-center gap-2.5 border-b border-value-border bg-value-bg px-3 py-2">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-value-border bg-gold-4 py-[3px] pl-1.5 pr-2 font-mono text-[11px] font-medium text-value">
            <CheckChipGlyph />
            check
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-gold-6 bg-gold-2 px-2.5 py-[5px] text-[12.5px] font-medium text-text">
            {KIND_LABEL[answerKind]}
          </span>
          {name && (
            <span
              data-slot="check-bindtag"
              className="ml-auto inline-flex items-center gap-1.5 font-mono text-[11px] text-value"
            >
              writes <b className="font-semibold">${name}</b>
            </span>
          )}
          <div className={name ? "" : "ml-auto"}>
            <StopEditorEvents>
              <Popover>
                <PopoverTrigger
                  aria-label="check settings"
                  className="flex size-6 items-center justify-center rounded-md border border-gold-6 bg-surface text-gold-11 outline-none hover:border-gold-8 focus-visible:ring-2 focus-visible:ring-accent-8"
                >
                  <GearIcon />
                </PopoverTrigger>
                <PopoverContent
                  align="end"
                  className="max-h-[70vh] w-80 space-y-3 overflow-auto font-sans text-xs"
                >
                  <Field label="Question">
                    <textarea
                      aria-label="question"
                      rows={2}
                      className="w-full resize-y rounded border border-border-strong bg-surface px-2 py-1 font-sans text-xs text-text outline-none focus-visible:border-accent-8 focus-visible:ring-2 focus-visible:ring-accent-8"
                      value={question}
                      onChange={(e) =>
                        updateAttributes({ question: e.target.value })
                      }
                    />
                  </Field>
                  <Field label="Answer type">
                    <SelectNative
                      aria-label="answer kind"
                      className="text-xs"
                      value={answerKind}
                      onChange={(e) =>
                        updateAttributes({ answerKind: e.target.value })
                      }
                    >
                      {(Object.keys(KIND_LABEL) as AnswerKind[]).map((k) => (
                        <option key={k} value={k}>
                          {KIND_LABEL[k]}
                        </option>
                      ))}
                    </SelectNative>
                  </Field>
                  <ConfigEditor
                    kind={answerKind}
                    config={config}
                    setConfig={setConfig}
                  />
                  <Field label="Explanation (shown when right)">
                    <input
                      className={FIELD_INPUT}
                      value={config.explanation ?? ""}
                      onChange={(e) =>
                        setConfig({ explanation: e.target.value })
                      }
                    />
                  </Field>
                  <Field label="Hint (offered on request)">
                    <input
                      className={FIELD_INPUT}
                      value={config.hint ?? ""}
                      onChange={(e) => setConfig({ hint: e.target.value })}
                    />
                  </Field>
                  <div className="flex gap-2">
                    <Field label="Attempts">
                      <input
                        type="number"
                        min={1}
                        className={cx(FIELD_INPUT, "font-mono")}
                        value={String(config.attempts ?? 2)}
                        onChange={(e) =>
                          setConfig({ attempts: Number(e.target.value) })
                        }
                      />
                    </Field>
                    <label className="flex flex-1 items-center gap-2 pt-5 text-text-muted">
                      <Switch
                        checked={config.reveal !== false}
                        onCheckedChange={(c) => setConfig({ reveal: c })}
                      />
                      Reveal
                    </label>
                  </div>
                  <Field label="Bound $ key (optional — for scoring)">
                    <input
                      aria-label="bound $ key"
                      className={cx(FIELD_INPUT, "font-mono")}
                      placeholder="e.g. q1"
                      value={name}
                      onChange={(e) =>
                        updateAttributes({ name: e.target.value })
                      }
                    />
                  </Field>
                  <div className="border-t border-border-subtle pt-2">
                    <PopoverClose asChild>
                      <button
                        type="button"
                        onClick={deleteSelf}
                        className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-danger-text hover:bg-danger-bg"
                      >
                        <TrashIcon />
                        Delete check
                      </button>
                    </PopoverClose>
                  </div>
                </PopoverContent>
              </Popover>
            </StopEditorEvents>
          </div>
        </div>
      )}

      <div className="px-4 py-4">
        <p
          data-slot="check-question"
          className="font-serif text-[19px] leading-[1.45] text-text [text-wrap:pretty]"
        >
          {question || (
            <span className="text-text-faint">
              Write a question in settings (⚙)…
            </span>
          )}
        </p>

        <div data-slot="check-answer" className="mt-3.5">
          <AnswerControl
            kind={answerKind}
            value={value}
            config={config}
            shown={shown}
            passed={passed}
            locked={checked}
            setAnswer={setAnswer}
          />
        </div>

        {hintOpen && config.hint && (
          <div className="mt-3 flex gap-2 rounded-[10px] border border-value-border bg-value-bg px-3 py-[11px] text-[13px] leading-normal text-value animate-in fade-in slide-in-from-top-1">
            <b className="font-semibold">Hint ·</b>
            {config.hint}
          </div>
        )}

        {checked && <Feedback passed={passed} config={config} />}
        {!checked && lastWrong && (
          <p className="mt-3 text-[13px] text-value animate-in fade-in">
            Not quite — {attemptsLeft} tr{attemptsLeft === 1 ? "y" : "ies"}{" "}
            left.
          </p>
        )}

        <div className="mt-4 flex items-center gap-2.5">
          <button
            type="button"
            data-slot="check-submit"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={check}
            disabled={!grade.answered || checked}
            className="inline-flex items-center gap-2 rounded-[9px] border border-action bg-action px-4 py-[9px] text-[13.5px] font-semibold text-white transition-colors hover:bg-action-hover disabled:cursor-not-allowed disabled:border-border-subtle disabled:bg-surface-active disabled:text-text-faint"
          >
            <CheckGlyph />
            {checked ? "Checked" : "Check answer"}
          </button>
          {config.hint && (
            <button
              type="button"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => setHintOpen((o) => !o)}
              className="inline-flex items-center gap-1.5 rounded-[9px] border border-value-border bg-value-bg px-3 py-2 text-[12.5px] font-medium text-value hover:bg-gold-4"
            >
              {hintOpen ? "Hide hint" : "Show hint"}
            </button>
          )}
          <span className="ml-auto inline-flex items-center gap-2 text-[12px] text-text-faint">
            {revealAllowed && !checked && (
              <button
                type="button"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={reveal}
                className="font-medium text-text-muted underline decoration-1 underline-offset-2 hover:text-action-text"
              >
                Reveal
              </button>
            )}
            {Array.from({ length: attemptsTotal }).map((_, i) => (
              <span
                key={i}
                className={cx(
                  "size-[7px] rounded-full",
                  !checked && i < attemptsLeft ? "bg-action" : "bg-border",
                )}
              />
            ))}
            {checked ? "answered" : `${attemptsLeft} left`}
          </span>
        </div>

        {name && (
          <div
            data-slot="check-binding"
            className="mt-3.5 flex flex-wrap items-center gap-2.5 rounded-[9px] border border-border-subtle bg-surface-sunken px-3 py-2.5 font-mono text-[12.5px] text-text-muted"
          >
            <span className="inline-flex items-center gap-1.5 font-semibold text-live-text">
              <span className="size-2 rounded-full bg-live shadow-[0_0_0_2px_var(--color-live-subtle)]" />
              LIVE
            </span>
            <span className="font-semibold text-value">${name}</span>=
            <span
              className={cx(
                "rounded px-[7px] font-semibold",
                !checked
                  ? "bg-surface-active text-text-faint"
                  : passed
                    ? "bg-live-subtle text-live-text"
                    : "bg-danger-bg text-danger-text",
              )}
            >
              {!checked ? "—" : String(passed)}
            </span>
            <span className="ml-auto font-sans text-[11.5px] text-text-faint">
              downstream cells re-run on change
            </span>
          </div>
        )}
      </div>

      {/* Pedagogical flow footer — authoring only. */}
      {!reading && (
        <div className="flex items-stretch gap-0 overflow-x-auto border-t border-border-subtle bg-surface-sunken px-4 py-3">
          <FlowStep k="Ask" first>
            {KIND_LABEL[answerKind]}
          </FlowStep>
          <FlowStep k="Attempt">
            up to{" "}
            <span className="font-mono font-semibold text-value">
              {attemptsTotal}
            </span>
            ×
          </FlowStep>
          <FlowStep k="Feedback">
            {config.explanation ? "Explained" : "On check"}
          </FlowStep>
          <FlowStep k="Hint">{config.hint ? "On request" : "—"}</FlowStep>
          <FlowStep k="Reveal">
            {revealAllowed ? "After last try" : "—"}
          </FlowStep>
        </div>
      )}
    </NodeViewWrapper>
  );
}

const FIELD_INPUT =
  "w-full rounded border border-border-strong bg-surface px-2 py-1 text-xs text-text outline-none focus-visible:border-accent-8 focus-visible:ring-2 focus-visible:ring-accent-8";

function FlowStep({
  k,
  first,
  children,
}: {
  k: string;
  first?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cx(
        "relative flex min-w-0 flex-col gap-0.5 px-3.5",
        first
          ? "pl-0.5"
          : "before:absolute before:bottom-0.5 before:left-0 before:top-2 before:w-px before:bg-border-subtle",
      )}
    >
      <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-faint">
        {k}
      </span>
      <span className="whitespace-nowrap text-[12.5px] font-medium text-text">
        {children}
      </span>
    </div>
  );
}

function Feedback({
  passed,
  config,
}: {
  passed: boolean;
  config: KnowledgeCheckConfig;
}) {
  return (
    <div
      data-slot="check-feedback"
      className={cx(
        "mt-3.5 flex items-start gap-2.5 rounded-[10px] border px-3.5 py-3 text-[13.5px] leading-normal animate-in fade-in slide-in-from-top-1",
        passed
          ? "border-brand-5 bg-live-subtle text-live-text"
          : "border-danger-border bg-danger-bg text-danger-text",
      )}
    >
      <span
        aria-hidden
        className={cx(
          "grid size-5 flex-none place-items-center rounded-md text-[13px] font-bold",
          passed ? "bg-brand-10 text-text" : "bg-danger text-white",
        )}
      >
        {passed ? "✓" : "!"}
      </span>
      <span>
        {passed
          ? config.explanation || "Correct."
          : `Out of attempts. ${config.explanation || "The answer is shown above."}`}
      </span>
    </div>
  );
}

function AnswerControl({
  kind,
  value,
  config,
  shown,
  passed,
  locked,
  setAnswer,
}: {
  kind: AnswerKind;
  value: unknown;
  config: KnowledgeCheckConfig;
  shown: boolean;
  passed: boolean;
  locked: boolean;
  setAnswer: (next: unknown) => void;
}) {
  if (kind === "choice") {
    const options = config.options ?? [];
    if (options.length === 0)
      return (
        <p className="font-sans text-sm text-text-muted">
          Add answer options in settings (⚙).
        </p>
      );
    return (
      <div className="flex flex-col gap-2.5">
        {options.map((opt, i) => {
          const selected = value === opt;
          const isCorrect = i === config.correctChoice;
          const state = shown
            ? isCorrect
              ? "correct"
              : selected
                ? "wrong"
                : "muted"
            : selected
              ? "sel"
              : "idle";
          return (
            <button
              key={opt}
              type="button"
              disabled={locked}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => setAnswer(opt)}
              className={cx(
                "flex w-full items-center gap-3 rounded-[10px] border px-[13px] py-[11px] text-left font-sans text-[14.5px] text-text transition-colors disabled:cursor-default",
                state === "idle" &&
                  "border-border-subtle hover:border-border-strong",
                state === "sel" &&
                  "border-action bg-action-subtle ring-1 ring-inset ring-action",
                state === "correct" &&
                  "border-brand-7 bg-live-subtle ring-1 ring-inset ring-brand-7",
                state === "wrong" &&
                  "border-danger-border bg-danger-bg ring-1 ring-inset ring-danger-border",
                state === "muted" && "border-border-subtle opacity-50",
              )}
            >
              <span
                aria-hidden
                className={cx(
                  "grid size-[19px] flex-none place-items-center rounded-full border-[1.7px] text-[11px] font-bold leading-none text-white",
                  state === "correct"
                    ? "border-brand-7 bg-brand-10 text-text"
                    : state === "wrong"
                      ? "border-danger bg-danger"
                      : selected
                        ? "border-action bg-action"
                        : "border-border-strong",
                )}
              >
                {state === "correct"
                  ? "✓"
                  : state === "wrong"
                    ? "✗"
                    : selected
                      ? "●"
                      : ""}
              </span>
              {opt}
            </button>
          );
        })}
      </div>
    );
  }

  // number / text — a single field, plus the revealed answer when shown+wrong
  const correctText =
    kind === "number" ? config.correctNumber : config.correctText;
  return (
    <div className="flex flex-wrap items-center gap-3">
      <input
        type={kind === "number" ? "number" : "text"}
        inputMode={kind === "number" ? "numeric" : undefined}
        placeholder={kind === "number" ? "?" : "Your answer"}
        value={String(value ?? "")}
        disabled={locked}
        onMouseDown={(e) => e.stopPropagation()}
        onChange={(e) => setAnswer(e.target.value)}
        className={cx(
          "w-full max-w-[220px] rounded-[9px] border-[1.5px] bg-surface px-3 py-2 font-mono text-base font-semibold text-text outline-none focus:border-action focus:ring-4 focus:ring-accent-3 disabled:opacity-70",
          shown && !passed
            ? "border-danger-border"
            : shown && passed
              ? "border-brand-7"
              : "border-border",
        )}
      />
      {shown && !passed && correctText != null && correctText !== "" && (
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-brand-5 bg-live-subtle px-2.5 py-1.5 font-mono text-[13px] text-brand-11">
          answer: {String(correctText)}
        </span>
      )}
    </div>
  );
}

function ConfigEditor({
  kind,
  config,
  setConfig,
}: {
  kind: AnswerKind;
  config: KnowledgeCheckConfig;
  setConfig: (patch: Partial<KnowledgeCheckConfig>) => void;
}) {
  if (kind === "choice") {
    const options = config.options ?? [];
    return (
      <>
        <Field label="Options (comma-separated)">
          <input
            aria-label="options, comma-separated"
            className={FIELD_INPUT}
            placeholder="doubles, stays the same, squares"
            value={config.optionsText ?? options.join(", ")}
            onChange={(e) =>
              setConfig({
                optionsText: e.target.value,
                options: e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
          />
        </Field>
        <Field label="Correct answer">
          <SelectNative
            aria-label="correct option"
            className="text-xs"
            value={
              config.correctChoice == null ? "" : String(config.correctChoice)
            }
            onChange={(e) =>
              setConfig({
                correctChoice:
                  e.target.value === "" ? undefined : Number(e.target.value),
              })
            }
          >
            <option value="">— pick the correct option —</option>
            {options.map((opt, i) => (
              <option key={i} value={i}>
                {opt}
              </option>
            ))}
          </SelectNative>
        </Field>
      </>
    );
  }

  if (kind === "number") {
    return (
      <div className="flex gap-2">
        <Field label="Correct value">
          <input
            type="number"
            className={cx(FIELD_INPUT, "font-mono")}
            value={
              config.correctNumber == null ? "" : String(config.correctNumber)
            }
            onChange={(e) =>
              setConfig({
                correctNumber:
                  e.target.value === "" ? undefined : Number(e.target.value),
              })
            }
          />
        </Field>
        <Field label="± Tolerance">
          <input
            type="number"
            className={cx(FIELD_INPUT, "font-mono")}
            value={String(config.tolerance ?? 0)}
            onChange={(e) => setConfig({ tolerance: Number(e.target.value) })}
          />
        </Field>
      </div>
    );
  }

  return (
    <>
      <Field label="Correct answer">
        <input
          className={FIELD_INPUT}
          value={config.correctText ?? ""}
          onChange={(e) => setConfig({ correctText: e.target.value })}
        />
      </Field>
      <label className="flex items-center gap-2 text-text-muted">
        <Switch
          checked={Boolean(config.caseSensitive)}
          onCheckedChange={(c) => setConfig({ caseSensitive: c })}
        />
        Case-sensitive
      </label>
    </>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-1 flex-col gap-1">
      <span className="font-medium text-text-muted">{label}</span>
      {children}
    </label>
  );
}

function CheckChipGlyph() {
  return (
    <svg className="size-3.5" viewBox="0 0 16 16">
      <rect width="16" height="16" rx="3.5" fill="var(--gold-9)" />
      <path
        d="M4.5 8.2l2.2 2.2 4.3-4.6"
        stroke="#fff"
        strokeWidth="1.7"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckGlyph() {
  return (
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
  );
}

function GearIcon() {
  return (
    <svg
      className="size-3.5"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
    >
      <path d="M2 5h6M11 5h3M2 11h3M8 11h6" />
      <circle cx="9.5" cy="5" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="6.5" cy="11" r="1.6" fill="currentColor" stroke="none" />
    </svg>
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
