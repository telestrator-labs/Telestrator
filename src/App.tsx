import { useEffect, useState } from "react";
import { NotebookView } from "./editor/NotebookView";
import {
  createNotebook,
  list,
  removeNotebook,
  subscribe,
  whenReady,
  type NotebookEntry,
} from "./editor/docIndex";
import "./editor/app.css";

// Subscribe to the document index (a dedicated Yjs doc in IndexedDB), ensuring
// at least one notebook exists once it has loaded.
function useDocIndex() {
  const [docs, setDocs] = useState<NotebookEntry[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    let unsubscribe = () => {};
    void whenReady.then(() => {
      if (cancelled) return;
      if (list().length === 0) createNotebook();
      setDocs(list());
      unsubscribe = subscribe(() => setDocs(list()));
      setReady(true);
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);
  return { ready, docs };
}

export default function App() {
  const { ready, docs } = useDocIndex();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Keep a valid selection as the list changes (initial load, delete, create).
  useEffect(() => {
    if (docs.length === 0) return;
    if (!selectedId || !docs.some((d) => d.id === selectedId)) {
      setSelectedId(docs[0].id);
    }
  }, [docs, selectedId]);

  if (!ready) return <div className="app-loading">Loading…</div>;

  const selected = docs.find((d) => d.id === selectedId);

  return (
    <div className="app">
      <aside className="doc-list">
        <button
          type="button"
          className="doc-list__new"
          onClick={() => setSelectedId(createNotebook().id)}
        >
          + New notebook
        </button>
        <ul>
          {docs.map((d) => (
            <li
              key={d.id}
              className={
                d.id === selectedId
                  ? "doc-list__row is-active"
                  : "doc-list__row"
              }
            >
              <button
                type="button"
                className="doc-list__item"
                onClick={() => setSelectedId(d.id)}
              >
                {d.title || "Untitled notebook"}
              </button>
              <button
                type="button"
                className="doc-list__del"
                title="Delete notebook"
                onClick={() => removeNotebook(d.id)}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      </aside>
      <main className="app-main">
        {selected ? (
          <NotebookView
            key={selected.id}
            docId={selected.id}
            title={selected.title}
          />
        ) : (
          <div className="app-loading">No notebook selected</div>
        )}
      </main>
    </div>
  );
}
