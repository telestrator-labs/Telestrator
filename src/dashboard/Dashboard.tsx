import type { NotebookEntry } from "../editor/docIndex";
import { templates, type NotebookTemplate } from "../templates";
import { TemplateCard } from "./TemplateCard";
import { NotebookCard } from "./NotebookCard";

// The landing screen. Two grids: "Start from a template" (well-defined use
// cases) and "Your notebooks" (existing docs from the index). The filter chips
// are presentational this round.
export function Dashboard({
  docs,
  onOpen,
  onCreateBlank,
  onCreateFromTemplate,
  onDelete,
}: {
  docs: NotebookEntry[];
  onOpen: (id: string) => void;
  onCreateBlank: () => void;
  onCreateFromTemplate: (template: NotebookTemplate) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="mx-auto w-full max-w-[1080px] px-10 pt-[34px] pb-20">
      <div>
        <h1 className="text-[30px] font-semibold tracking-tight text-text">
          Your notebooks
        </h1>
        <p className="mt-1.5 max-w-[54ch] text-[14.5px] leading-relaxed text-text-muted">
          Reactive documents where prose and live code share state — write the
          explanation and the thing it explains as one artifact.
        </p>
      </div>

      <section>
        <h2 className="mt-7 mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-text-faint">
          Start from a template
        </h2>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-[18px]">
          {templates.map((t) => (
            <TemplateCard
              key={t.id}
              template={t}
              onPick={onCreateFromTemplate}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mt-9 mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-text-faint">
          Your notebooks
        </h2>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-[18px]">
          <button
            type="button"
            onClick={onCreateBlank}
            className="flex min-h-[200px] flex-col items-center justify-center gap-2.5 rounded-[14px] border-[1.5px] border-dashed border-border-strong text-text-faint hover:border-action-border hover:bg-action-subtle hover:text-action-text"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full border-[1.5px] border-current text-[22px] font-light">
              +
            </span>
            <span className="text-[14px] font-medium">New notebook</span>
          </button>
          {docs.map((d) => (
            <NotebookCard
              key={d.id}
              entry={d}
              onOpen={onOpen}
              onDelete={onDelete}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
