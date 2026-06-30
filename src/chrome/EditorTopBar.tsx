import { useState } from "react";
import { Button } from "../ui/Button";
import { SidebarTrigger } from "../ui/sidebar";
import { cx } from "../ui/cx";

// The editor's sticky top bar (mockup `.topbar`). Breadcrumb → home, a Live
// pill, and the tool cluster. Edit/Read is REAL (drives reading mode); the
// Document/Studio layout toggle, Trace toggle, and Share are visual-only this
// round. Stays mounted in reading mode so the reader can flip back to Edit.
// All action buttons use the shared <Button> primitive (src/ui/Button).
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
        <SidebarTrigger className="-ml-1" />
        <Button variant="ghost" onClick={onHome} className="px-1.5 py-0.5">
          Notebooks
        </Button>
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
        <Button
          variant="secondary"
          onClick={onToggleTrace}
          className={cx(
            traceOpen &&
              "border-value-border bg-value-bg text-value hover:border-value-border hover:text-value",
          )}
        >
          ◆ Trace
        </Button>
        <Seg
          options={[
            { value: "edit", label: "Edit" },
            { value: "read", label: "Read" },
          ]}
          value={reading ? "read" : "edit"}
          onChange={(v) => onToggleReading(v === "read")}
        />
        <Button variant="primary" onClick={onShare}>
          Share
        </Button>
      </div>
    </div>
  );
}

// A segmented control built from ghost <Button>s sharing one bordered track.
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
          <Button
            key={o.value}
            variant="ghost"
            onClick={() => onChange(o.value)}
            className={cx(
              "rounded-[7px] px-3 py-1.5",
              on
                ? "bg-surface text-text shadow-sm hover:bg-surface"
                : "hover:bg-transparent",
            )}
          >
            {o.label}
          </Button>
        );
      })}
    </div>
  );
}
