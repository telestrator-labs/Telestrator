import type { ReactNode } from "react";
import { useTheme } from "../theme/ThemeProvider";
import type { Theme } from "../theme/theme";
import { useTraceSettings } from "@/editor/trace/traceSettings";
import { Switch } from "../ui/Switch";
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
} from "../ui/Popover";
import { cx } from "../ui/cx";

// The theme switcher, opened from the sidebar's user button. Offers the three
// preferences (light / dark / system); "system" follows the OS. The provider
// handles applying, persistence, and watching for OS/cross-tab changes.
const OPTIONS: { value: Theme; label: string; icon: ReactNode }[] = [
  { value: "light", label: "Light", icon: <SunIcon /> },
  { value: "dark", label: "Dark", icon: <MoonIcon /> },
  { value: "system", label: "System", icon: <MonitorIcon /> },
];

export function ThemeMenu({ children }: { children: ReactNode }) {
  const { theme, setTheme } = useTheme();
  const { hoverEnabled, setHoverEnabled } = useTraceSettings();
  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        align="start"
        side="top"
        sideOffset={8}
        className="w-[--radix-popover-trigger-width] min-w-52 p-1"
      >
        <div className="px-2 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-text-faint">
          Trace
        </div>
        {/* Not a PopoverClose — toggling a preference shouldn't dismiss the menu. */}
        <label className="flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-[13px] text-text-muted hover:bg-surface-raised hover:text-text">
          <span className="flex size-4 flex-none items-center justify-center text-text-muted">
            <HoverIcon />
          </span>
          <span className="flex-1">Show on hover</span>
          <Switch checked={hoverEnabled} onCheckedChange={setHoverEnabled} />
        </label>

        <div className="my-1 h-px bg-border-subtle" />

        <div className="px-2 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-text-faint">
          Theme
        </div>
        {OPTIONS.map((o) => {
          const active = theme === o.value;
          return (
            <PopoverClose asChild key={o.value}>
              <button
                type="button"
                onClick={() => setTheme(o.value)}
                className={cx(
                  "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-[13px]",
                  active
                    ? "bg-surface-active font-medium text-text"
                    : "text-text-muted hover:bg-surface-raised hover:text-text",
                )}
              >
                <span className="flex size-4 flex-none items-center justify-center text-text-muted">
                  {o.icon}
                </span>
                <span className="flex-1">{o.label}</span>
                {active && <CheckIcon />}
              </button>
            </PopoverClose>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}

// A cursor over connected nodes — "reveal the trace on hover".
function HoverIcon() {
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
      <circle cx="4" cy="4" r="1.6" />
      <circle cx="12" cy="6" r="1.6" />
      <path d="M5.4 4.6 10.6 5.6" />
      <path d="M8 9.5l4.5 4.5M8 9.5l1 3 1.2-1.5 1.8-.2z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg
      className="size-4"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
    >
      <circle cx="8" cy="8" r="3" />
      <path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3 3l1 1M12 12l1 1M13 3l-1 1M4 12l-1 1" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg className="size-4" viewBox="0 0 16 16" fill="currentColor">
      <path d="M13.5 9.5A5.5 5.5 0 0 1 6.5 2.5a5.5 5.5 0 1 0 7 7z" />
    </svg>
  );
}

function MonitorIcon() {
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
      <rect x="2" y="3" width="12" height="8" rx="1.5" />
      <path d="M6 14h4M8 11v3" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      className="size-3.5 flex-none text-action-text"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3.5 8.5l3 3 6-7" />
    </svg>
  );
}
