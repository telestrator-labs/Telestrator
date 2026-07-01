// Focus hand-off for freshly inserted code cells. `insertContentAt` can't focus
// the inner CodeMirror island, and Tiptap's chain().focus() lands in the trailing
// paragraph rather than the new cell — so when a cell is inserted we record its
// id here, and CodeCellView focuses CodeMirror on mount if its id is pending.
//
// The request is a short time window (not consume-once) so React StrictMode's
// dev mount → unmount → remount still focuses the final view; it auto-expires so
// an unrelated later remount of the same cell never steals focus.
const FOCUS_WINDOW_MS = 1500;
const pending = new Set<string>();

export function requestCellFocus(id: string): void {
  pending.add(id);
  setTimeout(() => pending.delete(id), FOCUS_WINDOW_MS);
}

export function shouldFocusCell(id: string): boolean {
  return pending.has(id);
}
