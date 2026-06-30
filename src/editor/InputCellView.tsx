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
import { Select } from "../ui/Select";
import { Input } from "../ui/Input";

const KINDS: InputKind[] = ["slider", "number", "text", "select", "toggle"];

// The NodeView for an input cell — the explorable's knob. It renders the control
// for `kind`, a quiet config header, and binds the value to a `$` key through the
// existing runtime: an input cell is an auto-generated assignment cell. Same
// useRuntime + register/deregister lifecycle as CodeCellView, so it needs no new
// plumbing and its value (in node attrs) persists via Yjs → IndexedDB.
export function InputCellView({ node, updateAttributes }: NodeViewProps) {
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

  return (
    <NodeViewWrapper
      className="input-cell overflow-hidden rounded-[10px] border border-olive-6 bg-olive-2"
      contentEditable={false}
    >
      {!reading && (
        <div className="flex flex-wrap items-center gap-2 border-b border-olive-6 bg-olive-3 px-2.5 py-1.5 font-sans text-xs text-olive-11">
          <span className="font-medium text-olive-12">input</span>
          <input
            aria-label="bound $ key"
            className="w-28 rounded border border-olive-7 bg-olive-1 px-1.5 py-0.5 font-mono text-xs text-olive-12 outline-none focus-visible:border-violet-8 focus-visible:ring-2 focus-visible:ring-violet-8"
            value={name}
            onChange={(e) => updateAttributes({ name: e.target.value })}
          />
          <select
            aria-label="input kind"
            className="rounded border border-olive-7 bg-olive-1 px-1.5 py-0.5 font-sans text-xs text-olive-12"
            value={kind}
            onChange={(e) => updateAttributes({ kind: e.target.value })}
          >
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
          <ConfigEditor kind={kind} config={config} setConfig={setConfig} />
        </div>
      )}

      <div className="px-3 py-3">
        <Control
          kind={kind}
          value={value}
          config={config}
          setValue={setValue}
        />
      </div>

      <div className="flex items-center gap-2 border-t border-olive-6 px-3 py-1.5 font-mono text-xs">
        <span
          className="inline-block h-2 w-2 rounded-full bg-lime-9"
          aria-hidden
        />
        <span>
          <span className="font-semibold text-gold-11">${name}</span>{" "}
          <span className="text-olive-11">=</span>{" "}
          <span className="text-olive-12">{formatValue(value)}</span>
        </span>
      </div>
    </NodeViewWrapper>
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
          <p className="font-sans text-sm text-olive-11">
            Add options in the header (comma-separated).
          </p>
        );
      return (
        <Select
          value={String(value ?? options[0])}
          options={options}
          onValueChange={setValue}
        />
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
    <label className="flex items-center gap-1 text-olive-11">
      {label}
      <input
        type="number"
        className="w-14 rounded border border-olive-7 bg-olive-1 px-1 py-0.5 font-mono text-xs text-olive-12 outline-none focus-visible:border-violet-8"
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
      <label className="flex items-center gap-1 text-olive-11">
        options
        <input
          aria-label="select options, comma-separated"
          className="w-44 rounded border border-olive-7 bg-olive-1 px-1.5 py-0.5 font-sans text-xs text-olive-12 outline-none focus-visible:border-violet-8"
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
