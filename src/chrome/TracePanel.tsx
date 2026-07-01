import { useTraceGraph } from "../editor/RuntimeProvider";
import { useTrace } from "../editor/TraceContext";

// The right context panel: a live read-out of the reactive dependency graph —
// which `$` value feeds which cells — assembled from the runtime's per-cell
// read/write records. Hovering a row scopes the drawn trace to that value.
export function TracePanel() {
  const graph = useTraceGraph();
  const trace = useTrace();

  const rows = [...graph.values.entries()]
    .filter(([, v]) => v.readers.length > 0)
    .sort((a, b) => a[0].localeCompare(b[0]));

  return (
    <aside className="h-full w-[264px] flex-none overflow-auto border-l border-border-subtle bg-sidebar px-[18px] py-5">
      <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-text-faint">
        Reactive trace
      </div>
      <div className="rounded-[10px] border border-value-border bg-value-bg p-[13px]">
        <h4 className="text-[12.5px] font-semibold text-value">
          ◆ What feeds what
        </h4>
        <div className="mt-2 flex items-center gap-3 text-[11px] text-text-muted">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0 w-5 border-t-[2.4px] border-brand-10" />
            writes
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0 w-5 border-t-[1.7px] border-dashed border-brand-10" />
            reads
          </span>
        </div>

        {rows.length === 0 ? (
          <p className="mt-2.5 text-[12px] leading-relaxed text-text-muted">
            No live dependencies yet. When one cell reads a <code>$</code>-value
            another writes, the link shows up here — and the Trace draws it over
            the page.
          </p>
        ) : (
          <div className="mt-2.5 flex flex-col gap-1.5">
            {rows.map(([key, v]) => (
              <div
                key={key}
                onMouseEnter={() => trace.hoverValue(key)}
                onMouseLeave={() => trace.clearHover()}
                className="flex items-center gap-2 rounded px-1 py-0.5 font-mono text-[12px] text-text-muted hover:bg-surface-raised"
              >
                <span className="font-semibold text-gold-11">${key}</span>
                <span className="text-brand-11">→</span>
                <span>
                  {v.readers.length} cell{v.readers.length === 1 ? "" : "s"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
