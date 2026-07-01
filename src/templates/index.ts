import type { NotebookTemplate } from "./types";
import { rateLimiting } from "./rateLimiting";
import { compoundInterest } from "./compoundInterest";
import { greeting } from "./greeting";
import { bitsTutorial } from "./bitsTutorial";

export type { NotebookTemplate } from "./types";
export {
  setPendingTemplate,
  takePendingTemplate,
  clearPendingTemplate,
} from "./pending";

// The initial set — one per family of input kind (sliders / numbers / text +
// select + toggle) so every control is exercised end-to-end, plus a guided
// tutorial that demonstrates the reactive "knowledge check" pattern.
export const templates: NotebookTemplate[] = [
  rateLimiting,
  compoundInterest,
  greeting,
  bitsTutorial,
];
