import { Extension } from "@tiptap/core";
import { PluginKey } from "@tiptap/pm/state";
import Suggestion from "@tiptap/suggestion";
import { ReactRenderer } from "@tiptap/react";
import {
  SlashMenu,
  type SlashItem,
  type SlashMenuRef,
} from "@/editor/commands/SlashMenu";
import {
  insertValueRefAt,
  insertComputedValueRefAt,
} from "@/editor/commands/insertCells";
import { getValueEntries } from "@/editor/cells/valueRef/valueKeys";
import { flattenValuePaths } from "@/editor/cells/valueRef/valueRef";

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
  (expr: string): SlashItem["run"] =>
  (editor, range) => {
    editor.chain().focus().deleteRange(range).run();
    insertValueRefAt(editor, range.from, expr);
  };

const dropComputed: SlashItem["run"] = (editor, range) => {
  editor.chain().focus().deleteRange(range).run();
  insertComputedValueRefAt(editor, range.from);
};

const MAX_MATCHES = 12;

function items({ query }: { query: string }): SlashItem[] {
  // Every dot-accessible path — top-level keys *and* nested object leaves — so a
  // nested value like `styles.vars.gap` is searchable by name, not only by
  // drilling its parent. `styles.` (trailing dot) also just substring-matches
  // every `styles.*` path, so drilling still works without a special case.
  const paths = flattenValuePaths(getValueEntries());
  // Authors type the reference as they'd write it in code — `$.rate` — so the
  // leading dot is part of the query. Strip it so `$.rate` and `$rate` both match.
  const raw = query.replace(/^\./, "");
  const q = raw.toLowerCase();
  const list: SlashItem[] = [];

  const matches = paths
    .filter((p) => p.path.toLowerCase().includes(q))
    // Shallower paths first (top-level before nested), then alphabetical — so the
    // list reads root-out and a bare `$` leads with the top-level values.
    .sort(
      (a, b) =>
        a.path.split(".").length - b.path.split(".").length ||
        a.path.localeCompare(b.path),
    )
    .slice(0, MAX_MATCHES);

  for (const m of matches)
    list.push({
      title: `$.${m.path}`,
      group: "Values",
      icon: "$",
      desc: short(m.value),
      run: dropChip(`$.${m.path}`),
    });

  // Let the author reference a key nothing writes yet (identifier-shaped queries
  // only, so a literal "$5" doesn't offer a bogus chip).
  const exact = paths.some((p) => p.path === raw);
  if (raw && !exact && IDENT.test(raw)) {
    list.push({
      title: `$.${raw}`,
      group: matches.length ? "New" : "Values",
      icon: "+",
      desc: "reference this key",
      run: dropChip(`$.${raw}`),
    });
  }

  // Always offer a computed chip — an expression can't be typed into this popup
  // (the query stops at whitespace), so it opens its own editor instead.
  list.push({
    title: "Compute…",
    group: "Expression",
    icon: "ƒ",
    desc: "a computed value — e.g. $.rate * $.qty",
    run: dropComputed,
  });
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
