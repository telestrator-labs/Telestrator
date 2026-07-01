import type { ReactNode } from "react";
import { Button } from "../ui/Button";
import { SidebarTrigger } from "../ui/Sidebar.tsx";
import { useRuntime, useDocumentLive } from "@/editor/reactive/RuntimeProvider";
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
  const documentLive = useDocumentLive();
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
        {/* Live indicator + document runtime reset. Only shown once the document
            is actually reactive — a cell reads or writes a valid `$` value — so
            "Live" means something (and there's a runtime worth restarting). */}
        {documentLive && (
          <span className="ml-1 inline-flex items-center gap-1.5 rounded-full border border-brand-5 bg-live-subtle py-0.5 pl-2 pr-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-live-text">
            <span className="size-1.5 rounded-full bg-live" />
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
        )}
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
              "border-accent-7 bg-accent-3 text-accent-11 hover:border-accent-7 hover:text-accent-11",
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
              "border-transparent bg-gold-9 text-white hover:border-transparent hover:bg-gold-10 hover:text-white",
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
      viewBox="0 0 256 256"
      fill="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {wide ? (
        <>
          <path d="M216.49,56.48,177,96h19a12,12,0,0,1,0,24H148a12,12,0,0,1-12-12V60a12,12,0,0,1,24,0V79l39.51-39.52a12,12,0,0,1,17,17ZM108,136H60a12,12,0,0,0,0,24H79L39.51,199.51a12,12,0,0,0,17,17L96,177v19a12,12,0,0,0,24,0V148A12,12,0,0,0,108,136Z"></path>
        </>
      ) : (
        <>
          <path d="M220,48V96a12,12,0,0,1-24,0V77l-39.51,39.52a12,12,0,0,1-17-17L179,60H160a12,12,0,0,1,0-24h48A12,12,0,0,1,220,48ZM99.51,139.51,60,179V160a12,12,0,0,0-24,0v48a12,12,0,0,0,12,12H96a12,12,0,0,0,0-24H77l39.52-39.51a12,12,0,0,0-17-17Z"></path>
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
      viewBox="0 0 256 256"
      fill="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M28,64A12,12,0,0,1,40,52H216a12,12,0,0,1,0,24H40A12,12,0,0,1,28,64Zm12,52H168a12,12,0,0,0,0-24H40a12,12,0,0,0,0,24Zm176,16H40a12,12,0,0,0,0,24H216a12,12,0,0,0,0-24Zm-48,40H40a12,12,0,0,0,0,24H168a12,12,0,0,0,0-24Z"></path>
    </svg>
  );
}

function StudioIcon() {
  return (
    <svg
      className="size-[15px]"
      viewBox="0 0 256 256"
      fill="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M216,36H40A20,20,0,0,0,20,56V200a20,20,0,0,0,20,20H216a20,20,0,0,0,20-20V56A20,20,0,0,0,216,36ZM44,60H76V196H44ZM212,196H100V60H212Z"></path>
    </svg>
  );
}

// Trace = the reactive dependency graph (what feeds what): connected nodes.
function TraceIcon() {
  return (
    <svg
      className="size-4"
      viewBox="0 0 256 256"
      fill="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M200,164a36.07,36.07,0,0,0-33.94,24H72a28,28,0,0,1,0-56h96a44,44,0,0,0,0-88H72a12,12,0,0,0,0,24h96a20,20,0,0,1,0,40H72a52,52,0,0,0,0,104h94.06A36,36,0,1,0,200,164Zm0,48a12,12,0,1,1,12-12A12,12,0,0,1,200,212Z"></path>
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg
      className="size-4"
      viewBox="0 0 256 256"
      fill="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M176,156a43.78,43.78,0,0,0-29.09,11L106.1,140.8a44.07,44.07,0,0,0,0-25.6L146.91,89a43.83,43.83,0,1,0-13-20.17L93.09,95a44,44,0,1,0,0,65.94L133.9,187.2A44,44,0,1,0,176,156Zm0-120a20,20,0,1,1-20,20A20,20,0,0,1,176,36ZM64,148a20,20,0,1,1,20-20A20,20,0,0,1,64,148Zm112,72a20,20,0,1,1,20-20A20,20,0,0,1,176,220Z"></path>
    </svg>
  );
}
