import type { NotebookTemplate } from "./types";

// Module-level handoff from "create from template" (in App) to the lazy seed
// effect (in NotebookEditor), mirroring the useNotebookDoc registry pattern: it
// survives StrictMode remounts and needs no React plumbing or persistence. The
// template is *taken* (consumed) exactly once, inside the editor's guarded seed
// branch, so a torn-down StrictMode mount can't eat it before the live one seeds.
const pending = new Map<string, NotebookTemplate>();

export function setPendingTemplate(
  id: string,
  template: NotebookTemplate,
): void {
  pending.set(id, template);
}

export function takePendingTemplate(id: string): NotebookTemplate | undefined {
  const template = pending.get(id);
  pending.delete(id);
  return template;
}

export function clearPendingTemplate(id: string): void {
  pending.delete(id);
}
