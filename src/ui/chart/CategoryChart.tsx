import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ChartType } from "../../editor/chart";
import { cx } from "../cx";

// A cartesian chart (area / line / bar) refactored from Tremor's chart components
// (tremor.so, Apache-2.0) — same `data` / `index` / `categories` shape, slimmed to
// one type-switched component and rebound to our "Ink & Signal" design tokens.
// recharts is the substrate; every color is a `var(--color-*)` so light/dark flip
// for free (the tokens invert under `.dark`). recharts resolves the CSS var at
// paint time.

// Series palette, in the design language's order of emphasis: action (violet),
// live (lime), value (gold), danger (red), then a second violet/gold for a 5th/6th
// series. A single-series chart is violet.
const SERIES_COLORS = [
  "var(--color-accent-9)",
  "var(--color-brand-9)",
  "var(--color-gold-9)",
  "var(--color-danger-9)",
  "var(--color-accent-11)",
  "var(--color-gold-11)",
];

const AXIS_TEXT = "var(--color-text-muted)";
const GRID = "var(--color-border-subtle)";
const AXIS_LINE = "var(--color-border)";

export interface CategoryChartProps {
  type: ChartType;
  data: Array<Record<string, unknown>>;
  index: string;
  categories: string[];
  showLegend?: boolean;
  showGrid?: boolean;
  stack?: boolean;
  curve?: boolean;
  height?: number;
  className?: string;
}

export function CategoryChart({
  type,
  data,
  index,
  categories,
  showLegend = false,
  showGrid = true,
  stack = false,
  curve = true,
  height = 232,
  className,
}: CategoryChartProps) {
  const color = (i: number) => SERIES_COLORS[i % SERIES_COLORS.length];
  const tick = { fill: AXIS_TEXT, fontSize: 11 };
  const stackId = stack ? "a" : undefined;
  const curveType = curve ? "monotone" : "linear";

  const grid = showGrid ? (
    <CartesianGrid strokeDasharray="2 4" stroke={GRID} vertical={false} />
  ) : null;
  const xAxis = (
    <XAxis
      dataKey={index}
      tick={tick}
      tickLine={false}
      axisLine={{ stroke: AXIS_LINE }}
      minTickGap={16}
    />
  );
  const yAxis = (
    <YAxis tick={tick} tickLine={false} axisLine={false} width={40} />
  );
  const tooltip = (
    <Tooltip
      content={<ChartTooltip />}
      cursor={{ stroke: "var(--color-border-strong)", strokeWidth: 1 }}
    />
  );
  const legend = showLegend ? (
    <Legend content={<ChartLegend />} verticalAlign="top" height={28} />
  ) : null;

  const series = categories.map((cat, i) => {
    const c = color(i);
    if (type === "line")
      return (
        <Line
          key={cat}
          type={curveType}
          dataKey={cat}
          stroke={c}
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      );
    if (type === "bar")
      return (
        <Bar
          key={cat}
          dataKey={cat}
          fill={c}
          stackId={stackId}
          radius={[3, 3, 0, 0]}
          isAnimationActive={false}
        />
      );
    return (
      <Area
        key={cat}
        type={curveType}
        dataKey={cat}
        stroke={c}
        strokeWidth={2}
        fill={c}
        fillOpacity={0.15}
        stackId={stackId}
        dot={false}
        isAnimationActive={false}
      />
    );
  });

  const margin = { top: 4, right: 8, bottom: 0, left: 0 };
  const children = [grid, xAxis, yAxis, tooltip, legend, ...series];

  return (
    <div className={cx("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        {type === "bar" ? (
          <BarChart data={data} margin={margin}>
            {children}
          </BarChart>
        ) : type === "line" ? (
          <LineChart data={data} margin={margin}>
            {children}
          </LineChart>
        ) : (
          <AreaChart data={data} margin={margin}>
            {children}
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

interface TooltipEntry {
  dataKey?: string | number;
  name?: string | number;
  value?: number | string;
  color?: string;
}

function formatNum(v: unknown): string {
  if (typeof v === "number")
    return Number.isInteger(v) ? v.toLocaleString() : String(v);
  return String(v ?? "");
}

// A tooltip on our raised surface, matching the input-cell readout: swatch · key ·
// mono value. Props are a loose subset of recharts' tooltip payload.
function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-surface-raised px-2.5 py-1.5 text-xs shadow-md">
      <div className="mb-1 font-medium text-text-muted">{label}</div>
      <div className="space-y-0.5">
        {payload.map((p) => (
          <div key={String(p.dataKey)} className="flex items-center gap-2">
            <span
              className="size-2 shrink-0 rounded-[2px]"
              style={{ background: p.color }}
              aria-hidden
            />
            <span className="text-text-muted">{String(p.dataKey)}</span>
            <span className="ml-auto pl-3 font-mono text-text">
              {formatNum(p.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface LegendEntry {
  value?: string;
  color?: string;
}

function ChartLegend({ payload }: { payload?: LegendEntry[] }) {
  if (!payload?.length) return null;
  return (
    <div className="flex flex-wrap justify-end gap-x-3 gap-y-1 pb-1 text-xs text-text-muted">
      {payload.map((p) => (
        <span key={p.value} className="flex items-center gap-1.5">
          <span
            className="size-2 rounded-[2px]"
            style={{ background: p.color }}
            aria-hidden
          />
          {p.value}
        </span>
      ))}
    </div>
  );
}
