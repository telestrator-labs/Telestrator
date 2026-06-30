import { useEffect, useRef } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import { editorExtensions } from "./extensions";
import { docToNotebook, notebookToDocJSON } from "./bridge";
import { loadNotebook, saveNotebook } from "./persistence";
import { useRuntime } from "./RuntimeProvider";
import {
  createCell,
  createNotebook,
  type NotebookDocument,
} from "../core/notebook";
import "./editor.css";

const SAVE_DEBOUNCE_MS = 400;

export function NotebookEditor() {
  // The notebook's stable id/title live outside the ProseMirror doc; keep them
  // in a ref so debounced saves always reattach the right identity.
  const notebookRef = useRef<NotebookDocument>(
    createNotebook("Untitled notebook"),
  );
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runtime = useRuntime();

  const editor = useEditor({
    extensions: editorExtensions,
    content: "",
    onCreate({ editor }) {
      const markdown = editor.storage.markdown.manager;
      const loaded = loadNotebook();
      const notebook = loaded ?? notebookRef.current;
      notebookRef.current = notebook;
      editor.commands.setContent(notebookToDocJSON(markdown, notebook));
      // Seed storage on first run so a reload finds a document.
      if (!loaded) saveNotebook(notebook);
    },
    onUpdate({ editor }) {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        // The debounced timer can outlive this editor instance — e.g. React
        // StrictMode (dev) creates an editor, schedules a save, then destroys it
        // on remount. Saving against a destroyed editor reads undefined storage.
        if (editor.isDestroyed) return;
        const markdown = editor.storage.markdown.manager;
        const next = docToNotebook(
          markdown,
          editor.getJSON(),
          notebookRef.current,
        );
        notebookRef.current = next;
        saveNotebook(next);
      }, SAVE_DEBOUNCE_MS);
    },
  });

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  if (!editor) return null;

  const insertCodeCell = (language: "typescript" | "css") => {
    const cell = createCell(language, "");
    // Insert *after* the current selection (selection.to). This matters when a
    // code cell is selected: a code cell is an atom, so the editor holds a
    // NodeSelection on it, and a plain insertContent would *replace* that node.
    // A trailing paragraph keeps a typing target after the new cell; empty
    // paragraphs never become cells (the bridge drops empty prose runs).
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

  return (
    <div className="notebook">
      <header className="notebook__bar">
        <strong className="notebook__title">{notebookRef.current.title}</strong>
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
          <span className="notebook__sep" aria-hidden />
          <button type="button" onClick={() => runtime.restart()}>
            ↻ Restart runtime
          </button>
        </div>
      </header>
      <EditorContent editor={editor} className="notebook__doc" />
    </div>
  );
}
