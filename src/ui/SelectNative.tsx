import { forwardRef } from "react";
import { cx } from "./cx";

// A styled native <select> (adapted from Tremor Raw's select-native, Apache-2.0),
// re-themed to our design tokens. Keeps the OS dropdown (good for short, simple
// option lists like the input-cell kind picker) while matching our Input/Select
// chrome. `appearance-none` + a custom chevron gives a consistent affordance.
export const SelectNative = forwardRef<
  HTMLSelectElement,
  React.ComponentPropsWithoutRef<"select"> & { hasError?: boolean }
>(({ className, hasError, ...props }, ref) => (
  <div className="relative inline-flex w-full">
    <select
      ref={ref}
      className={cx(
        "w-full appearance-none truncate rounded-md border bg-surface py-1.5 pl-2.5 pr-8 font-sans text-sm text-text shadow-sm outline-none transition",
        "focus-visible:border-action focus-visible:ring-2 focus-visible:ring-action-border",
        "disabled:cursor-not-allowed disabled:opacity-50",
        hasError
          ? "border-danger-border focus-visible:ring-danger-border"
          : "border-border hover:border-border-strong",
        className,
      )}
      {...props}
    />
    <svg
      aria-hidden
      className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-text-muted"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 6l4 4 4-4" />
    </svg>
  </div>
));
SelectNative.displayName = "SelectNative";
