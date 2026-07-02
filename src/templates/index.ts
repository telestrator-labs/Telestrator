import type { NotebookTemplate } from "./types";
import { rateLimiting } from "./rateLimiting";
import { orderSummary } from "./orderSummary";
import { bitsTutorial } from "./bitsTutorial";
import { reactViews } from "./reactViews";

export type { NotebookTemplate } from "./types";
export {
  setPendingTemplate,
  takePendingTemplate,
  clearPendingTemplate,
} from "./pending";

// The initial set, one per use case of the system: a simulation (rate limiting),
// a form → summary that exercises every input kind (order summary), a guided
// tutorial with reactive knowledge checks (bits), and rich cell output with the
// css↔js interplay (views).
export const templates: NotebookTemplate[] = [
  rateLimiting,
  orderSummary,
  bitsTutorial,
  reactViews,
];
