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
import { Toolbar, type ToolbarAction } from "../ui/Toolbar";
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
  const runtime = useRuntime();
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

  // Toolbar insertion shares the same helpers as the slash menu (insertCells.ts)
  // so both produce identical cells. Insert *after* the current selection.
  const insertCodeCell = (language: "typescript" | "css") =>
    insertCodeCellAt(editor, editor.state.selection.to, language);
  const insertInputCell = () =>
    insertInputCellAt(editor, editor.state.selection.to);

  const toolbarGroups: ToolbarAction[][] = [
    [
      {
        key: "bold",
        title: "Bold",
        label: <span className="font-semibold">B</span>,
        active: editor.isActive("bold"),
        onClick: () => editor.chain().focus().toggleBold().run(),
      },
      {
        key: "italic",
        title: "Italic",
        label: <span className="font-serif italic">I</span>,
        active: editor.isActive("italic"),
        onClick: () => editor.chain().focus().toggleItalic().run(),
      },
      {
        key: "heading",
        label: "Heading",
        active: editor.isActive("heading"),
        items: [
          {
            label: "Heading 1",
            hint: "#",
            onSelect: () =>
              editor.chain().focus().toggleHeading({ level: 1 }).run(),
          },
          {
            label: "Heading 2",
            hint: "##",
            onSelect: () =>
              editor.chain().focus().toggleHeading({ level: 2 }).run(),
          },
        ],
      },
    ],
    [
      {
        key: "code",
        label: "Code",
        items: [
          {
            label: "TypeScript cell",
            hint: "runnable",
            onSelect: () => insertCodeCell("typescript"),
          },
          { label: "CSS cell", onSelect: () => insertCodeCell("css") },
        ],
      },
      { key: "input", label: "Input", onClick: insertInputCell },
    ],
  ];

  return (
    <>
      {!reading && (
        <div className="notebook__tools">
          {/* Inner wrapper: the sticky bar's background spans the full content
           * width (so scrolling prose never bleeds through), while the controls
           * stay within a capped measure — left cluster for formatting/insert,
           * Restart anchored right — so the wide layout doesn't fling them apart. */}
          <div className="notebook__tools-inner">
            <Toolbar groups={toolbarGroups} />
            <Toolbar
              groups={[
                [
                  {
                    key: "restart",
                    label: "Restart",
                    title: "Restart runtime",
                    icon: <RestartIcon />,
                    onClick: () => runtime.restart(),
                  },
                ],
              ]}
            />
          </div>
        </div>
      )}
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
      <EditorContent editor={editor} className="notebook__doc" />
    </>
  );
}

function RestartIcon() {
  return (
    <svg
      className="size-3.5"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M13 8a5 5 0 1 1-1.46-3.54" />
      <path d="M13 2.5V5h-2.5" />
    </svg>
  );
}
