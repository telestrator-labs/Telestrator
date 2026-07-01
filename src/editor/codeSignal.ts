import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

// Gold is the "signal" scheme — reserved for reactive `$` values (the live
// `.value-ref` chips). Plain inline `code` is neutral (see typography.plugin.ts),
// but code that *references* a reactive variable (its text contains `$`, e.g.
// `$.rate`) should still read gold. That's content-based, so it can't be a CSS
// selector: this plugin tags each `$`-bearing inline-code range with a
// `.code--signal` class, which editor/app.css paints gold.
export const CodeSignal = Extension.create({
  name: "codeSignal",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("codeSignal"),
        props: {
          decorations(state) {
            const codeMark = state.schema.marks.code;
            if (!codeMark) return null;
            const decos: Decoration[] = [];
            state.doc.descendants((node, pos) => {
              if (
                node.isText &&
                node.text?.includes("$") &&
                codeMark.isInSet(node.marks)
              ) {
                decos.push(
                  Decoration.inline(pos, pos + node.nodeSize, {
                    class: "code--signal",
                  }),
                );
              }
            });
            return decos.length ? DecorationSet.create(state.doc, decos) : null;
          },
        },
      }),
    ];
  },
});
