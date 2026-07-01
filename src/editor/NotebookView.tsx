import { NotebookEditor } from "./NotebookEditor";
import { useNotebookDoc } from "./useNotebookDoc";
import { ReadingModeContext } from "./ReadingMode";
import { TraceOverlay } from "./TraceOverlay";
import { cx } from "../ui/cx";

// One open notebook. Mounted keyed by docId, so switching notebooks fully
// remounts this — giving a fresh Y.Doc + IndexedDB persistence (useNotebookDoc)
// and a fresh reactive runtime (RuntimeProvider) per document. The title is an
// uncontrolled input (re-seeded per docId via the parent key) that writes back
// to the document index. `reading` strips editing chrome (provided to cells).
export function NotebookView({
  docId,
  title,
  reading = false,
  wide = false,
}: {
  docId: string;
  title: string;
  reading?: boolean;
  wide?: boolean;
}) {
  const { ydoc, whenSynced } = useNotebookDoc(docId);

  return (
    <ReadingModeContext.Provider value={reading}>
      <div
        data-slot="notebook"
        className={cx(
          "relative mx-auto px-10 pb-[140px] pt-[38px] font-sans text-text",
          wide ? "max-w-[1100px]" : "max-w-[720px]",
        )}
      >
        {/* The trace draws over the measure; the SVG has overflow:visible so
            value nodes park in the left margin. Inert until a value is active. */}
        <TraceOverlay />
        <NotebookEditor
          docId={docId}
          ydoc={ydoc}
          whenSynced={whenSynced}
          title={title}
        />
      </div>
    </ReadingModeContext.Provider>
  );
}
