import { cx } from "./cx";
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
} from "./Popover";

// A configurable toolbar: a bordered, segmented control (Deepnote-style insert
// bar) where each action is a labeled cell, optionally with a dropdown of
// variants. Group with separators by passing an array of arrays.
export type ToolbarItem = {
  label: string;
  hint?: string;
  onSelect: () => void;
};

export type ToolbarAction = {
  key: string;
  label?: React.ReactNode;
  icon?: React.ReactNode;
  title?: string;
  active?: boolean;
  onClick?: () => void;
  items?: ToolbarItem[]; // when present, the cell opens a dropdown
};

const cell =
  "flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-text outline-none transition-colors hover:bg-surface-raised focus-visible:bg-surface-raised";

export function Toolbar({
  groups,
  className,
}: {
  groups: ToolbarAction[][];
  className?: string;
}) {
  return (
    <div
      className={cx(
        "inline-flex items-stretch divide-x divide-border overflow-hidden rounded-lg border border-border bg-surface",
        className,
      )}
    >
      {groups.map((group, i) => (
        <div key={i} className="flex items-stretch divide-x divide-border">
          {group.map((action) => (
            <ToolbarCell key={action.key} action={action} />
          ))}
        </div>
      ))}
    </div>
  );
}

function ToolbarCell({ action }: { action: ToolbarAction }) {
  if (action.items) {
    return (
      <Popover>
        <PopoverTrigger className={cx(cell, "pr-2.5")} title={action.title}>
          {action.icon}
          {action.label}
          <Chevron />
        </PopoverTrigger>
        <PopoverContent align="start" className="w-48 p-1">
          {action.items.map((item) => (
            <PopoverClose asChild key={item.label}>
              <button
                type="button"
                onClick={item.onSelect}
                className="flex w-full items-center justify-between gap-3 rounded px-2 py-1.5 text-left text-[13px] text-text hover:bg-action-subtle hover:text-action-text"
              >
                {item.label}
                {item.hint && (
                  <span className="font-mono text-[11px] text-text-faint">
                    {item.hint}
                  </span>
                )}
              </button>
            </PopoverClose>
          ))}
        </PopoverContent>
      </Popover>
    );
  }
  return (
    <button
      type="button"
      onClick={action.onClick}
      title={action.title}
      className={cx(
        cell,
        action.active &&
          "bg-action-subtle text-action-text hover:bg-action-subtle",
      )}
    >
      {action.icon}
      {action.label}
    </button>
  );
}

function Chevron() {
  return (
    <svg
      className="size-3 text-text-faint"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 6l4 4 4-4" />
    </svg>
  );
}
