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
    title: "TypeScript cell",
    group: "Live",
    icon: "TS",
    desc: "Reactive code, shares $",
    run: (e, r) => {
      e.chain().focus().deleteRange(r).run();
      insertCodeCellAt(e, r.from, "typescript");
    },
  },
  {
    title: "CSS cell",
    group: "Live",
    icon: "{}",
    desc: "Styles for the document",
    run: (e, r) => {
      e.chain().focus().deleteRange(r).run();
      insertCodeCellAt(e, r.from, "css");
    },
  },
  {
    title: "Input (slider)",
    group: "Live",
    icon: "◉",
    desc: "A knob bound to a $ value",
    run: (e, r) => {
      e.chain().focus().deleteRange(r).run();
      insertInputCellAt(e, r.from);
    },
  },
  {
    title: "Heading 1",
    group: "Prose",
    icon: "H1",
    desc: "Big section title",
    run: (e, r) =>
      e.chain().focus().deleteRange(r).setNode("heading", { level: 1 }).run(),
  },
  {
    title: "Heading 2",
    group: "Prose",
    icon: "H2",
    desc: "Subsection title",
    run: (e, r) =>
      e.chain().focus().deleteRange(r).setNode("heading", { level: 2 }).run(),
  },
  {
    title: "Quote",
    group: "Prose",
    icon: "❝",
    desc: "Blockquote",
    run: (e, r) => e.chain().focus().deleteRange(r).toggleBlockquote().run(),
  },
  {
    title: "Divider",
    group: "Prose",
    icon: "―",
    desc: "Horizontal rule",
    run: (e, r) => e.chain().focus().deleteRange(r).setHorizontalRule().run(),
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
