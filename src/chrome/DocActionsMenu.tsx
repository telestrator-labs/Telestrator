import { SidebarMenuAction } from "../ui/Sidebar.tsx";
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
} from "../ui/Popover";
import { cx } from "../ui/cx";

// Per-notebook document actions in the sidebar. The "⋯" reveals on row hover (or
// while its menu is open) and opens this menu. Delete is wired to the real
// removal; Rename/Duplicate/Move are still inert scaffolding pending the
// document-management work that will wire them up.
const ACTIONS: { key: string; label: string; icon: React.ReactNode }[] = [
  { key: "rename", label: "Rename", icon: <PencilIcon /> },
  { key: "duplicate", label: "Duplicate", icon: <CopyIcon /> },
  { key: "move", label: "Move to…", icon: <MoveIcon /> },
];

export function DocActionsMenu({
  title,
  onDelete,
}: {
  title: string;
  onDelete: () => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <SidebarMenuAction
          showOnHover
          aria-label="Document actions"
          title="Document actions"
          // Stay visible while the menu is open, not just on hover.
          className="top-1.5 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground data-[state=open]:opacity-100"
        >
          <DotsIcon />
        </SidebarMenuAction>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="right"
        sideOffset={6}
        className="w-48 p-1"
      >
        <div className="truncate px-2 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-text-faint">
          {title}
        </div>
        {ACTIONS.map((a) => (
          <ActionItem key={a.key} icon={a.icon} label={a.label} />
        ))}
        <div className="my-1 h-px bg-border-subtle" />
        <ActionItem
          icon={<TrashIcon />}
          label="Delete"
          danger
          onSelect={onDelete}
        />
      </PopoverContent>
    </Popover>
  );
}

function ActionItem({
  icon,
  label,
  danger,
  onSelect,
}: {
  icon: React.ReactNode;
  label: string;
  danger?: boolean;
  // Omitted for the still-inert actions — the item just closes the menu.
  onSelect?: () => void;
}) {
  return (
    <PopoverClose asChild>
      <button
        type="button"
        onClick={onSelect}
        className={cx(
          "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-[13px]",
          danger
            ? "text-danger-text hover:bg-danger-bg"
            : "text-text-muted hover:bg-surface-raised hover:text-text",
        )}
      >
        <span className="flex size-4 flex-none items-center justify-center text-current/80">
          {icon}
        </span>
        {label}
      </button>
    </PopoverClose>
  );
}

function DotsIcon() {
  return (
    <svg className="size-4" viewBox="0 0 16 16" fill="currentColor">
      <circle cx="3.5" cy="8" r="1.35" />
      <circle cx="8" cy="8" r="1.35" />
      <circle cx="12.5" cy="8" r="1.35" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg
      className="size-3.5"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 2.5l2.5 2.5L6 12.5l-3 .5.5-3z" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg
      className="size-3.5"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" />
      <path d="M10.5 5.5V4A1.5 1.5 0 0 0 9 2.5H4A1.5 1.5 0 0 0 2.5 4v5A1.5 1.5 0 0 0 4 10.5h1.5" />
    </svg>
  );
}

function MoveIcon() {
  return (
    <svg
      className="size-3.5"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 4.5A1.5 1.5 0 0 1 3.5 3h2.2l1.3 1.5H12.5A1.5 1.5 0 0 1 14 6v5.5A1.5 1.5 0 0 1 12.5 13h-9A1.5 1.5 0 0 1 2 11.5z" />
      <path d="M7.5 9.5h3M9 8l1.5 1.5L9 11" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      className="size-3.5"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.5 8h6l.5-8" />
    </svg>
  );
}
