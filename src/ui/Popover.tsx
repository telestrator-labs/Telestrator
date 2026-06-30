import { forwardRef } from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cx } from "./cx";

// Popover (adapted from Tremor Raw / Radix, Apache-2.0/MIT), re-themed to our
// tokens. PopoverContent guards against the Tiptap editor dismissing it: inside
// a node view the editor grabs focus on open, which would fire focus-outside and
// close the popup. We keep it open for editor-originated focus (Popover, unlike
// Select, exposes onFocusOutside); genuine outside clicks still close via
// pointer-down-outside. Wrap the trigger in <StopEditorEvents> so the editor
// doesn't node-select/refocus and steal keyboard focus from the popover.

const Popover = PopoverPrimitive.Root;
const PopoverTrigger = PopoverPrimitive.Trigger;
const PopoverAnchor = PopoverPrimitive.Anchor;
const PopoverClose = PopoverPrimitive.Close;

const PopoverContent = forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(
  (
    { className, align = "start", sideOffset = 6, onFocusOutside, ...props },
    ref,
  ) => (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        // Don't dismiss on focus-out: inside a Tiptap node view the editor
        // grabs focus on open, which would close the popup instantly. Genuine
        // outside *clicks* still close it (pointer-down-outside is untouched).
        onFocusOutside={(e) => {
          e.preventDefault();
          onFocusOutside?.(e);
        }}
        className={cx(
          "z-50 w-72 rounded-xl border border-border bg-surface p-3 text-text shadow-[0_12px_40px_rgb(0_0_0/0.16)] outline-none",
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  ),
);
PopoverContent.displayName = "PopoverContent";

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor, PopoverClose };
