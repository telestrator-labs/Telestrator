import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Conditional-class + conflict-resolution helper, the Tremor convention. Used by
// the rethemed control primitives in this folder.
export function cx(...args: ClassValue[]): string {
  return twMerge(clsx(args));
}
