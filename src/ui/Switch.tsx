import { forwardRef } from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cx } from "./cx";

// A rethemed Radix Switch (adapted from Tremor Raw, Apache-2.0). Off = olive
// track; on = violet-9. Focus ring is violet-8.
const Switch = forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitive.Root
    ref={ref}
    className={cx(
      "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full outline-none transition-colors",
      "bg-olive-6 data-[state=checked]:bg-violet-9",
      "focus-visible:ring-2 focus-visible:ring-violet-8 focus-visible:ring-offset-1",
      className,
    )}
    {...props}
  >
    <SwitchPrimitive.Thumb className="pointer-events-none block h-4 w-4 translate-x-0.5 rounded-full bg-olive-1 shadow-sm transition-transform data-[state=checked]:translate-x-[18px]" />
  </SwitchPrimitive.Root>
));
Switch.displayName = "Switch";

export { Switch };
