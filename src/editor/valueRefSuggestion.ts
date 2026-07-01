import { Extension } from "@tiptap/core";
import { PluginKey } from "@tiptap/pm/state";
import Suggestion from "@tiptap/suggestion";
import { ReactRenderer } from "@tiptap/react";
import { SlashMenu, type SlashItem, type SlashMenuRef } from "./SlashMenu";
import { insertValueRefAt } from "./insertCells";
import { getValueEntries } from "./valueKeys";

// `$`-triggered autocomplete for inline value chips. Typing `$` at a word
// boundary opens a picker of the notebook's live `$` keys (with current values);
// choosing one drops a `valueRef` chip. Also offered: "reference this key" for a
// name nothing has written yet. Thin wrapper over @tiptap/suggestion, mirroring
// slashCommand; the popup reuses SlashMenu. Keys come from the module registry
// (valueKeys) since this popup renders outside the React provider tree.

const ValueRefPluginKey = new PluginKey("valueRefSuggestion");

const IDENT = /^[A-Za-z_][\w]*$/;

function short(v: unknown): string {
  if (v === undefined) return "—";
  if (v === null) return "null";
  switch (typeof v) {
    case "number":
    case "boolean":
      return String(v);
    case "string":
      return JSON.stringify(v);
    default:
      return Array.isArray(v) ? "[…]" : "{…}";
  }
}

const dropChip =
  (name: string): SlashItem["run"] =>
  (editor, range) => {
    editor.chain().focus().deleteRange(range).run();
    insertValueRefAt(editor, range.from, name);
  };

function items({ query }: { query: string }): SlashItem[] {
  const entries = getValueEntries();
  const q = query.toLowerCase();
  const matches = entries.filter((e) => e.key.toLowerCase().includes(q));

  const list: SlashItem[] = matches.map((e) => ({
    title: `$.${e.key}`,
    group: "Values",
    icon: "$",
    desc: short(e.value),
    run: dropChip(e.key),
  }));

  // Let the author reference a key nothing writes yet (identifier-shaped queries
  // only, so a literal "$5" doesn't offer a bogus chip).
  const exact = entries.some((e) => e.key === query);
  if (query && !exact && IDENT.test(query)) {
    list.push({
      title: `$.${query}`,
      group: matches.length ? "New" : "Values",
      icon: "+",
      desc: "reference this key",
      run: dropChip(query),
    });
  }
  return list;
}

export const ValueRefSuggestion = Extension.create({
  name: "valueRefSuggestion",

  addProseMirrorPlugins() {
    return [
      Suggestion<SlashItem, SlashItem>({
        editor: this.editor,
        pluginKey: ValueRefPluginKey,
        char: "$",
        // Trigger only at a textblock start or after whitespace — mid-word `$`
        // (e.g. a stray "cost$") and atoms never open the picker.
        allow: ({ state, range }) => {
          const $from = state.doc.resolve(range.from);
          if (!$from.parent.isTextblock) return false;
          const before = $from.parent.textBetween(0, $from.parentOffset);
          return /(^|\s)$/.test(before);
        },
        command: ({ editor, range, props }) => props.run(editor, range),
        items,
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
