import { useEffect, useRef, useState } from "react";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import {
  usePathValue,
  useRuntime,
  useCellOutput,
} from "@/editor/reactive/RuntimeProvider";
import { useTrace, usePulse } from "@/editor/trace/TraceContext";
import {
  chipCellCode,
  chipOutputKey,
  pathSegments,
  tokenizeExpr,
} from "@/editor/cells/valueRef/valueRef";
import { Popover, PopoverContent, PopoverTrigger } from "@/ui/Popover";
import { StopEditorEvents } from "@/editor/shared/StopEditorEvents";
import { cx } from "@/ui/cx";

// Debounce hidden-cell re-registration so editing a computed expression doesn't
// re-transpile on every keystroke (mirrors ChartView).
const REGISTER_DEBOUNCE_MS = 160;

// The NodeView for an inline `$`-value reference — a gold chip in the prose. Two
// shapes of one node:
//   • a *path* chip (`$.rate`, `$.styles.vars.gap`) — resolved host-side against
//     the value snapshot, drawing the trace on hover of its head key;
//   • a *computed* chip (`$.rate * $.qty`) — evaluated in the sandbox via a hidden
//     generated cell, rendered as its expression with each `$.*` reference
//     individually hoverable/traceable, plus the evaluated result.
export function ValueRefView(props: NodeViewProps) {
  const { node } = props;
  const expr = chipExpr(node.attrs.expr as string, node.attrs.name as string);
  return node.attrs.mode === "compute" ? (
    <ComputedChip {...props} expr={expr} />
  ) : (
    <PathChip expr={expr} />
  );
}

// The chip's expression, falling back to the legacy bare-key `name` attr so
// pre-`expr` docs still resolve (`name: "rate"` → `$.rate`).
function chipExpr(expr: string, name: string): string {
  const e = (expr ?? "").trim();
  if (e) return e;
  return name ? `$.${name}` : "";
}

// A plain-path chip: the key + its live value, updating as inputs change, with
// the trace drawn on hover (lighting the head key's writer + readers).
function PathChip({ expr }: { expr: string }) {
  const segments = pathSegments(expr) ?? [];
  const head = segments[0] ?? "";
  const value = usePathValue(segments);
  const trace = useTrace();
  const rippling = usePulse(value, true);
  const formatted = formatInline(value);

  return (
    <NodeViewWrapper
      as="span"
      data-value-ref-name={head || undefined}
      className={cx("value-ref", rippling && "value-ref--ripple")}
      contentEditable={false}
      onMouseEnter={() => head && trace.hoverValue(head)}
      onMouseLeave={() => trace.clearHover()}
    >
      <span className="value-ref__key">{expr || "$"}</span>
      {formatted !== null && (
        <span className="value-ref__val">{formatted}</span>
      )}
    </NodeViewWrapper>
  );
}

// A computed chip: registers a hidden runtime cell that evaluates the expression
// (secure — the eval stays in the sandbox, never the editor realm) and reads its
// result back. Each `$.*` reference in the rendered expression is its own
// hoverable span so it traces to its own writer/readers independently.
function ComputedChip({ node, updateAttributes, expr }: NodeViewProps & { expr: string }) {
  const id = node.attrs.id as string;
  const rt = useRuntime();
  const trace = useTrace();
  const output = useCellOutput(id || "");
  const value = id ? output?.values[chipOutputKey(id)] : undefined;
  const error = output?.error;
  const rippling = usePulse(value, true);
  const regTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // A freshly inserted chip (no expression yet) opens its editor straight away.
  const [open, setOpen] = useState(expr === "");

  // Register / refresh the generated evaluation cell, debounced.
  useEffect(() => {
    if (!id) return;
    if (regTimer.current) clearTimeout(regTimer.current);
    regTimer.current = setTimeout(
      () => rt.update(id, chipCellCode(id, expr)),
      REGISTER_DEBOUNCE_MS,
    );
    return () => {
      if (regTimer.current) clearTimeout(regTimer.current);
    };
  }, [rt, id, expr]);

  // Tear the hidden cell down when the chip is deleted.
  useEffect(() => {
    if (!id) return;
    return () => rt.remove(id);
  }, [rt, id]);

  const tokens = tokenizeExpr(expr);
  const formatted = formatInline(value);

  return (
    <NodeViewWrapper
      as="span"
      data-cellid={id || undefined}
      className={cx(
        "value-ref value-ref--compute",
        rippling && "value-ref--ripple",
        error && "value-ref--error",
      )}
      contentEditable={false}
    >
      <StopEditorEvents>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <span
              role="button"
              tabIndex={0}
              className="value-ref__key value-ref__expr"
              title="Edit expression"
            >
              {expr === "" ? (
                <span className="value-ref__placeholder">ƒ …</span>
              ) : (
                tokens.map((t, i) =>
                  t.head ? (
                    <span
                      key={i}
                      className="value-ref__ref"
                      onMouseEnter={() => trace.hoverValue(t.head!)}
                      onMouseLeave={() => trace.clearHover()}
                    >
                      {t.text}
                    </span>
                  ) : (
                    <span key={i}>{t.text}</span>
                  ),
                )
              )}
            </span>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-72 font-sans text-xs">
            <ExprEditor
              expr={expr}
              value={value}
              error={error}
              onChange={(next) => updateAttributes({ expr: next })}
            />
          </PopoverContent>
        </Popover>
      </StopEditorEvents>
      {error ? (
        <span className="value-ref__val value-ref__val--error" title={error}>
          !
        </span>
      ) : (
        formatted !== null && (
          <span className="value-ref__val">→ {formatted}</span>
        )
      )}
    </NodeViewWrapper>
  );
}

// The popover body: a text field for the `$`-expression plus a live value / error
// preview so the author sees the result while typing.
function ExprEditor({
  expr,
  value,
  error,
  onChange,
}: {
  expr: string;
  value: unknown;
  error?: string;
  onChange: (next: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-medium text-text-muted">Expression ($)</span>
      <input
        aria-label="chip expression"
        autoFocus
        spellCheck={false}
        className="w-full rounded border border-border-strong bg-surface px-2 py-1.5 font-mono text-xs text-text outline-none focus-visible:border-accent-8 focus-visible:ring-2 focus-visible:ring-accent-8"
        placeholder="$.rate * $.qty"
        value={expr}
        onChange={(e) => onChange(e.target.value)}
      />
      <span className="min-h-[1rem] font-mono text-[11px]">
        {error ? (
          <span className="text-danger-text">{error}</span>
        ) : (
          <span className="text-text-faint">
            = {formatInline(value) ?? "—"}
          </span>
        )}
      </span>
    </label>
  );
}

// Compact one-line rendering for an inline chip: numbers/booleans as-is, strings
// quoted, arrays/objects collapsed to a glyph, undefined omitted (nothing has
// written the key yet).
function formatInline(v: unknown): string | null {
  if (v === undefined) return null;
  if (v === null) return "null";
  switch (typeof v) {
    case "number":
    case "boolean":
      return String(v);
    case "string":
      return JSON.stringify(v);
    default:
      return Array.isArray(v) ? "[…]" : "{…}";
  }
}
