import { Button } from "../ui/Button";
import { SidebarTrigger } from "../ui/sidebar";
import { cx } from "../ui/cx";

export type NotebookLayout = "document" | "studio";

// The editor's sticky top bar (mockup `.topbar`). Breadcrumb → home, a Live
// pill, and the tool cluster. Edit/Read drives reading mode and the expand
// button drives the wide container; the Document/Studio view toggle, Trace, and
// Share are visual-only this round. Stays mounted in reading mode so the reader
// can flip back. All action buttons use the shared <Button> primitive.
export function EditorTopBar({
  title,
  reading,
  onToggleReading,
  onHome,
  traceOpen,
  onToggleTrace,
  onShare,
  layout,
  onLayoutChange,
  wide,
  onToggleWide,
}: {
  title: string;
  reading: boolean;
  onToggleReading: (reading: boolean) => void;
  onHome: () => void;
  traceOpen: boolean;
  onToggleTrace: () => void;
  onShare: () => void;
  // Document vs. Studio (an author-focused view) — visual-only for now.
  layout: NotebookLayout;
  onLayoutChange: (layout: NotebookLayout) => void;
  // The dedicated container-width toggle (constrained ↔ wide).
  wide: boolean;
  onToggleWide: () => void;
}) {
  return (
    <div className="flex shrink-0 items-center justify-between gap-4 border-b border-border-subtle bg-surface-sunken/85 px-[26px] py-3 backdrop-blur">
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
          onChange={(v) => onLayoutChange(v as NotebookLayout)}
        />
        <Button
          variant="secondary"
          onClick={onToggleWide}
          title={wide ? "Constrain width" : "Expand width"}
          aria-pressed={wide}
          className={cx(
            "px-2",
            wide &&
              "border-action-border bg-action-subtle text-action-text hover:border-action-border hover:text-action-text",
          )}
        >
          <ExpandIcon wide={wide} />
        </Button>
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

// Outward chevrons = expand the measure; inward = constrain it back.
function ExpandIcon({ wide }: { wide: boolean }) {
  return (
    <svg
      className="size-4"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {wide ? (
        <>
          <path d="M3 5l3 3-3 3M13 5l-3 3 3 3" />
          <path d="M6 8h4" />
        </>
      ) : (
        <>
          <path d="M6 5L3 8l3 3M10 5l3 3-3 3" />
          <path d="M3 8h10" />
        </>
      )}
    </svg>
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
