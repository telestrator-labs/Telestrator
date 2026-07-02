import { forwardRef } from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cx } from "./cx";

// Tooltip (adapted from Tremor Raw / Radix, Apache-2.0/MIT), re-themed to our
// tokens — the sibling of Popover.tsx for lightweight, hover/focus-triggered
// hints. General-purpose UI component (the code cell's TS "type popover" is a
// separate, CodeMirror-owned surface — see editor/cells/tsHoverTooltip.ts).
//
// Usage: wrap a subtree (usually near the app root) in <TooltipProvider>, then
//   <Tooltip><TooltipTrigger asChild>…</TooltipTrigger><TooltipContent>…</TooltipContent></Tooltip>

const TooltipProvider = TooltipPrimitive.Provider;
const Tooltip = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 6, children, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cx(
        "z-50 max-w-xs rounded-lg border border-border bg-surface px-2.5 py-1.5 font-sans text-xs text-text shadow-[0_8px_30px_rgb(0_0_0/0.16)] outline-none",
        "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
        className,
      )}
      {...props}
    >
      {children}
    </TooltipPrimitive.Content>
  </TooltipPrimitive.Portal>
));
TooltipContent.displayName = "TooltipContent";

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
