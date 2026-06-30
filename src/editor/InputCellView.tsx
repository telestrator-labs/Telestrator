import { useEffect, useRef } from "react";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { useRuntime } from "./RuntimeProvider";
import { useReadingMode } from "./ReadingMode";
import { bindingCode, coerceValue, type InputKind } from "./binding";
import type { InputCellConfig } from "./inputCellNode";

// Debounce runtime re-registration so a slider drag doesn't spam the sandbox
// with re-transpiles (mirrors CodeCellView's REGISTER_DEBOUNCE_MS).
const BIND_DEBOUNCE_MS = 120;
import { Slider } from "../ui/Slider";
import { Switch } from "../ui/Switch";
import { SelectNative } from "../ui/SelectNative";
import { Input } from "../ui/Input";
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
} from "../ui/Popover";
import { StopEditorEvents } from "./StopEditorEvents";

const KINDS: InputKind[] = ["slider", "number", "text", "select", "toggle"];

// The NodeView for an input cell — the explorable's knob. It renders the control
// for `kind`, a quiet config header, and binds the value to a `$` key through the
// existing runtime: an input cell is an auto-generated assignment cell. Same
// useRuntime + register/deregister lifecycle as CodeCellView, so it needs no new
// plumbing and its value (in node attrs) persists via Yjs → IndexedDB.
export function InputCellView({
  node,
  updateAttributes,
  getPos,
  editor,
}: NodeViewProps) {
  const id = node.attrs.id as string | null;
  const name = node.attrs.name as string;
  const kind = node.attrs.kind as InputKind;
  const config = (node.attrs.config ?? {}) as InputCellConfig;
  const rawValue = node.attrs.value as unknown;
  // Coerce the stored value to one valid for the current kind/config so the
  // control, the readout, and the generated `$` binding never diverge (e.g. a
  // fresh select still holding the numeric default, or a value left over from a
  // previous kind).
  const value = coerceValue(kind, rawValue, {
    min: config.min,
    max: config.max,
    options: config.options,
  });

  const rt = useRuntime();
  const reading = useReadingMode();
  const bindTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Persist the coercion (once) when it actually changed the stored value — e.g.
  // after a kind switch, or once a select gains options. The Object.is guard
  // converges (no render loop) because coerceValue returns primitives.
  useEffect(() => {
    if (!Object.is(value, rawValue)) updateAttributes({ value });
  }, [value, rawValue, updateAttributes]);

  // Register / refresh the generated assignment cell (re-runs dependents),
  // debounced so dragging a slider doesn't re-transpile every tick. Note:
  // renaming `name` leaves the old `$` key set until a runtime restart — the
  // engine only clears a cell's *recorded* writes, not stale keys. Acceptable here.
  useEffect(() => {
    if (!id) return;
    if (bindTimer.current) clearTimeout(bindTimer.current);
    bindTimer.current = setTimeout(
      () => rt.update(id, bindingCode(kind, name, value)),
      BIND_DEBOUNCE_MS,
    );
    return () => {
      if (bindTimer.current) clearTimeout(bindTimer.current);
    };
  }, [rt, id, kind, name, value]);

  // Remove from the runtime when the cell is deleted.
  useEffect(() => {
    if (!id) return;
    return () => rt.remove(id);
  }, [rt, id]);

  const setValue = (next: unknown) => updateAttributes({ value: next });
  const setConfig = (patch: Partial<InputCellConfig>) =>
    updateAttributes({ config: { ...config, ...patch } });

  const deleteSelf = () => {
    const pos = typeof getPos === "function" ? getPos() : undefined;
    if (pos == null) return;
    const view = editor.view;
    view.dispatch(view.state.tr.delete(pos, pos + node.nodeSize));
    view.focus();
  };

  return (
    <NodeViewWrapper
      className="input-cell relative overflow-hidden rounded-[10px] border border-border bg-surface-sunken"
      contentEditable={false}
    >
      {/* Config lives behind a quiet gear so the cell reads as a knob, not a
          form — the type/name/range are settings, not the primary content. */}
      {!reading && (
        <div className="absolute right-2 top-2 z-10">
          <StopEditorEvents>
            <Popover>
              <PopoverTrigger
                aria-label="input settings"
                className="flex size-6 items-center justify-center rounded-md border border-border bg-surface text-text-faint outline-none hover:border-border-strong hover:text-text-muted focus-visible:ring-2 focus-visible:ring-accent-8"
              >
                <GearIcon />
              </PopoverTrigger>
              <PopoverContent
                align="end"
                className="w-72 space-y-3 font-sans text-xs"
              >
                <Field label="Bound $ key">
                  <input
                    aria-label="bound $ key"
                    className="w-full rounded border border-border-strong bg-surface px-2 py-1 font-mono text-xs text-text outline-none focus-visible:border-accent-8 focus-visible:ring-2 focus-visible:ring-accent-8"
                    value={name}
                    onChange={(e) => updateAttributes({ name: e.target.value })}
                  />
                </Field>
                <Field label="Type">
                  <SelectNative
                    aria-label="input kind"
                    className="text-xs"
                    value={kind}
                    onChange={(e) => updateAttributes({ kind: e.target.value })}
                  >
                    {KINDS.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </SelectNative>
                </Field>
                <ConfigEditor
                  kind={kind}
                  config={config}
                  setConfig={setConfig}
                />
                <div className="border-t border-border-subtle pt-2">
                  <PopoverClose asChild>
                    <button
                      type="button"
                      onClick={deleteSelf}
                      className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-danger-text hover:bg-danger-bg"
                    >
                      <TrashIcon />
                      Delete input
                    </button>
                  </PopoverClose>
                </div>
              </PopoverContent>
            </Popover>
          </StopEditorEvents>
        </div>
      )}

      <div className="px-3 py-3 pr-10">
        <Control
          kind={kind}
          value={value}
          config={config}
          setValue={setValue}
        />
      </div>

      <div className="flex items-center gap-2 border-t border-border px-3 py-1.5 font-mono text-xs">
        <span
          className="inline-block h-2 w-2 rounded-full bg-live"
          aria-hidden
        />
        <span>
          <span className="font-semibold text-gold-11">${name}</span>{" "}
          <span className="text-text-muted">=</span>{" "}
          <span className="text-text">{formatValue(value)}</span>
        </span>
      </div>
    </NodeViewWrapper>
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
    <label className="flex flex-col gap-1">
      <span className="font-medium text-text-muted">{label}</span>
      {children}
    </label>
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

// A sliders/adjustments glyph — conveys "tune this input" far better than the
// old radial gear (which read as a sun).
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

function Control({
  kind,
  value,
  config,
  setValue,
}: {
  kind: InputKind;
  value: unknown;
  config: InputCellConfig;
  setValue: (next: unknown) => void;
}) {
  switch (kind) {
    case "slider": {
      const min = config.min ?? 0;
      const max = config.max ?? 100;
      const step = config.step ?? 1;
      const n = Number(value);
      return (
        <div className="flex items-center gap-3">
          <Slider
            value={[Number.isFinite(n) ? n : min]}
            min={min}
            max={max}
            step={step}
            onValueChange={([v]) => setValue(v)}
          />
          <span className="w-12 shrink-0 text-right font-mono text-sm text-gold-11">
            {Number.isFinite(n) ? n : min}
          </span>
        </div>
      );
    }
    case "number":
      return (
        <Input
          type="number"
          value={String(value ?? "")}
          onChange={(e) =>
            setValue(e.target.value === "" ? 0 : Number(e.target.value))
          }
        />
      );
    case "text":
      return (
        <Input
          type="text"
          value={String(value ?? "")}
          onChange={(e) => setValue(e.target.value)}
        />
      );
    case "select": {
      const options = config.options ?? [];
      if (options.length === 0)
        return (
          <p className="font-sans text-sm text-text-muted">
            Add options in settings (⚙).
          </p>
        );
      return (
        <SelectNative
          aria-label={`${name} value`}
          value={String(value ?? options[0])}
          onChange={(e) => setValue(e.target.value)}
        >
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </SelectNative>
      );
    }
    case "toggle":
      return (
        <Switch
          checked={Boolean(value)}
          onCheckedChange={(checked) => setValue(checked)}
        />
      );
    default:
      return null;
  }
}

function ConfigEditor({
  kind,
  config,
  setConfig,
}: {
  kind: InputKind;
  config: InputCellConfig;
  setConfig: (patch: Partial<InputCellConfig>) => void;
}) {
  const numberField = (
    label: string,
    key: "min" | "max" | "step",
    fallback: number,
  ) => (
    <label className="flex items-center gap-1 text-text-muted">
      {label}
      <input
        type="number"
        className="w-14 rounded border border-border-strong bg-surface px-1 py-0.5 font-mono text-xs text-text outline-none focus-visible:border-accent-8"
        value={String(config[key] ?? fallback)}
        onChange={(e) =>
          setConfig({
            [key]: Number(e.target.value),
          } as Partial<InputCellConfig>)
        }
      />
    </label>
  );

  if (kind === "slider")
    return (
      <span className="flex items-center gap-2">
        {numberField("min", "min", 0)}
        {numberField("max", "max", 100)}
        {numberField("step", "step", 1)}
      </span>
    );

  if (kind === "select")
    return (
      <label className="flex items-center gap-1 text-text-muted">
        options
        <input
          aria-label="select options, comma-separated"
          className="w-44 rounded border border-border-strong bg-surface px-1.5 py-0.5 font-sans text-xs text-text outline-none focus-visible:border-accent-8"
          placeholder="a, b, c"
          // Source of truth is the raw text (config.optionsText), so the comma
          // separator survives keystrokes and re-renders; the parsed `options`
          // array (for the control + binding) is derived alongside it. A
          // controlled value of options.join(", ") would strip the separator on
          // each keystroke (split→filter→rejoin).
          value={config.optionsText ?? (config.options ?? []).join(", ")}
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
      </label>
    );

  return null;
}

function formatValue(v: unknown): string {
  if (typeof v === "string") return JSON.stringify(v);
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}
