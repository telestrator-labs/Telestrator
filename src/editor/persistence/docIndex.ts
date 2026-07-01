import * as Y from "yjs";
import { IndexeddbPersistence } from "y-indexeddb";

// The multi-document index: a dedicated Y.Doc (its own IndexedDB store) holding
// the list of notebooks. One persistence model app-wide, and it becomes
// collaborative for free in later milestones. Each notebook's *content* lives in
// its own Y.Doc (see useNotebookDoc); this only tracks {id, title, timestamps}.

export interface NotebookEntry {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
}

const INDEX_KEY = "telestrator:index";
const DOC_KEY_PREFIX = "telestrator:doc:";

export const docStoreKey = (id: string) => `${DOC_KEY_PREFIX}${id}`;

function newId(): string {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `nb-${Date.now()}-${Math.random().toString(16).slice(2)}`
  );
}

const indexDoc = new Y.Doc();
const persistence = new IndexeddbPersistence(INDEX_KEY, indexDoc);
const entries = indexDoc.getArray<Y.Map<unknown>>("notebooks");

export const whenReady: Promise<unknown> = persistence.whenSynced;

function toEntry(map: Y.Map<unknown>): NotebookEntry {
  return {
    id: map.get("id") as string,
    title: (map.get("title") as string) ?? "Untitled notebook",
    createdAt: (map.get("createdAt") as number) ?? 0,
    updatedAt: (map.get("updatedAt") as number) ?? 0,
  };
}

// Stable insertion order (by creation time) so the switcher never reorders while
// a title is being edited.
export function list(): NotebookEntry[] {
  return entries
    .toArray()
    .map(toEntry)
    .sort((a, b) => a.createdAt - b.createdAt);
}

// Subscribe to index changes (deep, so title/timestamp edits notify too).
export function subscribe(cb: () => void): () => void {
  const handler = () => cb();
  entries.observeDeep(handler);
  return () => entries.unobserveDeep(handler);
}

function find(id: string): Y.Map<unknown> | undefined {
  return entries.toArray().find((m) => m.get("id") === id);
}

export function createNotebook(title = "Untitled notebook"): NotebookEntry {
  const now = Date.now();
  const map = new Y.Map<unknown>();
  map.set("id", newId());
  map.set("title", title);
  map.set("createdAt", now);
  map.set("updatedAt", now);
  entries.push([map]);
  return toEntry(map);
}

export function renameNotebook(id: string, title: string): void {
  const map = find(id);
  if (!map) return;
  indexDoc.transact(() => {
    map.set("title", title);
    map.set("updatedAt", Date.now());
  });
}

export function removeNotebook(id: string): void {
  const i = entries.toArray().findIndex((m) => m.get("id") === id);
  if (i >= 0) entries.delete(i, 1);
  // Drop the notebook's own IndexedDB store.
  void new IndexeddbPersistence(docStoreKey(id), new Y.Doc()).clearData();
}
