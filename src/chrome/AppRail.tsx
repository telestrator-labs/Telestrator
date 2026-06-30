import type { NotebookEntry } from "../editor/docIndex";

// The persistent left rail (mockup's `.rail`): brand → home, a visual search
// affordance, the notebook list, and a user footer. Shared by the dashboard and
// the editor; hidden in reading mode. Live/idle dots are presentational — the
// index tracks no per-notebook run state yet.
export function AppRail({
  docs,
  selectedId,
  onOpen,
  onNewBlank,
  onHome,
}: {
  docs: NotebookEntry[];
  selectedId: string | null;
  onOpen: (id: string) => void;
  onNewBlank: () => void;
  onHome: () => void;
}) {
  return (
    <aside className="sticky top-0 flex h-screen w-[248px] flex-none flex-col border-r border-border-subtle bg-surface">
      <div className="px-4 pt-[18px] pb-2">
        <button
          type="button"
          onClick={onHome}
          className="flex items-center gap-2.5 text-left"
        >
          <span className="relative flex h-[26px] w-[26px] items-center justify-center overflow-hidden rounded-[7px] bg-gray-12">
            <span className="h-2.5 w-2.5 rounded-full bg-live shadow-[0_0_0_3px_var(--color-brand-a5)]" />
          </span>
          <span>
            <span className="block text-[15px] font-semibold tracking-tight text-text">
              Telestrator
            </span>
            <span className="block text-[10px] uppercase tracking-[0.12em] text-text-faint">
              Reactive notebook
            </span>
          </span>
        </button>
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-border-subtle bg-surface-raised px-2.5 py-[7px] text-[13px] text-text-faint">
          <SearchIcon />
          <span>Search notebooks…</span>
        </div>
      </div>

      <div className="px-4 pt-3.5 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-text-faint">
        Notebooks
      </div>
      <div className="flex-1 overflow-auto pb-2">
        {docs.map((d) => {
          const active = d.id === selectedId;
          return (
            <button
              type="button"
              key={d.id}
              onClick={() => onOpen(d.id)}
              className={
                "mx-2 my-px flex w-[calc(100%-1rem)] items-center gap-2.5 rounded-[7px] px-4 py-[7px] text-left text-[13.5px] leading-tight " +
                (active
                  ? "bg-interactive-subtle font-medium text-interactive-text"
                  : "text-text-muted hover:bg-surface-raised")
              }
            >
              <span
                className={
                  "h-[7px] w-[7px] flex-none rounded-full " +
                  (active ? "bg-live" : "bg-gray-6")
                }
              />
              <span className="truncate">{d.title || "Untitled notebook"}</span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={onNewBlank}
          className="mx-4 mt-2.5 flex w-[calc(100%-2rem)] items-center justify-center gap-2 rounded-[9px] border border-dashed border-border-strong px-3 py-2.5 text-[13px] font-medium text-text-muted hover:border-interactive-border hover:bg-interactive-subtle hover:text-interactive-text"
        >
          <span className="text-[15px] leading-none">+</span> New notebook
        </button>
      </div>

      <div className="flex items-center gap-2.5 border-t border-border-subtle px-4 py-3">
        <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-accent-5 text-[12px] font-semibold text-interactive-text">
          You
        </span>
        <span className="text-[12.5px] leading-tight">
          <span className="block font-semibold text-text">Your workspace</span>
          <span className="block text-[11px] text-text-faint">
            Local · this device
          </span>
        </span>
      </div>
    </aside>
  );
}

function SearchIcon() {
  return (
    <svg
      className="h-[15px] w-[15px] flex-none"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
    >
      <circle cx="7" cy="7" r="4.5" />
      <path d="M11 11l3 3" />
    </svg>
  );
}
