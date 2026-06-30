import {
  deserialize,
  serialize,
  type NotebookDocument,
} from "../core/notebook";

// M1 persistence: a single notebook in localStorage (the multi-document list
// arrives in M5 with Yjs + IndexedDB). Stored as the core JSON shape, so the
// on-disk format is exactly the `NotebookDocument` contract.
const STORAGE_KEY = "telestrator:notebook";

export function loadNotebook(): NotebookDocument | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? deserialize(raw) : null;
  } catch {
    // Corrupt or unavailable storage -> start fresh rather than crash.
    return null;
  }
}

export function saveNotebook(notebook: NotebookDocument): void {
  try {
    localStorage.setItem(STORAGE_KEY, serialize(notebook));
  } catch {
    // Quota exceeded or storage unavailable -> drop the write silently.
  }
}
