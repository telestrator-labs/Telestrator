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
  Scoped into three concrete directions via design prototypes in `.docs/features-roadmap/`
  (`Studio Mode.dc.html`, `StudioView.dc.html`, `Trace Concepts.dc.html`), evaluated 2026-07-01:
  - **Studio mode + Trace Inspector (recommended first bet).** A toggleable author dock (dependency
    graph + live `$` state table + inputs board) paired with click-to-inspect on any value
    ("made of / why it recomputed / what it drives") — directly implements the "reactivity is
    legible" design mandate. Highest-confidence, lowest-lift pairing: the `document`/`studio` layout
    toggle already exists in code (unwired), and both draw on dependency-graph data the runtime
    already computes live. Needs new: click-to-select state (Trace is hover-only today) and a causal
    "why it changed" diff (currently only current state is recorded, not history).
  - **Guided annotation walkthroughs (phase 2).** Author circles/captions a sequence of values, saved
    with the doc; reader steps Next/Prev. Clean architectural fit — additive Yjs structure alongside
    existing per-notebook doc persistence, no runtime change — and serves Riley directly, not just Maya.
  - **Step-by-step replay/scrubber — needs intent validation before scoping further.** Weakest grounding
    in current product language: today's "replay" means the reader manipulating live inputs, not
    scrubbing a recorded history. Also the only direction requiring new runtime-level history
    instrumentation (the engine currently overwrites per-cell state each run rather than logging it)
    plus a bounded-memory story. Don't commit engineering time until there's a clearer answer to what
    problem it solves that the Inspector doesn't.
- **Chart block.** A first-class viz cell wrapping an npm chart lib, reading `$` and re-rendering
  reactively — so "input → chart" needs no boilerplate. *Maya · the most common explorable shape ·
  depends on: input cells + a sanctioned viz lib.*
- **Knowledge-check block — extend.** ✅ Shipped (`knowledgeCheckNode.ts`): a first-class graded question
  — multiple-choice / numeric / short-text, live feedback (hint when wrong, explanation when right), and
  optional `$` progress (`$[name]` + `$[name]Correct`) so a cell can tally a score; showcased in the bits
  tutorial. *Still open:* reveal-answer, richer scoring / quiz summaries, and rich-prose questions.
  *Maya (educator)/Riley (learner).*
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
