# Stretch Goals — bets for a subsequent release

> **Status:** idea backlog, explicitly **not committed**. These are post-foundation bets that deepen
> the value for [our personas](./personas-and-use-cases.md) once the near-term
> [authoring-experience](./authoring-experience.md) increment and the capability milestones (M6–M8 in
> [../greenfield-build-guide.md](../greenfield-build-guide.md)) are in. Each notes *who it's for*,
> *why it matters*, and *what it depends on*. Prune ruthlessly against the one-line test ("does it help
> turn an idea into a shareable interactive explanation?").

## Tier 1 — strongest fit (do soon after the authoring increment)

- **Provenance visualization, full.** The design-language signature taken all the way: hover/trace the
  reactive graph as gold-marker strokes + lime connectors; a "dependency lens" — the play-by-play of
  the data flow. *Maya/Riley · soul of the product · depends on: reactive runtime (M3 ✅) + the styling pass.*
- **Chart block.** A first-class viz cell wrapping an npm chart lib, reading `$` and re-rendering
  reactively — so "input → chart" needs no boilerplate. *Maya · the most common explorable shape ·
  depends on: input cells + a sanctioned viz lib.*
- **Knowledge-check block.** A first-class node for lesson checks: the author fills in a question, an
  answer kind (multiple-choice / numeric / short-text), the expected answer + tolerance, and feedback —
  instead of hand-wiring an input cell plus a grading code cell (the manual pattern in
  `src/templates/bitsTutorial.ts`). Easier *and* more powerful: hints, reveal-answer, and per-doc
  progress/scoring. *Maya (educator)/Riley (learner) · lessons are a core explorable shape · depends on:
  input cells (✅) + reactive runtime (M3 ✅); a NodeView alongside codeCell/inputCell.*
- **Comments & annotations.** Inline comments on prose/cells (the telestrator metaphor extended to
  collaborators literally drawing on the doc). *Maya/Sam · co-authoring & review · depends on: collab (M6).*
- **`export const x → $.x` sugar.** Let cells *export* values into `$` instead of assigning, matching
  the TypeCell ergonomic and cleaning up authored code. *Maya/Devon · authoring polish · depends on:
  transpile pipeline (M4 ✅), bridge.*

## Tier 2 — high value, larger lift

- **AI assist ("draw it for me").** Generate/edit/refactor cells from a prompt; "explain this cell,"
  "suggest an input for this value," "turn this paragraph into an interactive." The inspiration's agent
  panel — but framed as *annotating your explorable*, not generic chat. *All personas · accelerant ·
  depends on: stable cell/runtime model.*
- **Cross-notebook imports + helper lib (`import "telestrator"`).** Reusable `Input`, `AutoForm`,
  `onDispose`, `editor.registerBlock()`; import one notebook into another as a live module. *Devon/Maya
  · composition & reuse · depends on: distribution (M8).*
- **Templates & gallery.** Start-from-template (explorable explainer, library tutorial, lesson,
  calculator) + a public gallery of published explorables (also the best marketing). *Maya/Devon/Riley.*
- **Footnotes & sidenotes.** Editorial apparatus explorables lean on (Tufte-style margin notes).
  *Maya · reading craft · depends on: prose extensions.*

## Tier 3 — platform / reach

- **Dark "broadcast" mode + theming.** The inverted near-black surface from the design language;
  author-selectable themes for published explorables. *All · polish/reach.*
- **Embeds.** Drop a live cell or whole explorable into an external page/blog (iframe/web component).
  *Devon · distribution · depends on: export (M8).*
- **Presence-driven teaching mode.** Live cursors + "follow the author" for synchronous lessons.
  *Maya (educator)/Riley · depends on: collab presence (M6).*
- **Version history / snapshots.** Named versions of a notebook (Yjs snapshots) — safety + "show the
  diff" for teaching. *Maya/Sam · depends on: Yjs (M5 ✅).*
- **Mobile authoring** (reading is already a M-near goal). *Maya on the go · lower priority.*
- **Import from MDX / Observable / Jupyter.** Lower the switching cost for authors with existing
  material. *Maya/Devon · adoption.*

## Deliberately parked (revisit only if the audience shifts)
Python/SQL kernels · data-warehouse connectors · scheduled refresh/BI · full multi-file IDE / deploy
pipelines. These serve the *non-goal* personas; pursuing them would blur the product (see
[personas-and-use-cases.md](./personas-and-use-cases.md#non-goals-what-keeps-us-focused)).

## How to use this list
Treat it as options, not a plan. When a capability milestone lands, pull the stretch items it unlocks
and re-rank against the one-line test and current user evidence. The point of writing them down now is
**focus**: a named backlog makes it easier to say "not yet" to everything else.
