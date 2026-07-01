import { useEffect, useMemo, useRef } from "react";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { useRuntime, useCellOutput } from "@/editor/reactive/RuntimeProvider";
import { useCellTrace } from "@/editor/trace/TraceContext";
import { useReadingMode } from "@/editor/shared/ReadingMode";
import { cx } from "@/ui/cx";
import {
  chartCellCode,
  chartOutputKey,
  coerceRows,
  resolveSeries,
  type ChartConfig,
  type ChartType,
} from "@/editor/cells/chart/chart";
import { CategoryChart } from "@/ui/chart/CategoryChart";
import { SelectNative } from "@/ui/SelectNative";
import { Switch } from "@/ui/Switch";
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
} from "@/ui/Popover";
import { StopEditorEvents } from "@/editor/shared/StopEditorEvents";

// Debounce runtime re-registration so editing the expression doesn't re-transpile
// on every keystroke (mirrors InputCellView's BIND_DEBOUNCE_MS).
const REGISTER_DEBOUNCE_MS = 160;
const CHART_TYPES: ChartType[] = ["area", "line", "bar"];

// The NodeView for a chart cell — the explorable's readout. It registers a
// generated cell that evaluates the author's `$`-reading expression into a
// reserved key, then subscribes to that key via useCellOutput so recharts
// re-renders whenever an upstream `$` value changes. Same register/deregister
// lifecycle as the input cell, in reverse (read instead of write).
export function ChartView({
  node,
  updateAttributes,
  getPos,
  editor,
}: NodeViewProps) {
  const id = node.attrs.id as string | null;
  const chartType = node.attrs.chartType as ChartType;
  const expression = node.attrs.expression as string;
  const index = node.attrs.index as string;
  const categories = (node.attrs.categories ?? []) as string[];
  const config = (node.attrs.config ?? {}) as ChartConfig;

  const rt = useRuntime();
  const reading = useReadingMode();
  const regTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const output = useCellOutput(id ?? "");
  const trace = useCellTrace(id, output);
  const rows = useMemo(
    () => (id ? coerceRows(output?.values?.[chartOutputKey(id)]) : []),
    [output, id],
  );
  const resolved = useMemo(
    () => resolveSeries(rows, index, categories),
    [rows, index, categories],
  );
  const error = output?.error;

  // Register / refresh the generated data cell, debounced. It reads `$` (via the
  // author's expression) and writes the chart's reserved key; the reactive engine
  // re-runs it whenever a `$` value it read changes.
  useEffect(() => {
    if (!id) return;
    if (regTimer.current) clearTimeout(regTimer.current);
    regTimer.current = setTimeout(
      () => rt.update(id, chartCellCode(id, expression)),
      REGISTER_DEBOUNCE_MS,
    );
    return () => {
      if (regTimer.current) clearTimeout(regTimer.current);
    };
  }, [rt, id, expression]);

  // Remove from the runtime when the cell is deleted.
  useEffect(() => {
    if (!id) return;
    return () => rt.remove(id);
  }, [rt, id]);

  const setConfig = (patch: Partial<ChartConfig>) =>
    updateAttributes({ config: { ...config, ...patch } });

  const deleteSelf = () => {
    const pos = typeof getPos === "function" ? getPos() : undefined;
    if (pos == null) return;
    const view = editor.view;
    view.dispatch(view.state.tr.delete(pos, pos + node.nodeSize));
    view.focus();
  };

  const hasData = rows.length > 0 && resolved.categories.length > 0;

  return (
    <NodeViewWrapper
      data-cellid={id ?? undefined}
      className={cx(
        "chart-cell relative overflow-hidden rounded-[10px] border bg-surface-sunken",
        reading ? "border-border-subtle" : "border-border",
        trace.className,
      )}
      {...trace.hoverProps}
      contentEditable={false}
    >
      {!reading && (
        <div className="absolute right-2 top-2 z-10">
          <StopEditorEvents>
            <Popover>
              <PopoverTrigger
                aria-label="chart settings"
                className="flex size-6 items-center justify-center rounded-md border border-border bg-surface text-text-faint outline-none hover:border-border-strong hover:text-text-muted focus-visible:ring-2 focus-visible:ring-accent-8"
              >
                <GearIcon />
              </PopoverTrigger>
              <PopoverContent
                align="end"
                className="w-80 space-y-3 font-sans text-xs"
              >
                <Field label="Data source ($ expression)">
                  <textarea
                    aria-label="data expression"
                    rows={3}
                    spellCheck={false}
                    className="w-full resize-y rounded border border-border-strong bg-surface px-2 py-1.5 font-mono text-xs leading-relaxed text-text outline-none focus-visible:border-accent-8 focus-visible:ring-2 focus-visible:ring-accent-8"
                    placeholder="$.series"
                    value={expression}
                    onChange={(e) =>
                      updateAttributes({ expression: e.target.value })
                    }
                  />
                </Field>
                <div className="flex gap-2">
                  <Field label="Type">
                    <SelectNative
                      aria-label="chart type"
                      className="text-xs"
                      value={chartType}
                      onChange={(e) =>
                        updateAttributes({ chartType: e.target.value })
                      }
                    >
                      {CHART_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </SelectNative>
                  </Field>
                  <Field label="X-axis field">
                    <input
                      aria-label="index field"
                      className="w-full rounded border border-border-strong bg-surface px-2 py-1 font-mono text-xs text-text outline-none focus-visible:border-accent-8"
                      placeholder={resolved.index || "auto"}
                      value={index}
                      onChange={(e) =>
                        updateAttributes({ index: e.target.value })
                      }
                    />
                  </Field>
                </div>
                <Field label="Series fields (comma-separated)">
                  <input
                    aria-label="series fields"
                    className="w-full rounded border border-border-strong bg-surface px-2 py-1 font-mono text-xs text-text outline-none focus-visible:border-accent-8"
                    // Raw text is the source of truth so the comma separator
                    // survives keystrokes; the parsed array is derived alongside
                    // (mirrors the input cell's select options).
                    placeholder={resolved.categories.join(", ") || "auto"}
                    value={config.categoriesText ?? categories.join(", ")}
                    onChange={(e) =>
                      updateAttributes({
                        config: { ...config, categoriesText: e.target.value },
                        categories: e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                  />
                </Field>
                <div className="grid grid-cols-2 gap-x-3 gap-y-2 border-t border-border-subtle pt-2">
                  <Toggle
                    label="Smooth"
                    checked={config.curve !== false}
                    onChange={(v) => setConfig({ curve: v })}
                  />
                  <Toggle
                    label="Grid"
                    checked={config.showGrid !== false}
                    onChange={(v) => setConfig({ showGrid: v })}
                  />
                  <Toggle
                    label="Legend"
                    checked={config.showLegend === true}
                    onChange={(v) => setConfig({ showLegend: v })}
                  />
                  <Toggle
                    label="Stacked"
                    checked={config.stack === true}
                    onChange={(v) => setConfig({ stack: v })}
                  />
                </div>
                <div className="border-t border-border-subtle pt-2">
                  <PopoverClose asChild>
                    <button
                      type="button"
                      onClick={deleteSelf}
                      className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-danger-text hover:bg-danger-bg"
                    >
                      <TrashIcon />
                      Delete chart
                    </button>
                  </PopoverClose>
                </div>
              </PopoverContent>
            </Popover>
          </StopEditorEvents>
        </div>
      )}

      <div className="px-3 pb-2 pt-3 pr-10">
        {error ? (
          <ChartMessage tone="danger">
            <span className="font-medium">Couldn't evaluate the data.</span>{" "}
            <span className="font-mono text-[11px]">{error}</span>
          </ChartMessage>
        ) : hasData ? (
          <CategoryChart
            type={chartType}
            data={rows}
            index={resolved.index}
            categories={resolved.categories}
            showLegend={config.showLegend === true}
            showGrid={config.showGrid !== false}
            stack={config.stack === true}
            curve={config.curve !== false}
          />
        ) : (
          <ChartMessage tone="muted">
            {rows.length === 0
              ? "No data yet — set the data source (⚙) to a $ expression that returns a list of rows."
              : "No numeric series to plot in this data."}
          </ChartMessage>
        )}
      </div>

      {!reading && (
        <div className="flex items-center gap-2 border-t border-border px-3 py-1.5 font-mono text-xs text-text-muted">
          <span
            className="inline-block h-2 w-2 shrink-0 rounded-full bg-live"
            aria-hidden
          />
          <span className="shrink-0 text-text-faint">reads&nbsp;$</span>
          <span className="truncate text-text-muted">
            {expression.trim().replace(/\s+/g, " ") || "—"}
          </span>
        </div>
      )}
    </NodeViewWrapper>
  );
}

function ChartMessage({
  tone,
  children,
}: {
  tone: "muted" | "danger";
  children: React.ReactNode;
}) {
  return (
    <div
      className={
        tone === "danger"
          ? "flex h-[232px] items-center justify-center rounded-md border border-danger-border bg-danger-bg px-4 text-center text-sm text-danger-text"
          : "flex h-[232px] items-center justify-center rounded-md border border-dashed border-border px-6 text-center text-sm text-text-muted"
      }
    >
      <p className="max-w-sm">{children}</p>
    </div>
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

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-2 text-text-muted">
      {label}
      <Switch checked={checked} onCheckedChange={onChange} />
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

// A small bar-chart glyph — "configure this viz".
function GearIcon() {
  return (
    <svg
      className="size-3.5"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 13.5h12" />
      <path d="M4 13.5V8M8 13.5V4M12 13.5v-3.5" />
    </svg>
  );
}
