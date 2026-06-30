import { useState } from "react";

// The editor's sticky top bar (mockup `.topbar`). Breadcrumb → home, a Live
// pill, and the tool cluster. Edit/Read is REAL (drives reading mode); the
// Document/Studio layout toggle, Trace toggle, and Share are visual-only this
// round. Stays mounted in reading mode so the reader can flip back to Edit.
export function EditorTopBar({
  title,
  reading,
  onToggleReading,
  onHome,
  traceOpen,
  onToggleTrace,
  onShare,
}: {
  title: string;
  reading: boolean;
  onToggleReading: (reading: boolean) => void;
  onHome: () => void;
  traceOpen: boolean;
  onToggleTrace: () => void;
  onShare: () => void;
}) {
  // Visual-only: a denser "studio" layout is a future milestone.
  const [layout, setLayout] = useState<"document" | "studio">("document");

  return (
    <div className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-border-subtle bg-surface-sunken/85 px-[26px] py-3 backdrop-blur">
      <div className="flex min-w-0 items-center gap-2 text-[13px] text-text-faint">
        <button
          type="button"
          onClick={onHome}
          className="text-text-muted hover:text-text"
        >
          Notebooks
        </button>
        <span>/</span>
        <span className="truncate font-medium text-text">
          {title || "Untitled notebook"}
        </span>
        <span className="ml-1 inline-flex items-center gap-1.5 rounded-full border border-brand-5 bg-live-subtle px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-live-text">
          <span className="h-[6px] w-[6px] rounded-full bg-live" />
          Live
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Seg
          options={[
            { value: "document", label: "Document" },
            { value: "studio", label: "Studio" },
          ]}
          value={layout}
          onChange={(v) => setLayout(v as "document" | "studio")}
        />
        <button
          type="button"
          onClick={onToggleTrace}
          className={
            "flex items-center gap-1.5 rounded-lg border px-3 py-[7px] text-[12.5px] font-medium " +
            (traceOpen
              ? "border-value-border bg-value-bg text-value"
              : "border-border bg-surface text-text-muted hover:border-border-strong")
          }
        >
          ◆ Trace
        </button>
        <Seg
          options={[
            { value: "edit", label: "Edit" },
            { value: "read", label: "Read" },
          ]}
          value={reading ? "read" : "edit"}
          onChange={(v) => onToggleReading(v === "read")}
        />
        <button
          type="button"
          onClick={onShare}
          className="flex items-center gap-1.5 rounded-lg bg-interactive px-3 py-[7px] text-[12.5px] font-medium text-white hover:bg-interactive-hover"
        >
          Share
        </button>
      </div>
    </div>
  );
}

function Seg({
  options,
  value,
  onChange,
}: {
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex rounded-[9px] border border-border-subtle bg-surface-raised p-0.5">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            type="button"
            key={o.value}
            onClick={() => onChange(o.value)}
            className={
              "rounded-[7px] px-3 py-1.5 text-[12.5px] font-medium " +
              (on
                ? "bg-surface text-text shadow-sm"
                : "text-text-muted hover:text-text")
            }
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
