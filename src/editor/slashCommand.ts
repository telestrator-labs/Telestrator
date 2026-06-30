import { Extension, type Editor, type Range } from "@tiptap/core";
import { PluginKey } from "@tiptap/pm/state";
import Suggestion from "@tiptap/suggestion";
import { ReactRenderer } from "@tiptap/react";
import { SlashMenu, type SlashItem, type SlashMenuRef } from "./SlashMenu";
import { insertCodeCellAt, insertInputCellAt } from "./insertCells";

// `/`-command insertion. A thin Extension wrapping @tiptap/suggestion: typing "/"
// at a textblock start (or after whitespace) opens a filterable popup; choosing
// an item runs its action at the cursor. Block transforms (heading/quote/divider)
// reshape the current paragraph; code/input items reuse the shared insert helpers
// so the toolbar and the menu produce identical cells.

const SlashPluginKey = new PluginKey("slashCommand");

const ITEMS: SlashItem[] = [
  {
    title: "Heading 1",
    hint: "#",
    run: (e, r) =>
      e.chain().focus().deleteRange(r).setNode("heading", { level: 1 }).run(),
  },
  {
    title: "Heading 2",
    hint: "##",
    run: (e, r) =>
      e.chain().focus().deleteRange(r).setNode("heading", { level: 2 }).run(),
  },
  {
    title: "Quote",
    run: (e, r) => e.chain().focus().deleteRange(r).toggleBlockquote().run(),
  },
  {
    title: "Divider",
    run: (e, r) => e.chain().focus().deleteRange(r).setHorizontalRule().run(),
  },
  {
    title: "TypeScript cell",
    hint: "runnable",
    run: (e, r) => {
      e.chain().focus().deleteRange(r).run();
      insertCodeCellAt(e, r.from, "typescript");
    },
  },
  {
    title: "CSS cell",
    run: (e, r) => {
      e.chain().focus().deleteRange(r).run();
      insertCodeCellAt(e, r.from, "css");
    },
  },
  {
    title: "Input (slider)",
    hint: "$ knob",
    run: (e, r) => {
      e.chain().focus().deleteRange(r).run();
      insertInputCellAt(e, r.from);
    },
  },
];

const filterItems = (query: string): SlashItem[] => {
  const q = query.toLowerCase();
  return ITEMS.filter((i) => i.title.toLowerCase().includes(q));
};

export const SlashCommand = Extension.create({
  name: "slashCommand",

  addProseMirrorPlugins() {
    return [
      Suggestion<SlashItem, SlashItem>({
        editor: this.editor,
        pluginKey: SlashPluginKey,
        char: "/",
        // Trigger at a textblock start or after whitespace — not mid-word, and
        // (atoms have no text cursor) never inside a code/input cell.
        allow: ({ state, range }) => {
          const $from = state.doc.resolve(range.from);
          if (!$from.parent.isTextblock) return false;
          const before = $from.parent.textBetween(0, $from.parentOffset);
          return /(^|\s)$/.test(before);
        },
        command: ({ editor, range, props }) => props.run(editor, range),
        items: ({ query }) => filterItems(query),
        render: () => {
          let renderer: ReactRenderer<SlashMenuRef> | null = null;
          let unmount: (() => void) | void;
          return {
            onStart: (props) => {
              renderer = new ReactRenderer(SlashMenu, {
                props: {
                  items: props.items,
                  command: (item: SlashItem) => props.command(item),
                },
                editor: props.editor,
              });
              unmount = props.mount(renderer.element);
            },
            onUpdate: (props) => {
              renderer?.updateProps({
                items: props.items,
                command: (item: SlashItem) => props.command(item),
              });
            },
            onKeyDown: (props) => {
              if (props.event.key === "Escape") return false;
              return renderer?.ref?.onKeyDown(props) ?? false;
            },
            onExit: () => {
              unmount?.();
              renderer?.destroy();
              renderer = null;
            },
          };
        },
      }),
    ];
  },
});

export type { SlashItem };
export { ITEMS as slashItems, filterItems };
export type { Editor, Range };
