import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import { Collaboration } from "@tiptap/extension-collaboration";
import type * as Y from "yjs";
import { editorExtensions } from "./extensions";
import { notebookToDocJSON } from "./bridge";
import { useReadingMode } from "./ReadingMode";
import { createNotebook } from "../core/notebook";
import { takePendingTemplate } from "../templates";
import { renameNotebook } from "./docIndex";
import "./editor.css";

// The editing surface for one notebook. Persistence is Yjs + IndexedDB: the
// Collaboration extension binds the editor to the notebook's Y.Doc (owned by
// NotebookView), and IndexeddbPersistence saves every change automatically — no
// localStorage round-trip and no per-edit index writes. Content is seeded once,
// after IndexedDB sync, only if the doc is empty (Collaboration forbids the
// `content` option, which would duplicate on reload).
export function NotebookEditor({
  docId,
  ydoc,
  whenSynced,
  title,
}: {
  docId: string;
  ydoc: Y.Doc;
  whenSynced: Promise<unknown>;
  title: string;
}) {
  const reading = useReadingMode();

  const editor = useEditor({
    extensions: [
      ...editorExtensions,
      Collaboration.configure({ document: ydoc }),
    ],
    // `prose` goes on the editable itself so its direct children (paragraphs,
    // headings, cell nodes) get the typography styling; max-w-none lets the
    // .notebook column own the measure.
    editorProps: { attributes: { class: "prose max-w-none" } },
  });

  // Seed initial content once, after IndexedDB has loaded, only if the doc is
  // empty (so reloads never duplicate). Guard the async callback for StrictMode.
  useEffect(() => {
    if (!editor) return;
    let cancelled = false;
    void whenSynced.then(() => {
      if (cancelled || editor.isDestroyed) return;
      const config = ydoc.getMap("config");
      const fragment = ydoc.getXmlFragment("default");
      if (!config.get("seeded") && fragment.length === 0) {
        config.set("seeded", true);
        const markdown = editor.storage.markdown.manager;
        // Seed from a pending template if "create from template" set one for
        // this docId; otherwise the blank default. Taking the template only
        // inside this guarded branch means a torn-down StrictMode editor never
        // consumes it and leaves the live mount blank.
        const template = takePendingTemplate(docId);
        editor.commands.setContent(
          template
            ? template.build(markdown)
            : notebookToDocJSON(markdown, createNotebook()),
        );
      }
    });
    return () => {
      cancelled = true;
    };
  }, [editor, docId, ydoc, whenSynced]);

  if (!editor) return null;

  return (
    <>
      {/* Title first: the document's single H1-level heading and the top of the
       * information hierarchy. Blocks are added via `/` or the empty-line add
       * affordance — no formatting toolbar. */}
      <header className="notebook__bar">
        {reading ? (
          <h1 className="notebook__title">{title || "Untitled notebook"}</h1>
        ) : (
          <input
            className="notebook__title"
            defaultValue={title}
            placeholder="Untitled notebook"
            onChange={(e) => renameNotebook(docId, e.target.value)}
          />
        )}
      </header>
      <EditorContent editor={editor} className="notebook__doc" />
    </>
  );
}
