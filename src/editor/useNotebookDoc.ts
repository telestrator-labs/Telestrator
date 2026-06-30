import { useEffect } from "react";
import * as Y from "yjs";
import { IndexeddbPersistence } from "y-indexeddb";
import { docStoreKey } from "./docIndex";

export interface NotebookDocHandle {
  ydoc: Y.Doc;
  whenSynced: Promise<unknown>;
}

interface Entry {
  ydoc: Y.Doc;
  persistence: IndexeddbPersistence;
  teardown?: ReturnType<typeof setTimeout>;
}

// A module-level registry of one Y.Doc + IndexedDB persistence per docId.
// Teardown is DEFERRED so React 18 StrictMode's mount → unmount → remount cycle
// (which would otherwise destroy the doc the live editor is bound to) cancels
// itself: the remount's `keep` clears the pending destroy. A real unmount lets
// the timer fire and releases the doc.
const TEARDOWN_DELAY_MS = 2000;
const registry = new Map<string, Entry>();

function getEntry(docId: string): Entry {
  let entry = registry.get(docId);
  if (!entry) {
    const ydoc = new Y.Doc();
    const persistence = new IndexeddbPersistence(docStoreKey(docId), ydoc);
    entry = { ydoc, persistence };
    registry.set(docId, entry);
  }
  return entry;
}

// Owns the Y.Doc lifecycle for a single notebook. Because NotebookView is keyed
// by docId, switching notebooks unmounts this (scheduling release) and mounts a
// fresh one. Teardown order is editor.destroy() (handled by useEditor on unmount)
// → persistence.destroy() → ydoc.destroy().
export function useNotebookDoc(docId: string): NotebookDocHandle {
  const entry = getEntry(docId); // idempotent; safe to call every render

  useEffect(() => {
    const e = getEntry(docId);
    if (e.teardown) {
      clearTimeout(e.teardown);
      e.teardown = undefined;
    }
    return () => {
      e.teardown = setTimeout(() => {
        void e.persistence.destroy();
        e.ydoc.destroy();
        registry.delete(docId);
      }, TEARDOWN_DELAY_MS);
    };
  }, [docId]);

  return { ydoc: entry.ydoc, whenSynced: entry.persistence.whenSynced };
}
