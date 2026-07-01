import type { NotebookEntry } from "../editor/docIndex";
import { DocBadge } from "../chrome/DocBadge";
import { Sparkline } from "./Sparkline";

// A card for an existing notebook. Opens on click; the ✕ deletes (stops
// propagation so it doesn't also open).
export function NotebookCard({
  entry,
  onOpen,
  onDelete,
}: {
  entry: NotebookEntry;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(entry.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onOpen(entry.id);
      }}
      className="group flex cursor-pointer flex-col overflow-hidden rounded-[14px] border border-border-subtle bg-surface text-left shadow-sm transition-[transform,border-color] duration-150 hover:-translate-y-0.5 hover:border-border-strong"
    >
      <Sparkline seed={entry.id} />
      <div className="px-4 pt-3 pb-[15px]">
        <div className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-text">
          <DocBadge id={entry.id} title={entry.title || "Untitled notebook"} />
          <span className="truncate">{entry.title || "Untitled notebook"}</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-[12px] text-text-faint">
          <span>updated {timeAgo(entry.updatedAt)}</span>
          <button
            type="button"
            title="Delete notebook"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(entry.id);
            }}
            className="rounded px-1 text-text-faint opacity-0 transition-opacity hover:text-danger-text group-hover:opacity-100"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

function timeAgo(ts: number): string {
  if (!ts) return "just now";
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}
