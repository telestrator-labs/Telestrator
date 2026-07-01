import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

// On the empty paragraph that holds the cursor, show a Deepnote-style add
// affordance: a faint full-width separator with a centered "+" that opens the
// block menu. Clicking "+" inserts "/" so the existing slash menu takes over —
// one code path for keyboard (type /) and mouse (click +). Typing anything
// dismisses it, since the paragraph is no longer empty.
const addBlockKey = new PluginKey("addBlock");

export const AddBlock = Extension.create({
  name: "addBlock",

  addProseMirrorPlugins() {
    const editor = this.editor;
    return [
      new Plugin({
        key: addBlockKey,
        props: {
          decorations(state) {
            if (!editor.isEditable) return null;
            const { $from, empty } = state.selection;
            if (!empty) return null;
            const node = $from.parent;
            // Only an empty paragraph (headings/quotes/cells have their own UX).
            if (node.type.name !== "paragraph" || node.content.size !== 0) {
              return null;
            }

            const line = Decoration.node($from.before(), $from.after(), {
              class: "is-empty-line",
            });
            const affordance = Decoration.widget(
              $from.start(),
              buildAffordance,
              {
                side: -1,
                key: "add-block",
                // Not part of the selectable content — don't let it shift the caret.
                ignoreSelection: true,
              },
            );
            return DecorationSet.create(state.doc, [line, affordance]);

            function buildAffordance() {
              const el = document.createElement("div");
              el.className = "add-block";
              el.contentEditable = "false";

              const ruleL = document.createElement("span");
              ruleL.className = "add-block__rule";
              const ruleR = document.createElement("span");
              ruleR.className = "add-block__rule";

              const btn = document.createElement("button");
              btn.type = "button";
              btn.className = "add-block__btn";
              btn.title = "Add block (or type /)";
              btn.setAttribute("aria-label", "Add block");
              btn.textContent = "+";
              // preventDefault on mousedown so the editor doesn't move the caret
              // out from under us before the click fires.
              btn.addEventListener("mousedown", (e) => e.preventDefault());
              btn.addEventListener("click", () => {
                editor.chain().focus().insertContent("/").run();
              });

              el.append(ruleL, btn, ruleR);
              return el;
            }
          },
        },
      }),
    ];
  },
});
