import * as React from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { tv, type VariantProps } from "tailwind-variants";
import { cx } from "./cx";

// Sheet — a Dialog that slides in from an edge. Vendored from shadcn/ui (MIT) and
// re-themed to our design tokens: our `cx`, semantic surface/border/text colors,
// an inline close glyph (no lucide), and the tw-animate-css enter/leave utilities
// already loaded in the entry CSS.
//
// Caveat: the default *modal* mode uses react-remove-scroll (scroll-lock +
// focus-trap), which fights a ProseMirror `contentEditable` and won't mount when
// the Sheet is opened from inside the editor. Pass `modal={false}` for in-editor
// panels (a non-modal Sheet still dismisses on Escape / click-outside).

function Sheet(props: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />;
}

function SheetTrigger(
  props: React.ComponentProps<typeof SheetPrimitive.Trigger>,
) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetClose(props: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />;
}

function SheetPortal(
  props: React.ComponentProps<typeof SheetPrimitive.Portal>,
) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />;
}

function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cx(
        "fixed inset-0 z-50 bg-black/40 backdrop-blur-[1px] data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        className,
      )}
      {...props}
    />
  );
}

const sheetVariants = tv({
  base: "fixed z-50 flex flex-col gap-4 bg-surface text-text shadow-[0_12px_40px_rgb(0_0_0/0.22)] transition ease-in-out data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:duration-300 data-[state=open]:duration-500",
  variants: {
    side: {
      right:
        "inset-y-0 right-0 h-full w-3/4 border-l border-border data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm",
      left: "inset-y-0 left-0 h-full w-3/4 border-r border-border data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
      top: "inset-x-0 top-0 h-auto border-b border-border data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
      bottom:
        "inset-x-0 bottom-0 h-auto border-t border-border data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
    },
  },
  defaultVariants: { side: "right" },
});

function SheetContent({
  className,
  children,
  side = "right",
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> &
  VariantProps<typeof sheetVariants>) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        className={cx(sheetVariants({ side }), className)}
        {...props}>
        {children}
        <SheetPrimitive.Close
          aria-label="Close"
          className="absolute right-3.5 top-3.5 rounded-md p-0.5 text-text-faint opacity-80 outline-none transition hover:text-text focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-accent-8">
          <XGlyph />
          <span className="sr-only">Close</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPortal>
  );
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cx(
        "flex flex-col gap-1 border-b border-border-subtle p-4",
        className,
      )}
      {...props}
    />
  );
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cx(
        "mt-auto flex flex-col gap-2 border-t border-border-subtle p-4",
        className,
      )}
      {...props}
    />
  );
}

function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cx("text-sm font-semibold text-text", className)}
      {...props}
    />
  );
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cx("text-xs text-text-muted", className)}
      {...props}
    />
  );
}

function XGlyph() {
  return (
    <svg
      className="size-4"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden>
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  );
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};
