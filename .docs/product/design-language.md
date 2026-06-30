# Design Language — "Ink & Signal"

> **Status:** first articulation (post-M5). Serves the primary persona in
> [personas-and-use-cases.md](./personas-and-use-cases.md) (explorable authors, educators, and their
> readers). This is the visual/identity direction; the interaction direction is in
> [authoring-experience.md](./authoring-experience.md). Inspiration reference:
> [../design/inspiration-00.png](../design/inspiration-00.png) (Deepnote — borrowed for *craft*, not domain or palette).

## Thesis: ink drawn over a live signal

A **telestrator** is the marker a commentator draws over live video with — annotation on top of
something moving. That is exactly this product: an author *draws prose over live computation*, and
reactive values flow between cells like a signal. The identity makes that literal:

- an **editorial reading surface** (this is a tool for *explaining*, so it should read like a
  considered document, not a SaaS app shell), with
- a single **marker** accent (the telestrator stroke) reserved for one job — showing what is *live*
  and what *reacts to what*.

**The product is a document you can think with.** The design should feel closer to a beautifully set
explorable essay than to an IDE.

### What we are deliberately *not* doing
- Not the cream-paper + high-contrast-serif + terracotta look (the current AI-design cliché).
- Not the near-black + acid-green/vermilion look.
- Not the broadsheet hairline-rules look.
- Not Deepnote's friendly-SaaS indigo/blue — we take its **block craft and calm chrome**, not its palette.

## Palette — "Ink & Signal"

A cool *drafting-board* surface (not warm cream), near-black **ink**, and **two accents with strict
jobs**: a marigold **marker** (the signature; annotation/highlight/active) and a teal **signal**
(functional only; "live", reactivity, running).

| Token | Hex | Role |
|---|---|---|
| `--paper` | `#FCFCFE` | Reading surface (cool near-white) |
| `--panel` | `#EEF0F5` | Chrome: sidebar, cell headers, inset wells |
| `--line` | `#DEE1EA` | Hairlines, borders, dividers |
| `--ink` | `#17171F` | Primary text + primary buttons (dark fill) |
| `--slate` | `#5B6072` | Secondary/UI text, labels, captions |
| `--marker` | `#F5B301` | **Signature.** Highlight/underline, active cell, run pulse. Used like a highlighter, sparingly. |
| `--signal` | `#0FB5C9` | Functional only: "live" dots, reactive connectors, running state, `$` provenance |

- **Spend boldness on `--marker`.** It is the one loud thing; everything else is ink/slate/line on
  paper. Primary actions are **ink-filled** (dark), not marker-filled — the marker is for *drawing
  over*, not for chrome.
- `--marker` is typically used at low alpha as a highlighter wash (`#F5B301` @ ~22%) so it reads as
  *ink over content*, not a fill.
- **Dark/"broadcast" mode (later):** invert to a true near-black `#0E0E13` surface where the marker
  and signal pop like markings over live video — defer to a theming pass, but the palette is chosen so
  it survives the inversion.

## Typography — editorial prose, technical chrome

The risk worth taking: **set prose in a serif.** Every notebook/SaaS tool defaults to Inter
everywhere; an explorable-explanation tool earns trust by *reading like an essay*. So reading text is
a screen-optimized serif, while UI chrome and code stay sans/mono — the contrast itself signals
"document, not app."

| Role | Family | Notes |
|---|---|---|
| Display (notebook title, hero) | **Fraunces** (variable, opsz/soft) | Characterful, optically-sized; used *sparingly* — title + section openers only |
| Reading / prose | **Newsreader** | Screen-tuned serif for body prose; generous measure & leading |
| UI / utility | **Geist Sans** | Labels, buttons, sidebar, cell chrome, captions — technical, calm |
| Code & values | **JetBrains Mono** | Code cells, `$` values, data; clear at small sizes |

All four are open-licensed (Google Fonts / OFL / Vercel OFL). Scale (fluid):

- Title `clamp(28px, 4vw, 40px)` Fraunces · section heading 22–26 · prose **18/1.7** Newsreader ·
  UI 13–14 Geist · code 13 JetBrains Mono · caption/label 11–12 Geist, tracked +.04em, uppercase for
  eyebrows only.

## Layout — the document is the hero

Three zones (the proven notebook shell, à la the inspiration), but the center reads as an **explorable
essay**, not a code grid: a comfortable single-column measure, prose in serif, and **code cells as
quiet "instruments" inset into the narrative** rather than dominating it.

```
┌──────────┬───────────────────────────────────────┬───────────┐
│ NOTEBOOKS│   Title (Fraunces)                     │  CONTEXT  │
│  · doc a │   ─────────────────────────────        │ (later:   │
│  · doc b │   Prose, set in Newsreader, at a        │  outline, │
│ [+ new]  │   comfortable reading measure…          │  comments,│
│          │                                          │  AI)      │
│ (quiet,  │   ┌───────────────────────────┐  ‹inst› │           │
│  panel,  │   │ ▷ ts   $.rate            ●live│       │  collapsed│
│  ink-on- │   │   12  ································│      │  by      │
│  panel)  │   └───────────────────────────┘        │  default  │
│          │   …prose continues, and a value set     │           │
│          │   here is ✎underlined-in-marker where   │           │
│          │   another cell reacts to it…            │           │
└──────────┴───────────────────────────────────────┴───────────┘
```

- **Left** stays quiet (`--panel`, ink-on-panel, no color) so the document holds attention.
- **Center** is the document: max measure ~68–72ch for prose; cells break out slightly wider.
- **Right** context panel (outline / comments / AI) is **collapsed by default** — it's support, not
  the stage. (Deepnote keeps it open; we don't, because reading is the job.)
- **Reading mode (Riley):** a toggle that strips *all* chrome — no sidebars, no cell toolbars, code
  collapsible — leaving the explorable as a clean essay. First-class, not an afterthought.

## Signature — the telestrator stroke (reactive provenance)

**The one memorable element:** reactivity is drawn, not hidden. When a cell writes `$.rate` and
another cell reads it, the connection is rendered as a **hand-drawn-feeling marker stroke** — a
`--marker` underline on the source value and, on hover/focus, a light **connector** (in `--signal`)
to the cells that react. Running a cell emits a brief `--signal` pulse along that path.

This is subject-true twice over: it *is* a telestrator drawing over the live play, **and** it makes
the product's defining feature — the reactive `$` graph — visible and legible. No other notebook draws
its dependency graph as marker annotation; this is ours.

Keep it disciplined: the stroke appears on **focus/hover or when tracing**, not constantly (a
permanently scribbled page is noise). Default state is calm; the marker reveals on intent.

## Motion — restrained, signal-shaped

- **Run pulse:** a single `--signal` sweep along the cell edge / provenance path on execution (~400ms).
- **Reactive ripple:** when `$.x` changes, dependents get a one-shot subtle marker-underline flash —
  the reader *sees* the propagation that just happened.
- **Reveal on intent:** provenance connectors draw on hover/focus (a quick "ink" draw-on), gone on blur.
- Everything respects `prefers-reduced-motion` (pulses become instant state changes). No ambient/looping motion.

## Component direction (applies the system)

- **Cell = "instrument":** quiet `--panel` header (lang chip + run + live dot in `--signal`), body in
  JetBrains Mono on `--paper`, hairline `--line` border, generous radius (10px). Inert/non-runnable
  cells lose the live dot. Output sits below in a calmer well; `$` writes shown as
  `<key>` in `--marker`-underlined mono.
- **Inputs** (sliders/fields bound to `$`) are first-class "instruments" too — the explorable's knobs.
- **Buttons:** primary = `--ink` fill / paper text; secondary = `--line` outline; the marker is never a
  button fill.
- **Title** in Fraunces; the editable title field should feel like a manuscript title, not a form input.

## Quality floor (non-negotiable)
Responsive to mobile (readers arrive on phones); visible keyboard focus (`--signal` ring);
`prefers-reduced-motion` honored; prose meets contrast AA (ink on paper ≈ 16:1); the marker accent is
never the *only* signal for state (pair with shape/text, since marigold + colorblindness).

## The one risk (named)
**Serif prose + cells-as-instruments + drawn reactive provenance** makes Telestrator read like an
editorial explorable, not an IDE — less dense/"powerful-looking" than Deepnote. Justified: the primary
users are authors and *readers of explanations*, for whom reading quality and a legible reactive graph
matter more than IDE density. If it ever fights real authoring throughput, the reading-mode/edit-mode
split absorbs the tension.

## Mapping to current code
Today `app.css`/`editor.css` use `system-ui` and an ad-hoc purple (`#6a4ed6`) for `$` keys. Adopting
this language means: load the four fonts; replace the palette with the tokens above (CSS custom
properties on `:root`); set prose to Newsreader, chrome to Geist, code to JetBrains Mono, title to
Fraunces; recolor `$` values/active state to `--marker`/`--signal`. This is a **styling pass**
(no logic change) and a natural companion to the [authoring-experience](./authoring-experience.md) work.
