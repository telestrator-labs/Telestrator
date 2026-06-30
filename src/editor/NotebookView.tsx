import { RuntimeProvider } from "./RuntimeProvider";
import { NotebookEditor } from "./NotebookEditor";
import { useNotebookDoc } from "./useNotebookDoc";
import { renameNotebook } from "./docIndex";
import { ReadingModeContext } from "./ReadingMode";

// One open notebook. Mounted keyed by docId, so switching notebooks fully
// remounts this — giving a fresh Y.Doc + IndexedDB persistence (useNotebookDoc)
// and a fresh reactive runtime (RuntimeProvider) per document. The title is an
// uncontrolled input (re-seeded per docId via the parent key) that writes back
// to the document index. `reading` strips editing chrome (provided to cells).
export function NotebookView({
  docId,
  title,
  reading = false,
}: {
  docId: string;
  title: string;
  reading?: boolean;
}) {
  const { ydoc, whenSynced } = useNotebookDoc(docId);

  return (
    <ReadingModeContext.Provider value={reading}>
      <RuntimeProvider>
        <div className="notebook">
          <header className="notebook__bar">
            {reading ? (
              <h1 className="notebook__title-input">
                {title || "Untitled notebook"}
              </h1>
            ) : (
              <input
                className="notebook__title-input"
                defaultValue={title}
                placeholder="Untitled notebook"
                onChange={(e) => renameNotebook(docId, e.target.value)}
              />
            )}
          </header>
          <NotebookEditor ydoc={ydoc} whenSynced={whenSynced} />
        </div>
      </RuntimeProvider>
    </ReadingModeContext.Provider>
  );
}
