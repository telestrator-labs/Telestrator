import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useTraceGraph } from "./RuntimeProvider";
import { useTrace } from "./TraceContext";

interface Edge {
  key: string;
  cls: string;
  d: string;
}
interface Node {
  key: string;
  cx: number;
  cy: number;
  label: string;
}

const APEX_INSET = 78; // how far left of the measure the value node parks
const CTRL = 34; // bezier control-point reach

// The provenance drawing. An SVG layer over the notebook measure that, for each
// active `$` value, draws a solid lime edge from its writer cell out to a gold
// value node in the left margin and dashed lime edges from there to each reader
// cell. Geometry is measured from live DOM rects (cells carry data-cellid), so
// it re-computes on scroll/resize. Ported from the design prototype's buildTrace.
export function TraceOverlay() {
  const graph = useTraceGraph();
  const { activeValues, pinned } = useTrace();
  const svgRef = useRef<SVGSVGElement>(null);
  const [geo, setGeo] = useState<{ edges: Edge[]; nodes: Node[] }>({
    edges: [],
    nodes: [],
  });

  // Recompute the drawing from current DOM rects. Cheap; called on layout and on
  // scroll/resize via rAF.
  const rebuild = () => {
    const svg = svgRef.current;
    const root = svg?.parentElement;
    if (!svg || !root) return;
    if (activeValues.size === 0) {
      setGeo((g) =>
        g.edges.length || g.nodes.length ? { edges: [], nodes: [] } : g,
      );
      return;
    }
    const o = svg.getBoundingClientRect();
    const scroll = svg.closest<HTMLElement>('[data-slot="notebook-scroll"]');
    const gutterLeft = scroll ? scroll.getBoundingClientRect().left : 0;
    const rect = (id: string) => {
      const el = root.querySelector<HTMLElement>(`[data-cellid="${id}"]`);
      return el ? el.getBoundingClientRect() : null;
    };

    const edges: Edge[] = [];
    const nodes: Node[] = [];
    for (const key of activeValues) {
      const g = graph.values.get(key);
      if (!g) continue;
      const wr = rect(g.writer);
      const rrs = g.readers.map(rect).filter((r): r is DOMRect => !!r);
      if (!wr || rrs.length === 0) continue; // need both ends to draw an edge

      const wy = wr.top - o.top + wr.height / 2;
      const rys = rrs.map((r) => r.top - o.top + r.height / 2);
      const meanRy = rys.reduce((a, b) => a + b, 0) / rys.length;
      const apexY = (wy + meanRy) / 2;
      const apexXview = Math.max(gutterLeft + 16, o.left - APEX_INSET);
      const apexX = apexXview - o.left;
      const roomy = o.left - apexXview >= 52;
      const wx = wr.left - o.left + 2;

      edges.push({
        key: `w:${key}`,
        cls: "trace-conn trace-conn--write",
        d: `M ${wx} ${wy} C ${wx - CTRL} ${wy}, ${apexX + CTRL} ${apexY}, ${apexX} ${apexY}`,
      });
      rrs.forEach((r, i) => {
        const rx = r.left - o.left + 2;
        const ry = r.top - o.top + r.height / 2;
        edges.push({
          key: `r:${key}:${i}`,
          cls: "trace-conn trace-conn--read",
          d: `M ${apexX} ${apexY} C ${apexX + CTRL} ${apexY}, ${rx - CTRL} ${ry}, ${rx} ${ry}`,
        });
      });
      nodes.push({
        key: `n:${key}`,
        cx: apexX,
        cy: apexY,
        label: roomy ? `$.${key}` : "",
      });
    }
    setGeo({ edges, nodes });
  };

  // Rebuild when the active set or graph changes (after layout so rects are current).
  useLayoutEffect(() => {
    const id = requestAnimationFrame(rebuild);
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeValues, graph]);

  // Keep the drawing glued to the cells as the page scrolls or the window resizes.
  useEffect(() => {
    if (activeValues.size === 0) return;
    let frame = 0;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(rebuild);
    };
    const scroll = svgRef.current?.closest<HTMLElement>(
      '[data-slot="notebook-scroll"]',
    );
    scroll?.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    const ro = new ResizeObserver(schedule);
    if (svgRef.current?.parentElement) ro.observe(svgRef.current.parentElement);
    return () => {
      cancelAnimationFrame(frame);
      scroll?.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeValues, graph]);

  return (
    <>
      <svg className="trace-overlay" ref={svgRef} aria-hidden>
        <defs>
          <marker
            id="trace-arrow"
            viewBox="0 0 10 10"
            refX="8.5"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto"
          >
            <path d="M0 0L10 5L0 10z" fill="var(--color-brand-10)" />
          </marker>
        </defs>
        {geo.edges.map((e) => (
          <path
            key={e.key}
            className={e.cls}
            d={e.d}
            markerEnd="url(#trace-arrow)"
          />
        ))}
        {geo.nodes.map((n) => (
          <g key={n.key}>
            <circle className="trace-node-dot" cx={n.cx} cy={n.cy} r={7} />
            {n.label && (
              <text className="trace-node-label" x={n.cx} y={n.cy - 15}>
                {n.label}
              </text>
            )}
          </g>
        ))}
      </svg>
      {pinned && geo.edges.length > 0 && (
        <div className="trace-legend" aria-hidden>
          <div className="trace-legend__row">
            <span className="trace-legend__line" />
            writes
          </div>
          <div className="trace-legend__row">
            <span className="trace-legend__line trace-legend__line--read" />
            reads
          </div>
        </div>
      )}
    </>
  );
}
