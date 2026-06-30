import type { NotebookEntry } from "../editor/docIndex";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "../ui/sidebar";

// Placeholder sub-documents shown under the open notebook. Sub-documents aren't
// a real model concept yet — these are stubs to exercise the nested sidebar
// (the tree a notebook's outline/sections will hang off later).
const SUBDOC_STUBS = ["Overview", "Notes", "Appendix"];

// The app sidebar, composed from the vendored shadcn sidebar (src/ui/sidebar).
// Collapsible to an icon rail; toggle with the topbar trigger or Cmd/Ctrl+B.
export function AppSidebar({
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
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              onClick={onHome}
              tooltip="Telestrator"
              className="group-data-[collapsible=icon]:!p-1"
            >
              <span className="relative flex size-6 flex-none items-center justify-center overflow-hidden rounded-[7px] bg-gray-12">
                <span className="size-2.5 rounded-full bg-live shadow-[0_0_0_3px_var(--color-brand-a5)]" />
              </span>
              <span className="flex flex-col group-data-[collapsible=icon]:hidden">
                <span className="text-[15px] font-semibold tracking-tight text-sidebar-foreground">
                  Telestrator
                </span>
                <span className="text-[10px] uppercase tracking-[0.12em] text-sidebar-foreground/60">
                  Reactive notebook
                </span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="flex items-center gap-2 rounded-lg border border-sidebar-border bg-surface-raised px-2.5 py-[7px] text-[13px] text-sidebar-foreground/60 group-data-[collapsible=icon]:hidden">
          <SearchIcon />
          <span>Search notebooks…</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Notebooks</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {docs.map((d) => {
                const active = d.id === selectedId;
                const title = d.title || "Untitled notebook";
                return (
                  <SidebarMenuItem key={d.id}>
                    <SidebarMenuButton
                      isActive={active}
                      onClick={() => onOpen(d.id)}
                      tooltip={title}
                    >
                      <span
                        className={
                          "size-[7px] flex-none rounded-full " +
                          (active ? "bg-live" : "bg-gray-6")
                        }
                      />
                      <span className="truncate">{title}</span>
                    </SidebarMenuButton>
                    {/* Sub-document stubs for the open notebook. */}
                    {active && (
                      <SidebarMenuSub>
                        {SUBDOC_STUBS.map((s) => (
                          <SidebarMenuSubItem key={s}>
                            <SidebarMenuSubButton
                              role="button"
                              tabIndex={0}
                              title={`${s} (coming soon)`}
                            >
                              {s}
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    )}
                  </SidebarMenuItem>
                );
              })}
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={onNewBlank}
                  tooltip="New notebook"
                  className="border border-dashed border-sidebar-border text-sidebar-foreground/70"
                >
                  <PlusIcon />
                  <span className="truncate">New notebook</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip="Your workspace"
              className="group-data-[collapsible=icon]:!p-1"
            >
              <span className="flex size-6 flex-none items-center justify-center rounded-full bg-accent-5 text-[11px] font-semibold text-action-text">
                You
              </span>
              <span className="flex flex-col group-data-[collapsible=icon]:hidden">
                <span className="text-[13px] font-medium text-sidebar-foreground">
                  Your workspace
                </span>
                <span className="text-[11px] text-sidebar-foreground/60">
                  Local · this device
                </span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}

function SearchIcon() {
  return (
    <svg
      className="size-[15px] flex-none"
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

function PlusIcon() {
  return (
    <svg
      className="size-4 flex-none"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
    >
      <path d="M8 3v10M3 8h10" />
    </svg>
  );
}
