# Dark mode — design-phase plan

Status: **planning + foundation started.** This doc is the design phase for dark
mode; the only code change landed alongside it is the `--paper` fix (below).
Dark mode is **heavily facilitated by Radix Colors** — most of the work is
*not* re-styling components, it's identifying the handful of values that can't
ride the automatic Radix flip.

## How it already works (and why)

We import each Radix scale's **light _and_ dark** stylesheet, e.g.
`olive.css` + `olive-dark.css`. The dark file is scoped to `.dark` and
re-defines the same primitive custom properties:

```
.dark { --olive-1: …; --olive-12: …; }   /* from olive-dark.css */
```

Our token tiers reference those primitives by `var()` all the way down
(`--color-text → --color-gray-12 → --olive-12`), and `@theme inline` resolves
each utility to the deepest `var(--olive-…)`. So **adding `.dark` to `<html>`
flips every primitive, every tier inherits, and ~90% of the UI becomes dark with
zero component changes** — already verified in the browser: sidebar, chrome,
cells, prose text, gold `$`-markers, action/live colors all flip.

Radix designed the scales so a given **step keeps its role** across light/dark
(step 9 = solid, 11 = low-contrast text, 6 = border, …). That's why our
semantic mappings (`--color-action: accent-9`, `--color-border: gray-6`, …)
stay meaningful in dark without per-step rework.

## What does NOT flip automatically (the audit)

These are values with no Radix dark variant, or hard-coded for light. This is
the actual scope of dark mode.

### 1. Alpha overlays (no dark variant) — **highest priority**
`white-alpha` / `black-alpha` are always white / always black; they don't flip.
- **The surface inversion (`--chrome` + `--paper`)** — `--color-paper` was
  `var(--white-a12)`, so the document stayed light while everything around it
  went dark (the reported bug). **Fixed by inverting the depth order in dark**
  rather than just patching paper: two per-mode properties carry the shell and
  the document, and they swap which is darker.
  - `--chrome` (sidebar, inset gutter, trace panel): light `olive-3` → dark
    `black-a12`. In dark the shell is the *darkest* plane (near-black).
  - `--paper` (inset document card): light `white-a12` → dark `olive-2`. In dark
    the document is a *raised* gray that floats above the black shell.
  - Wiring: `--color-sidebar → var(--chrome)`; the gutter and `TracePanel` use
    `bg-sidebar`; the inset card stays `bg-paper`. Light is unchanged (chrome was
    already `surface-raised`/olive-3, paper already white-a12). This is the
    template for the remaining alpha surfaces.
  - Also set `color-scheme: light/dark` per-mode so the UA paints native chrome
    (an overflowing code cell's scrollbar was a bright bar on the dark page).
- **Inset card ring** `ring-[var(--black-a4)]` (sidebar.tsx) — a black hairline,
  invisible on a dark card. Needs `white-a` in dark (same `--card-ring` per-mode
  trick).
- Any other `*-a*` usage on a surface: the mobile scrim `bg-gray-a8` is fine
  (gray-alpha flips); `shadow-[0_0_0_3px_var(--color-brand-a5)]` (brand-alpha)
  flips. Audit for white/black specifically.

### 2. Shadows / elevation
Every elevation uses `rgb(0 0 0 / …)` (the inset card, cells, popovers, slash
menu). Black shadows vanish on dark backgrounds, so the floating surfaces lose
their lift. Dark mode wants **either** lighter/transparent-white shadows **or**
a ring-based elevation. Introduce `--shadow-elevated` / `--shadow-popover`
tokens flipped per-mode, and swap the hard-coded `shadow-[…]` arbitrary values.

### 3. CodeMirror (code cells)
The cell editor uses `defaultHighlightStyle` (a light syntax theme) plus a small
`cellTheme`. On a dark cell the syntax colors are washed out. Needs a **dark
highlight style** + cursor/selection tweak applied under `.dark` (CodeMirror is
configured in JS — gate via a `Compartment` reconfigured on theme change, or
ship both and toggle).

### 4. The sandbox iframe
The runtime executes in a separate `srcdoc` document (`src/sandbox/`). It has its
own `<html>` and styles; `.dark` on the host does **not** reach it. If/when cell
output renders visible DOM, the iframe needs the theme forwarded (postMessage the
mode, or set a class on its root) and its own minimal dark CSS.

### 5. Hard-coded colors
- **Logo** `fill="#654DC4"` (violet-10 light value) — stays that violet in dark.
  Likely fine as a brand mark, but consider `currentColor` or a violet-_dark_
  step if it clashes.
- **`text-white` / `#fff` foregrounds** on primary buttons, the active doc
  badge, `--color-sidebar-primary-foreground: #fff` — white-on-violet reads in
  both modes, so probably keep; flag for the QA pass.

### 6. Prose (`@tailwindcss/typography`)
Our `prose` `--tw-prose-*` vars already map to `--color-*` semantic tokens, which
flip — so **prose flips for free**. The `invert` block in `typography.plugin.ts`
is therefore redundant for us (it duplicates the same token mappings). Decision:
either delete `invert` and rely on the auto-flip, or keep it and wire
`dark:prose-invert`. Recommend deleting it to avoid two sources of truth.

### 7. Per-mode tuning (polish, not breakage)
A few semantic picks read slightly differently in dark and may want a `.dark`
override at the **semantic tier only**: `--color-action-subtle` (accent-4),
`--color-live`, `--color-value`/`-bg`, and border steps on the now-darker
chrome. Tune during QA; don't pre-optimize.

## The toggle + persistence (not yet built)

- A **theme control**: `system | light | dark` (a small menu, likely in the
  sidebar footer or the top bar). `system` follows `prefers-color-scheme`.
- Apply by toggling `.dark` on `document.documentElement`; persist the choice in
  `localStorage`.
- **Avoid FOUC**: an inline `<script>` in `index.html` that reads the stored
  choice (or the media query) and sets `.dark` *before first paint*, so the app
  never flashes light.
- A `prefers-color-scheme` listener to react to OS changes while in `system`.

## Token strategy (the rule)

1. **Default: let Radix flip.** Reference scales through the tiers; add nothing.
2. **Only override at the semantic tier under `.dark`** when a value genuinely
   can't be one scale step (alpha surfaces, shadows) or needs per-mode tuning.
   Never override raw scales or primitives.
3. **Per-mode primitives go in the `:root` / `.dark` block** (like `--paper`),
   referenced by a semantic token — keeps `@theme inline` clean and the flip in
   one place.

## Proposed phases

1. **Foundation (this PR + next):** `--paper` ✅; then the ring, shadow tokens,
   and delete the redundant prose `invert`. After this, dark is visually correct
   for all static surfaces.
2. **CodeMirror dark theme** + the sandbox-iframe theme forwarding.
3. **Toggle + persistence + FOUC script.**
4. **QA pass:** walk every surface and state (cells, error well, popovers, slash
   menu, share modal, dashboard cards, reading mode, Studio/wide) in dark; fix
   contrast and the hard-coded colors.

## Open decisions for review

- **Document surface in dark:** ~~`olive-1` (deepest) vs. raised~~ **Decided:**
  inverted — chrome `black-a12` (darkest), document `olive-2` (raised). See §1.
- **Default mode:** ship `system` default, or force light until dark is QA'd?
- **Elevation in dark:** soft white shadow vs. hairline ring vs. both.
