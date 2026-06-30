import * as SelectPrimitive from "@radix-ui/react-select";
import { cx } from "./cx";

// A rethemed Radix Select (adapted from Tremor Raw, Apache-2.0), simplified to a
// single composite that drives a `$` key from a list of string options. Trigger
// is an olive well with a violet focus ring; the selected item is marked violet.
export function Select({
  value,
  onValueChange,
  options,
  placeholder = "Select…",
  className,
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  className?: string;
}) {
  return (
    <SelectPrimitive.Root value={value} onValueChange={onValueChange}>
      <SelectPrimitive.Trigger
        className={cx(
          "inline-flex w-full items-center justify-between gap-2 rounded-md border border-olive-7 bg-olive-1 px-2.5 py-1.5",
          "font-sans text-sm text-olive-12 outline-none",
          "focus-visible:border-violet-8 focus-visible:ring-2 focus-visible:ring-violet-8",
          className,
        )}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon className="text-olive-11">▾</SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={4}
          className="z-50 overflow-hidden rounded-md border border-olive-6 bg-olive-1 shadow-md"
        >
          <SelectPrimitive.Viewport className="p-1">
            {options.map((opt) => (
              <SelectPrimitive.Item
                key={opt}
                value={opt}
                className={cx(
                  "relative flex cursor-pointer select-none items-center rounded px-2 py-1.5",
                  "font-sans text-sm text-olive-12 outline-none",
                  "data-[highlighted]:bg-violet-3 data-[state=checked]:text-violet-11",
                )}
              >
                <SelectPrimitive.ItemText>{opt}</SelectPrimitive.ItemText>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
