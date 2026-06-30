import { forwardRef } from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cx } from "./cx";

// A rethemed Radix Slider (adapted from Tremor Raw, Apache-2.0). Track is olive,
// the filled range + handle are violet (the design-language action accent),
// focus ring is violet-8. The bound value is shown by the caller in gold.
const Slider = forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cx(
      "relative flex w-full touch-none select-none items-center",
      className,
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-gray-5">
      <SliderPrimitive.Range className="absolute h-full rounded-full bg-action" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block h-4 w-4 rounded-full border-2 border-action bg-surface shadow-sm transition outline-none focus-visible:ring-2 focus-visible:ring-accent-8 focus-visible:ring-offset-1" />
  </SliderPrimitive.Root>
));
Slider.displayName = "Slider";

export { Slider };
