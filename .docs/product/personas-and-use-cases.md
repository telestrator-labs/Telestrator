# Personas & Use Cases

> **Status:** first articulation (post-M5). This is the product foundation the
> [design-language](./design-language.md) and [authoring-experience](./authoring-experience.md)
> docs build on. The engineering roadmap lives in
> [../greenfield-build-guide.md](../greenfield-build-guide.md); this is the *why/for-whom* that the
> milestones serve.

## Positioning

**Telestrator is a reactive notebook for writing things you can *think with* — documents where
prose and live TypeScript/React cells share state, so an explanation and the thing it explains are
the same artifact.**

It is not a data-science notebook (Python/SQL/ETL — that's Deepnote/Jupyter), not a code playground
(throwaway snippets — that's CodeSandbox), and not a BI dashboard tool. It sits where **TypeCell and
Observable** sit: the *computational document* — but TypeScript-first and React-native, local-first,
and collaborative.

**Primary audience (decided): explorable authors & educators** — people who write to *explain*, and
whose explanations are better when the reader can run, tweak, and see. Everything below centers them;
secondary personas are served only where they don't dilute that focus.

### The one-line test
If a feature helps someone **turn an idea into an interactive, shareable explanation faster**, it's
on-mission. If it mainly helps crunch data or ship a production app, it's not (however adjacent).

---

## Primary personas

### 1. Maya — the technical educator / explorable author
**Who:** Writes interactive tutorials, "explorable explanations," course material, and conceptual
deep-dives (think: a post explaining how a Bloom filter works, with a live, tweakable widget).
Comfortable in TS/JS; not a designer; cares deeply about clarity.

**Jobs to be done**
- "When I explain a concept, let the reader **manipulate** it, not just read about it."
- "Let me interleave narrative and runnable code without context-switching to a separate sandbox."
- "Publish a link that *just works* for readers — no install, no build."

**Frustrations with the status quo**
- MDX/static-site setups: every interactive widget is a bespoke React component + build pipeline.
- Observable: powerful but its own JS dialect/runtime; not TypeScript-native, not React-native.
- Jupyter/Colab: Python world; not for TS/React/web explanations; ugly to publish.

**What Telestrator gives her**
- Prose + reactive code cells sharing `$`, so a slider in one cell drives a chart in another with no
  wiring (M3). npm imports with no setup (M4). Local-first drafts (M5).
- Eventually: publish/embed (M8), so the explorable lives anywhere.

**Success moment:** she writes three cells — an input, a computation, a visual — they react to each
other, she shares a link, and a reader changes a number and *understands*.

### 2. Devon — the developer advocate / docs author
**Who:** Maintains a library or platform; writes docs, changelogs, and "try it" guides. Wants the
docs to be *runnable* and always-correct against the real package.

**Jobs to be done**
- "Embed a **live playground** of my library right in the explanation, importing the real npm package."
- "Let readers fork the example and experiment."
- "Keep examples honest — if they run here, they work."

**What Telestrator gives him:** runtime npm imports (M4) mean docs import the actual package; reactive
cells make 'change the input, see the output' trivial; forking + sharing (M7) lets readers take the
example with them.

**Success moment:** a reader pastes their own data into his library's live example and it works,
before they've installed anything.

---

## Secondary personas (served, not centered)

### 3. Priya — the frontend prototyper
Sketches React/TS UI + logic fast, pulls npm packages, shares a link instead of spinning up a repo.
Telestrator is a reactive scratchpad. **Served by** the same core (cells, npm, share); **not driven
by** her needs where they'd pull toward "full app IDE."

### 4. Sam — the internal-tools / living-docs author
Writes a team runbook or a small reactive calculator/dashboard (inputs → live computation), shared
with colleagues. Overlaps the explorable author but for *internal* audiences. **Served by** reactive
inputs + collaboration (M6) + sharing (M7).

### 5. Riley — the reader / learner (the audience!)
**Easy to forget: most people who touch an explorable never author one.** Riley opens a shared
notebook to *understand* something — reads, drags a slider, maybe forks to tinker. Riley's experience
(fast load, obvious interactivity, no broken cells, mobile-legible) is a first-class design concern,
not an afterthought. A great authoring tool that produces a poor reading experience fails its purpose.

---

## Representative use cases

1. **Explorable explanation.** "How does rate-limiting work?" — a token-bucket widget: an input cell
   (requests/sec), a simulation cell reading `$.rate`, a chart cell. Reader tunes the rate, watches
   it throttle. *(Core: reactive `$`, inputs, viz via npm.)*
2. **Interactive library tutorial.** A docs page for a charting lib that `import`s the real package
   and renders live examples the reader edits. *(npm imports, fork.)*
3. **Course module / lesson.** A sequence of prose + exercises; learners edit a cell to complete a
   task and immediately see results. *(Cells, reactivity, later: sharing/assignments.)*
4. **Concept calculator / model.** "Mortgage explained" or "how compounding works" — sliders bound to
   `$`, formulas in cells, a live result + chart. *(Reactive inputs, prose+code.)*
5. **Living technical doc / runbook (internal).** A spec or runbook with live, always-current
   computed values pulled from a package or fixture. *(Collaboration, reactivity.)*
6. **Reading & forking (Riley).** Opening a shared explorable, interacting, forking to experiment.
   *(Publish/share, fork — M7/M8.)*

---

## Non-goals (what keeps us focused)

- **Not** a Python/SQL **data-science** notebook (no kernels, warehouses, dataframes-first UX).
- **Not** a **production app host / IDE** (no multi-file project management, deploy pipelines, test
  runners). Export (M8) is "publish this explorable," not "ship this app."
- **Not** a **BI/dashboard** product (no scheduled refresh, data-source governance).
- Heavy **data ingestion/ETL** is out of scope; small fixtures and npm-fetched data are in.

Adjacent personas (data scientist, app developer) may *use* it, but we don't bend the design toward
them.

---

## How this maps to the build (sanity check)

| Persona need | Capability | Milestone |
|---|---|---|
| Prose + runnable code in one doc | Tiptap doc + code cells | M1 ✅ |
| Manipulate-and-see; cells share state | Reactive `$` runtime | M3 ✅ |
| Use real libraries, no setup | esm.sh npm imports | M4 ✅ |
| Drafts that persist; multiple notebooks | Yjs + IndexedDB, multi-doc | M5 ✅ |
| Co-author / live teach | Real-time collaboration | M6 |
| Share / fork / who-can-see | Auth, sharing, fork | M7 |
| Publish an explorable; embed | Export / distribution | M8 |

**Gap this surfaces for the design work:** the milestones deliver *capability*, but the
**authoring experience** (how Maya composes cells fluidly) and the **reading experience** (how Riley
consumes) are under-specified — that's exactly what [authoring-experience.md](./authoring-experience.md)
and [design-language.md](./design-language.md) address.
