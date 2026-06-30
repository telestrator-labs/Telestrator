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
      "w-full rounded-md border border-olive-7 bg-olive-1 px-2.5 py-1.5",
      "font-mono text-sm text-olive-12 outline-none",
      "placeholder:text-olive-9",
      "focus-visible:border-violet-8 focus-visible:ring-2 focus-visible:ring-violet-8",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";

export { Input };
