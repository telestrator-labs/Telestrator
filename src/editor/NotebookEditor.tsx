import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import { Collaboration } from "@tiptap/extension-collaboration";
import type * as Y from "yjs";
import { editorExtensions } from "./extensions";
import { notebookToDocJSON } from "./bridge";
import { useRuntime } from "./RuntimeProvider";
import { useReadingMode } from "./ReadingMode";
import { createNotebook } from "../core/notebook";
import { insertCodeCellAt, insertInputCellAt } from "./insertCells";
import { takePendingTemplate } from "../templates";
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
}: {
  docId: string;
  ydoc: Y.Doc;
  whenSynced: Promise<unknown>;
}) {
  const runtime = useRuntime();
  const reading = useReadingMode();

  const editor = useEditor({
    extensions: [
      ...editorExtensions,
      Collaboration.configure({ document: ydoc }),
    ],
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

  // Toolbar insertion shares the same helpers as the slash menu (insertCells.ts)
  // so both produce identical cells. Insert *after* the current selection.
  const insertCodeCell = (language: "typescript" | "css") =>
    insertCodeCellAt(editor, editor.state.selection.to, language);
  const insertInputCell = () =>
    insertInputCellAt(editor, editor.state.selection.to);

  return (
    <>
      {!reading && (
        <div className="notebook__tools">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            B
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            I
          </button>
          <button
            type="button"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
          >
            H1
          </button>
          <button
            type="button"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
          >
            H2
          </button>
          <span className="notebook__sep" aria-hidden />
          <button type="button" onClick={() => insertCodeCell("typescript")}>
            + TS cell
          </button>
          <button type="button" onClick={() => insertCodeCell("css")}>
            + CSS cell
          </button>
          <button type="button" onClick={insertInputCell}>
            + Input
          </button>
          <span className="notebook__sep" aria-hidden />
          <button type="button" onClick={() => runtime.restart()}>
            ↻ Restart runtime
          </button>
        </div>
      )}
      <EditorContent editor={editor} className="notebook__doc" />
    </>
  );
}
