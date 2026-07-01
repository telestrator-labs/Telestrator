import type { ReactNode } from "react";
import { Button } from "../ui/Button";
import { SidebarTrigger } from "../ui/sidebar";
import { useRuntime } from "../editor/RuntimeProvider";
import { cx } from "../ui/cx";

export type NotebookLayout = "document" | "studio";

// The editor's sticky top bar (mockup `.topbar`). Breadcrumb → home, a Live
// pill + runtime reset, and the tool cluster. Edit/Read drives reading mode and
// the expand button drives the wide container; the Document/Studio view toggle,
// Trace, and Share are visual-only this round. Stays mounted in reading mode so
// the reader can flip back. All action buttons use the shared <Button> primitive.
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
  const runtime = useRuntime();
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
        {/* Live indicator + document runtime reset — the runtime's home now that
            the editor toolbar is gone. */}
        <span className="ml-1 inline-flex items-center gap-1.5 rounded-full border border-brand-5 bg-live-subtle py-0.5 pl-2 pr-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-live-text">
          <span className="h-[6px] w-[6px] rounded-full bg-live" />
          Live
          <button
            type="button"
            title="Restart runtime"
            aria-label="Restart runtime"
            onClick={() => runtime.restart()}
            className="ml-0.5 grid size-4 place-items-center rounded-full text-live-text/80 outline-none hover:bg-live/20 hover:text-live-text focus-visible:ring-2 focus-visible:ring-brand-8"
          >
            <RestartIcon />
          </button>
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Seg
          options={[
            { value: "document", label: "Document", icon: <DocumentIcon /> },
            { value: "studio", label: "Studio", icon: <StudioIcon /> },
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
          aria-pressed={traceOpen}
          className={cx(
            "gap-1.5",
            traceOpen &&
              "border-transparent bg-brand-9 text-brand-contrast hover:border-transparent hover:bg-brand-9 hover:text-brand-contrast",
          )}
        >
          <TraceIcon />
          Trace
        </Button>
        <Seg
          options={[
            { value: "edit", label: "Edit" },
            { value: "read", label: "Read" },
          ]}
          value={reading ? "read" : "edit"}
          onChange={(v) => onToggleReading(v === "read")}
        />
        {/* Inverse (ink-on-surface) fill — the bar's one high-commitment action. */}
        <Button
          variant="secondary"
          onClick={onShare}
          className="gap-1.5 border-transparent bg-text text-surface hover:border-transparent hover:bg-text-muted hover:text-surface"
        >
          <ShareIcon />
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

function RestartIcon() {
  return (
    <svg
      className="size-3"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M13 8a5 5 0 1 1-1.46-3.54" />
      <path d="M13 2.5V5h-2.5" />
    </svg>
  );
}

// A segmented control built from ghost <Button>s sharing one bordered track.
// The active option lifts onto the raised surface — a quiet toggle; the lime
// accent is reserved for the live/reactive affordances (Trace), not view state.
function Seg({
  options,
  value,
  onChange,
}: {
  options: Array<{ value: string; label: string; icon?: ReactNode }>;
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
              "gap-1.5 rounded-[7px] px-3 py-1.5",
              on
                ? "bg-surface text-text shadow-sm hover:bg-surface"
                : "hover:bg-transparent",
            )}
          >
            {o.icon}
            {o.label}
          </Button>
        );
      })}
    </div>
  );
}

// Leading icons. Document = a page; Studio = an author's panel/sliders view.
function DocumentIcon() {
  return (
    <svg
      className="size-[15px]"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 1.75h5L12.25 5v9.25H4z" />
      <path d="M9 1.75V5h3.25" />
      <path d="M6 8.5h4M6 11h4" />
    </svg>
  );
}

function StudioIcon() {
  return (
    <svg
      className="size-[15px]"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2.75 4.5h10.5M2.75 11.5h10.5" />
      <circle cx="6" cy="4.5" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="10.5" cy="11.5" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

// Trace = the reactive dependency graph (what feeds what): connected nodes.
function TraceIcon() {
  return (
    <svg
      className="size-4"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 4.5l3.5 3.5M8.5 8L12 11.5M8 8l3.5-3.5" />
      <circle cx="3.5" cy="4" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="12.5" cy="4" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="12.5" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg
      className="size-4"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="3.5" r="1.75" />
      <circle cx="4" cy="8" r="1.75" />
      <circle cx="12" cy="12.5" r="1.75" />
      <path d="M5.6 7.1l4.8-2.6M5.6 8.9l4.8 2.6" />
    </svg>
  );
}
