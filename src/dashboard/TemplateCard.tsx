import type { NotebookTemplate } from "../templates";
import { Sparkline } from "./Sparkline";

// A "start from a template" card. Clicking instantiates the template and opens
// the new notebook.
export function TemplateCard({
  template,
  onPick,
}: {
  template: NotebookTemplate;
  onPick: (template: NotebookTemplate) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onPick(template)}
      className="group flex flex-col overflow-hidden rounded-[14px] border border-border-subtle bg-surface text-left shadow-sm transition-[transform,border-color] duration-150 hover:-translate-y-0.5 hover:border-border-strong"
    >
      <Sparkline seed={template.id} accent />
      <div className="px-4 pt-3 pb-4">
        <div className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-text">
          <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-interactive-text">
            Template
          </span>
        </div>
        <div className="mt-1 text-[15px] font-semibold tracking-tight text-text">
          {template.title}
        </div>
        <p className="mt-1.5 text-[12.5px] leading-snug text-text-muted">
          {template.description}
        </p>
      </div>
    </button>
  );
}
