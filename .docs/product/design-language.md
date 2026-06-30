# Design Language — "Ink & Signal"

> **Status:** revised first articulation (post-M5). Serves the primary persona in
> [personas-and-use-cases.md](./personas-and-use-cases.md) (explorable authors, educators, and their
> readers). Interaction direction in [authoring-experience.md](./authoring-experience.md). Craft
> reference: [../design/inspiration-00.png](../design/inspiration-00.png) (Deepnote).

## Thesis: interactive play-by-play analysis

A **telestrator** is the tool a commentator uses for *play-by-play analysis* — freezing the live play,
circling what matters, drawing the routes, replaying it so you understand. Telestrator-the-product does
that for **technical knowledge work**: an author breaks down an idea by interleaving prose with live
code, and the reader replays it by dragging the inputs and watching the consequences move.

Two forces name the identity:

- **Ink** — this is *knowledge work you read*: considered prose, set seriously, like a technical
  document. (We sit in the lineage of Deepnote/Jupyter as *serious* technical tools — but for TS/React
  explorables, not data pipelines.)
- **Signal** — the live, reactive current running under the prose: values flowing between cells, the
  "play" being analyzed.

The signature move is **drawing the play**: making the reactive flow *visible as annotation* (see
[Signature](#signature--drawing-the-play)).

### What we are deliberately *not* doing
- Not the cream-paper + high-contrast-serif + terracotta cliché.
- Not the near-black + acid-green/vermilion look.
- Not the broadsheet hairline-rules look.
- **Not Inter-everywhere SaaS.** We ground in technical-knowledge-work seriousness (Deepnote/Jupyter
  lineage) and spend identity on an unusual, confident palette + a serif reading voice.

## Palette — Radix `olive` · `lime` · `violet` · `gold`

Built on [Radix Colors](https://www.radix-ui.com/colors) (accessible 12-step scales, light/dark + alpha
variants for free). An **olive** neutral grounds it in a technical/lab register; **lime** is the brand
and carries "live/reactive"; **violet** is the interactive accent; **gold** is the telestrator marker
(highlight/annotation).

| Role | Radix scale | Use |
|---|---|---|
| **Neutral** | `olive` | Surfaces (olive 1–2), panels/wells (3–5), borders (6–8), text (11–12). The whole calm substrate. |
| **Brand — "Signal"** | `lime` | Identity + everything *live/reactive*: run pulse, live dots, the reactive flow, brand mark. (lime-9/10 solid needs dark text; lime-a for washes/glow.) |
| **Accent — interactive** | `violet` | Links, focus rings, selection, primary buttons (violet-9 solid / white text), active nav. The thing you click. |
| **Highlight — "Ink/marker"** | `gold` | The telestrator marker: annotation highlights, the provenance stroke, `$`-value emphasis (gold-a wash + gold-11 text). |

Conventions (Radix steps): `1–2` app/subtle bg · `3–5` component bg (rest/hover/active) · `6–8` borders
(subtle/ui/strong) · `9–10` solid + hover · `11` low-contrast text · `12` high-contrast text. Pull
`@radix-ui/colors` and expose as CSS custom properties (`--olive-1 … --violet-9 …`); dark mode is the
matching Radix dark scales (a true "broadcast booth" dark — defer the theming pass, but the system is
built for it).

- **Spend boldness on the lime↔violet pairing + gold marker.** It's a confident, non-SaaS combination;
  keep everything else olive-quiet so it reads as intentional, not loud.
- **Never rely on hue alone for state** (lime/gold/violet must each pair with shape/text/icon for
  colorblind users).

## Typography — the IBM Plex superfamily, serif voice

One coherent technical family, used in clear roles. The deliberate, anti-Inter move: **prose is set in
a serif** so the document reads like considered knowledge work, not an app.

| Role | Family | Notes |
|---|---|---|
| Reading / prose | **IBM Plex Serif** | Body prose — generous measure & leading; the editorial voice. |
| UI / display | **IBM Plex Sans** | Titles, headings, labels, buttons, sidebar, cell chrome (display = larger/semibold). |
| Code & values | **IBM Plex Mono** | Code cells, `$` values, data. |

All open-licensed (OFL). One superfamily = automatic harmony and a distinctly *technical* character,
with the serif/sans contrast doing the "document vs chrome" signalling. (If titles ever feel flat we can
add one characterful display face — but coherence wins first.)

Scale (fluid): title `clamp(28px, 4vw, 40px)` Plex Sans semibold · section heading 22–26 · prose
**18/1.7** Plex Serif · UI 13–14 Plex Sans · code 13 Plex Mono · eyebrow/label 11–12 Plex Sans,
tracked +.04em, uppercase only for true eyebrows.

## Layout — the document is the hero

Three zones (the proven notebook shell from the inspiration), but the center reads as an **explorable
essay**, not a code grid: a comfortable single-column measure, serif prose, and **code cells as quiet
"instruments" inset into the narrative**.

```
┌──────────┬───────────────────────────────────────┬───────────┐
│ NOTEBOOKS│   Title (Plex Sans, semibold)          │  CONTEXT  │
│  · doc a │   ─────────────────────────────        │ (later:   │
│  · doc b │   Prose, set in IBM Plex Serif, at a    │  outline, │
│ [+ new]  │   comfortable reading measure…          │  comments,│
│          │                                          │  AI)      │
│ (quiet,  │   ┌───────────────────────────┐  ‹inst› │           │
│  olive,  │   │ ▷ ts   $.rate            ●live│       │  collapsed│
│  no hue) │   │   12  ································│      │  by      │
│          │   └───────────────────────────┘        │  default  │
│          │   …and a value set here is ✎marked in   │           │
│          │   gold, with lime connectors drawn to   │           │
│          │   the cells that react to it…           │           │
└──────────┴───────────────────────────────────────┴───────────┘
```

- **Left** stays quiet (olive, no hue) so the document holds attention.
- **Center** is the document: prose measure ~68–72ch; cells break out slightly wider.
- **Right** context panel collapsed by default — support, not the stage. (We diverge from Deepnote here:
  reading is the job.)
- **Reading mode (Riley):** a toggle that strips *all* chrome — no sidebars, no cell toolbars, code
  collapsible — leaving the explorable as a clean essay. **First-class; default when opening a shared
  link.**

## Signature — drawing the play

**The one memorable element: reactivity is drawn, not hidden.** A value's *provenance* — the chain of
what-feeds-what — is normally invisible. We make it the telestrator's play-by-play:

- Focus a cell, or hover a `$` value, and it gets a **gold marker** highlight, with light **lime
  connectors** drawn to the cells that read it (and pulsing along the path when it recomputes).
- A "trace" toggle pins the diagram for teaching ("here's how the rate drives the chart").

It's subject-true twice: it **is** the telestrator circling a player and drawing the route, **and** it
makes the product's defining feature — the reactive `$` graph — legible. No other notebook draws its
dependency graph as annotation; this is ours.

Keep it disciplined: connectors appear **on focus/hover or when tracing**, not constantly — a
permanently scribbled page is noise. Calm by default; the marker reveals on intent. (Aspirational /
Tier-1 — see [stretch-goals.md](./stretch-goals.md); the palette + motion below are the day-one down payment.)

## Motion — restrained, signal-shaped
- **Run pulse:** one lime sweep along the cell edge / provenance path on execution (~400ms).
- **Reactive ripple:** when `$.x` changes, dependents flash a one-shot gold underline — the reader
  *sees* the propagation.
- **Reveal on intent:** provenance connectors draw on hover/focus (quick "ink" draw-on), gone on blur.
- Respect `prefers-reduced-motion` (pulses become instant state changes). No ambient/looping motion.

## Component direction (applies the system)
- **Cell = "instrument":** quiet olive header (lang chip + run + lime live dot), body in Plex Mono on
  olive-1, hairline olive-6 border, ~10px radius. Inert cells lose the live dot. Output sits in a calmer
  well; `$` writes shown in gold-marked Plex Mono.
- **Inputs** (sliders/fields bound to `$`) are first-class instruments — the explorable's knobs; the
  control track/handle uses violet, the bound value marked in gold.
- **Buttons:** primary = violet-9 solid; secondary = olive-7 outline; gold is never a button fill (it's
  for *drawing over*, not chrome).
- **Title** in Plex Sans; the editable title field reads like a manuscript title, not a form input.

## Quality floor (non-negotiable)
Responsive to mobile (readers arrive on phones); visible keyboard focus (violet ring); reduced-motion
honored; prose contrast AA via Radix `olive-12` on `olive-1`; state never hue-only.

## The one risk (named)
**Serif prose + lime/violet/gold + cells-as-instruments** reads as an editorial, *technical* explorable
— not an IDE, and an unusual palette for the category. Justified: the audience is authors and *readers
of explanations* who value reading quality and a legible reactive flow over IDE density; the
distinctive palette is the anti-SaaS identity we're explicitly buying. The reading-mode/edit-mode split
absorbs any tension with authoring throughput.

## Mapping to current code
Today `app.css`/`editor.css` use `system-ui` and an ad-hoc purple. Adopting this means: add
`@radix-ui/colors`; expose the four scales as CSS variables on `:root`; set prose → IBM Plex Serif,
chrome → IBM Plex Sans, code → IBM Plex Mono, title → Plex Sans; recolor `$` values/active to
gold, interactive/focus to violet, live/run to lime. A **styling pass** (no logic change), companion to
the [authoring-experience](./authoring-experience.md) work.
