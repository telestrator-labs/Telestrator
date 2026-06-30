// The right context panel (mockup `.context`). Presentational this round: the
// runtime exposes only the `$` keys each cell *writes*, not a read/dependency
// graph, so a live reactive trace is a future milestone. Framed as a preview so
// it doesn't imply data it doesn't have.
export function TracePanel() {
  return (
    <aside className="sticky top-[57px] h-[calc(100vh-57px)] w-[264px] flex-none overflow-auto border-l border-border-subtle bg-surface px-[18px] py-5">
      <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-text-faint">
        On this page
      </div>
      <div className="rounded-[10px] border border-value-border bg-value-bg p-[13px]">
        <div className="flex items-center justify-between">
          <h4 className="text-[12.5px] font-semibold text-value">
            ◆ Reactive trace
          </h4>
          <span className="rounded-full border border-value-border px-1.5 text-[10px] font-medium uppercase tracking-[0.05em] text-value">
            Preview
          </span>
        </div>
        <p className="mt-1.5 text-[12px] leading-relaxed text-text-muted">
          What feeds what. Live dependency mapping — hover a <code>$</code>
          -value in the prose to light up the cells it drives — is coming with
          the trace engine.
        </p>
      </div>
    </aside>
  );
}
