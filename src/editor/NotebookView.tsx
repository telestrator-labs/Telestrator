import { RuntimeProvider } from "./RuntimeProvider";
import { NotebookEditor } from "./NotebookEditor";
import { useNotebookDoc } from "./useNotebookDoc";
import { renameNotebook } from "./docIndex";

// One open notebook. Mounted keyed by docId, so switching notebooks fully
// remounts this — giving a fresh Y.Doc + IndexedDB persistence (useNotebookDoc)
// and a fresh reactive runtime (RuntimeProvider) per document. The title is an
// uncontrolled input (re-seeded per docId via the parent key) that writes back
// to the document index.
export function NotebookView({
  docId,
  title,
}: {
  docId: string;
  title: string;
}) {
  const { ydoc, whenSynced } = useNotebookDoc(docId);

  return (
    <RuntimeProvider>
      <div className="notebook">
        <header className="notebook__bar">
          <input
            className="notebook__title-input"
            defaultValue={title}
            placeholder="Untitled notebook"
            onChange={(e) => renameNotebook(docId, e.target.value)}
          />
        </header>
        <NotebookEditor ydoc={ydoc} whenSynced={whenSynced} />
      </div>
    </RuntimeProvider>
  );
}
