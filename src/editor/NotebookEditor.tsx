import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import { Collaboration } from "@tiptap/extension-collaboration";
import type * as Y from "yjs";
import { editorExtensions } from "./extensions";
import { notebookToDocJSON } from "./bridge";
import { useRuntime } from "./RuntimeProvider";
import { createCell, createNotebook, generateId } from "../core/notebook";
import "./editor.css";

// The editing surface for one notebook. Persistence is Yjs + IndexedDB: the
// Collaboration extension binds the editor to the notebook's Y.Doc (owned by
// NotebookView), and IndexeddbPersistence saves every change automatically — no
// localStorage round-trip and no per-edit index writes. Content is seeded once,
// after IndexedDB sync, only if the doc is empty (Collaboration forbids the
// `content` option, which would duplicate on reload).
export function NotebookEditor({
  ydoc,
  whenSynced,
}: {
  ydoc: Y.Doc;
  whenSynced: Promise<unknown>;
}) {
  const runtime = useRuntime();

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
        editor.commands.setContent(
          notebookToDocJSON(markdown, createNotebook()),
        );
      }
    });
    return () => {
      cancelled = true;
    };
  }, [editor, ydoc, whenSynced]);

  if (!editor) return null;

  const insertCodeCell = (language: "typescript" | "css") => {
    const cell = createCell(language, "");
    // Insert *after* the current selection so a selected code cell (an atom with
    // a NodeSelection) is not replaced; a trailing paragraph keeps a typing target.
    const at = editor.state.selection.to;
    editor
      .chain()
      .insertContentAt(at, [
        { type: "codeCell", attrs: { id: cell.id, language, code: "" } },
        { type: "paragraph" },
      ])
      .focus()
      .run();
  };

  // Insert a `$`-bound input cell (a slider by default; kind is switchable in
  // the cell). Mirrors insertCodeCell. Slash-menu insertion comes in PR 2.
  const insertInputCell = () => {
    const id = generateId();
    const at = editor.state.selection.to;
    editor
      .chain()
      .insertContentAt(at, [
        {
          type: "inputCell",
          attrs: {
            id,
            name: "input1",
            kind: "slider",
            value: 0,
            config: { min: 0, max: 100, step: 1 },
          },
        },
        { type: "paragraph" },
      ])
      .focus()
      .run();
  };

  return (
    <>
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
      <EditorContent editor={editor} className="notebook__doc" />
    </>
  );
}
