import { forwardRef } from "react";
import { cx } from "./cx";

// A native input rethemed to the design tokens (adapted from Tremor Raw,
// Apache-2.0). Used for the `number` and `text` input kinds. Olive border/well,
// violet focus ring; value text in mono so numbers read as data.
const Input = forwardRef<
  HTMLInputElement,
  React.ComponentPropsWithoutRef<"input">
>(({ className, type = "text", ...props }, ref) => (
  <input
    ref={ref}
    type={type}
    className={cx(
      "w-full rounded-md border border-border-strong bg-surface px-2.5 py-1.5",
      "font-mono text-sm text-text outline-none",
      "placeholder:text-text-faint",
      "focus-visible:border-brand-8 focus-visible:ring-2 focus-visible:ring-brand-8",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";

export { Input };
