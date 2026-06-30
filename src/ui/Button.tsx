import { forwardRef } from "react";
import { cx } from "./cx";

// A rethemed button (adapted from Tremor Raw, Apache-2.0) — the single source of
// truth for action-button chrome, so buttons stop relying on ad-hoc utility
// classes (and never fall back to the user-agent default border, since Preflight
// is omitted). Colors go through the semantic token tier. Variants:
//   primary   — the violet call-to-action (Share, Done)
//   secondary — bordered surface button (Trace, toolbar actions)
//   ghost     — no chrome until hover (breadcrumb, segmented items)
export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "border-transparent bg-action text-white hover:bg-action-hover",
  secondary:
    "border-border bg-surface text-text-muted hover:border-border-strong hover:text-text",
  ghost:
    "border-transparent bg-transparent text-text-muted hover:bg-surface-raised hover:text-text",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "gap-1.5 px-3 py-[7px] text-[12.5px]",
  md: "gap-2 px-3.5 py-2 text-sm",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "secondary",
      size = "sm",
      type = "button",
      className,
      ...props
    },
    ref,
  ) => (
    <button
      ref={ref}
      type={type}
      className={cx(
        // The `border` utility (layer utilities) wins over the base button reset,
        // so the variant's border-color is authoritative.
        "inline-flex items-center justify-center rounded-lg border font-medium",
        "outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent-8",
        "disabled:pointer-events-none disabled:opacity-60",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = "Button";
