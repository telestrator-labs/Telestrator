import type { NotebookTemplate } from "./types";
import { rateLimiting } from "./rateLimiting";
import { compoundInterest } from "./compoundInterest";
import { greeting } from "./greeting";

export type { NotebookTemplate } from "./types";
export {
  setPendingTemplate,
  takePendingTemplate,
  clearPendingTemplate,
} from "./pending";

// The initial set — one per family of input kind (sliders / numbers / text +
// select + toggle) so every control is exercised end-to-end.
export const templates: NotebookTemplate[] = [
  rateLimiting,
  compoundInterest,
  greeting,
];
