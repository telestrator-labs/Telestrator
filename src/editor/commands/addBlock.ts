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

            // `relative` gives the empty paragraph a positioning context for the
            // overlaid affordance.
            const line = Decoration.node($from.before(), $from.after(), {
              class: "relative",
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
              // Tailwind utilities (not editor.css): the rules are click-through
              // and hidden until the row is hovered (group) or the editor is
              // focused (group-focus-within/tiptap — see NotebookEditor).
              const el = document.createElement("div");
              el.dataset.slot = "add-block";
              el.contentEditable = "false";
              el.className =
                "group pointer-events-none absolute inset-0 flex select-none items-center gap-2.5";

              const rule =
                "h-px flex-1 bg-border-subtle opacity-0 transition-opacity group-hover:opacity-100 group-focus-within/tiptap:opacity-100";
              const ruleL = document.createElement("span");
              ruleL.className = rule;
              const ruleR = document.createElement("span");
              ruleR.className = rule;

              const btn = document.createElement("button");
              btn.type = "button";
              btn.dataset.slot = "add-block-btn";
              btn.className =
                "pointer-events-auto grid size-[22px] flex-none place-items-center rounded-md border border-border bg-surface text-base leading-none text-text-faint transition-colors hover:border-action-border hover:bg-action-subtle hover:text-action-text";
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
