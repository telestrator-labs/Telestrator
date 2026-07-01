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
import { walkPath } from "@/editor/cells/valueRef/valueRef";

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

function items({ query }: { query: string }): SlashItem[] {
  const entries = getValueEntries();
  // Authors type the reference as they'd write it in code — `$.rate` — so the
  // leading dot is part of the query. Strip it so `$.rate` and `$rate` both match.
  const raw = query.replace(/^\./, "");
  const list: SlashItem[] = [];

  const dot = raw.lastIndexOf(".");
  if (dot >= 0) {
    // Drill in: complete the keys of the object at the path prefix, so
    // `styles.vars.` offers `gap`, `pad`, … — reaching nested `$` values.
    const prefix = raw.slice(0, dot); // "styles.vars"
    const partial = raw.slice(dot + 1).toLowerCase();
    const segs = prefix.split(".");
    const headEntry = entries.find((e) => e.key === segs[0]);
    const container = headEntry
      ? walkPath(headEntry.value, segs.slice(1))
      : undefined;
    if (container && typeof container === "object") {
      for (const k of Object.keys(container as Record<string, unknown>)) {
        if (!k.toLowerCase().includes(partial)) continue;
        const path = `$.${prefix}.${k}`;
        list.push({
          title: path,
          group: "Values",
          icon: "$",
          desc: short((container as Record<string, unknown>)[k]),
          run: dropChip(path),
        });
      }
    }
  } else {
    const q = raw.toLowerCase();
    const matches = entries.filter((e) => e.key.toLowerCase().includes(q));
    for (const e of matches)
      list.push({
        title: `$.${e.key}`,
        group: "Values",
        icon: "$",
        desc: short(e.value),
        run: dropChip(`$.${e.key}`),
      });

    // Let the author reference a key nothing writes yet (identifier-shaped
    // queries only, so a literal "$5" doesn't offer a bogus chip).
    const exact = entries.some((e) => e.key === raw);
    if (raw && !exact && IDENT.test(raw)) {
      list.push({
        title: `$.${raw}`,
        group: matches.length ? "New" : "Values",
        icon: "+",
        desc: "reference this key",
        run: dropChip(`$.${raw}`),
      });
    }
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
