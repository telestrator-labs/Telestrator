import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { ChartView } from "@/editor/cells/chart/ChartView";
import type { ChartConfig, ChartType } from "@/editor/cells/chart/chart";

// A chart block: a first-class viz cell. The mirror of an input cell — where an
// input writes a `$` value, a chart *reads* one (an author expression over `$`)
// and re-renders reactively. A block-level atom like inputCell / knowledgeCheck.
export const CHART_NODE = "chart";

export interface ChartAttributes {
  id: string | null;
  chartType: ChartType;
  // The data source: an expression evaluated in the runtime that reads `$` and
  // yields an array of row objects.
  expression: string;
  // The x-axis category field and the value series. Empty = inferred from data.
  index: string;
  categories: string[];
  config: ChartConfig;
}

// JSON attrs round-trip through ProseMirror/Yjs and the HTML clipboard via
// `data-*`; parse defensively.
function parseJSON<T>(raw: string | null, fallback: T): T {
  if (raw == null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export const Chart = Node.create({
  name: CHART_NODE,
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-id"),
        renderHTML: (attrs) => (attrs.id ? { "data-id": attrs.id } : {}),
      },
      chartType: {
        default: "area" as ChartType,
        parseHTML: (element) =>
          (element.getAttribute("data-chart-type") as ChartType) ?? "area",
        renderHTML: (attrs) => ({ "data-chart-type": attrs.chartType }),
      },
      // JSON-encoded so arbitrary expression text (quotes/newlines) survives.
      expression: {
        default: "",
        parseHTML: (element) =>
          parseJSON(element.getAttribute("data-expression"), ""),
        renderHTML: (attrs) => ({
          "data-expression": JSON.stringify(attrs.expression),
        }),
      },
      index: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-index") ?? "",
        renderHTML: (attrs) => ({ "data-index": attrs.index }),
      },
      categories: {
        default: [] as string[],
        parseHTML: (element) =>
          parseJSON<string[]>(element.getAttribute("data-categories"), []),
        renderHTML: (attrs) => ({
          "data-categories": JSON.stringify(attrs.categories),
        }),
      },
      config: {
        default: {} as ChartConfig,
        parseHTML: (element) =>
          parseJSON<ChartConfig>(element.getAttribute("data-config"), {}),
        renderHTML: (attrs) => ({
          "data-config": JSON.stringify(attrs.config),
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-chart]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes({ "data-chart": "" }, HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ChartView);
  },
});
