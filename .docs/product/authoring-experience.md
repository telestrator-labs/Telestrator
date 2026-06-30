# Authoring Experience

> **Status:** first articulation (post-M5). Serves the primary persona in
> [personas-and-use-cases.md](./personas-and-use-cases.md); visuals in
> [design-language.md](./design-language.md). This is interaction direction, not an implementation
> plan — but it names concrete next steps and where they touch today's code.

## North star

Two experiences, one artifact:
- **Compose (Maya):** writing prose and dropping in live cells should feel like *one continuous act
  of writing* — never a context-switch into "code mode." Keyboard-first; the reactive graph is legible.
- **Read (Riley):** opening a shared explorable should feel like a clean essay you can *touch* —
  obvious knobs, no editor chrome, fast.

If composing feels like using an IDE, or reading feels like viewing source, we've missed.

## Where we are (honest assessment, M5)

What works: prose + code cells in one doc; CodeMirror cells; reactive `$` with live output; npm
imports; local-first multi-notebook.

Gaps that block the north star:
- **Insertion is a toolbar**, not inline — you reach to the top bar to add a cell instead of typing
  where you are. No slash menu, no `+`/drag handle on blocks.
- **No reactive inputs.** Explorables live on knobs (sliders/numbers/selects bound to `$`); today a
  "knob" means hand-writing a value in a cell. This is the single biggest gap for the persona.
- **Reactivity is invisible.** You can't see what reacts to what (the design language's provenance
  stroke is unbuilt). Errors/loops surface as text only.
- **Keyboard flow in/out of cells is incomplete** (arrow-out / escape were deferred in M4).
- **No reading mode** — readers see authoring chrome.
- **Output is uniform.** A `$` value, a thrown error, and (future) a rendered React view all want
  different treatment.

## Principles

1. **Write in place.** Inserting anything happens where the cursor is (slash menu / `+`), not from a
   distant toolbar.
2. **Reactivity is legible.** The author can always answer "what does this value drive?" and "why did
   this re-run?" — that's the product's soul; make it visible (design-language signature).
3. **Reading is a mode, not a leftover.** Output and prose are designed for someone who will never
   open the editor.
4. **Progressive disclosure.** Calm by default; power (provenance, cell menus, runtime controls) on
   hover/focus/intent.
5. **One vocabulary.** A control names what it does and keeps that name through the flow ("Run" →
   "Running" → result; "Publish" → "Published").

## The authoring surface

### Block insertion — slash menu + handle (replaces the toolbar)
- **`/` slash menu** at the cursor: `Code (TS)`, `CSS`, `Input ▸ (slider/number/text/select)`,
  `Heading`, `Quote`, `Divider`, later `Chart`, `Embed`. Fuzzy-filtered, keyboard-driven. This is the
  Tiptap UI Components pattern the build guide deferred at M1 — now is the time.
- **Left-gutter affordance** per block: a `+` (insert below) and a **drag handle** (reorder) revealed
  on hover — the Notion/Deepnote move, but quiet (ink-on-paper, no color).
- The current top toolbar (`B / I / H1 / H2 / +TS / +CSS / Restart`) shrinks to a **bubble menu** for
  prose formatting (appears on text selection) + a small notebook-level menu for `Restart runtime`.
  Insertion leaves the toolbar entirely.

### Block types (priority order)
1. **Prose** (have it) — the connective tissue; must feel like writing.
2. **TS code cell** (have it) — the instrument.
3. **Input cell (NEW, highest leverage):** slider / number / text / select / toggle that **writes a
   `$` key**. `$.rate` becomes a labeled slider; editing the explorable = dragging it. This converts
   the product from "notebook" to "explorable" for Maya and is what Riley actually touches.
4. **CSS** (have it) — keep, inert.
5. Later: **Chart** (a thin wrapper over an npm viz lib reading `$`), **Embed/markdown import**.

## Cell ergonomics & keyboard flow

- **Enter at end of a cell** → new prose paragraph after it (don't trap the cursor in code).
- **↑/↓ at code boundary** → move selection into the adjacent prose block; **Backspace in an empty
  cell** → delete the cell and merge up. (The escape-keymap deferred in M4 — build it; it's the
  difference between "fluid" and "fighting the editor.")
- **Cmd/Ctrl+Enter** → run/refresh this cell (even though runs are reactive, an explicit "re-run" is
  reassuring); **Esc** → blur the cell to prose.
- **Cell menu** (⋯ on the handle): duplicate, delete, move up/down, change language, **collapse code**
  (show output only — key for reading-leaning drafts), **convert** input↔code.
- Selecting a cell as a block (atom NodeSelection) should be obvious (a **violet** focus ring), and
  cut/copy/paste of whole cells must preserve `id`/attrs.

## Making "live" legible (the signature, applied)

- **Live dot** (**lime**) on runnable cells; **run pulse** (lime) along the cell edge on execution.
- **Provenance on intent:** focus a cell → its `$` reads/writes highlight; hovering a `$` value →
  **gold-marker**-underline it and draw light **lime** connectors to the cells that react
  (design-language signature). A "trace" toggle pins these for teaching.
- **Errors** read like guidance, in the cell's voice, not a stack dump by default: one-line cause +
  "show details." The **reactive-loop** guard already produces a clear message — surface it inline with
  a "which cells?" affordance.
- **Re-run ripple:** when `$.x` changes, dependents flash a one-shot gold-marker underline so the
  author (and reader) *sees* propagation.

## Reading mode (Riley, first-class)

- A **Read / Edit toggle** (and the default when opening a *shared* link is Read).
- Read mode: no sidebars, no cell toolbars/gutters; code cells **collapsed to their output by default**
  with a quiet "show code" disclosure; inputs remain interactive (that's the point); prose at full
  measure; mobile-legible.
- The explorable should be enjoyable with **zero edits** — drag a slider, see the model move.

## Prose ergonomics (it's a writing tool)

- **Bubble menu** on selection (bold/italic/code/link/heading) — keep formatting out of a fixed bar.
- **Markdown input rules** (`# `, `> `, `- `, ``` ``` ` ```, `**`) for type-don't-click authoring.
- **Links, inline code, callouts**; later footnotes/sidenotes (great for explorables).

## Voice & copy (from the design brief)
Active, plain, end-user framing. Labels name what the user controls: "Run", "Add input", "Show code",
"Share" — not "Execute", "Insert widget node", "Toggle NodeView". Errors explain + offer the fix;
empty states invite ("Press `/` to add a cell, or just start writing"). One name per action across the
whole flow.

## Prioritization

**Near-term (the authoring increment — pairs with the design-language styling pass):**
1. Slash menu + block handle (insert in place) — biggest "feels fluid" win.
2. **Input cells** bound to `$` — biggest "this is an explorable" win.
3. Keyboard flow in/out of cells (arrow-out, backspace-empty, Esc/Cmd-Enter).
4. Reading mode (Read/Edit toggle, collapse-to-output).
5. Apply the design-language tokens/fonts (styling pass).

**Later (see [stretch-goals.md](./stretch-goals.md)):** provenance-stroke visualization, chart block,
AI assist, comments, footnotes/sidenotes, templates.

> These are **product/design directions, not committed milestones.** They slot between the
> capability milestones (M6 collab, M7 sharing, M8 distribution) of
> [../greenfield-build-guide.md](../greenfield-build-guide.md) — capability and craft advancing together.
