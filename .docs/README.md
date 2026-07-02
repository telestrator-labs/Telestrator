# Docs

Telestrator is a **greenfield rebuild** inspired by [TypeCell](https://github.com/TypeCellOS/TypeCell)
but built from scratch on a deliberately different stack. This directory holds the plan, the product
direction, and design/reference material for that rebuild.

## Where to start

- **[greenfield-build-guide.md](./greenfield-build-guide.md)** — the source of truth: a first-principles,
  feature-ordered build path across milestones **M0 → M8**.
- **[stack-decisions.md](./stack-decisions.md)** — ADR-style record of the committed stack and the
  alternatives considered/rejected. Don't re-open a settled decision or pull in a contradicting library
  without updating this doc first.

## Product & design

- **[product/](./product/)** — the *why / for-whom / how-it-should-feel*: personas & use cases, the
  "Ink & Signal" design language, the authoring experience, and a stretch-goals backlog.
- **[design/](./design/)** — design assets and prototypes (e.g. `Knowledge Check.dc.html`, inspiration
  references).
- **[features-roadmap/](./features-roadmap/)** — scoped feature-direction prototypes (currently: Studio
  mode / Trace concepts).
- **[dark-mode-plan.md](./dark-mode-plan.md)** — the dark-mode design-phase plan.

## Other

- **[bugs/](./bugs/)** — screenshots backing open visual/layout bugs.
- **[archive/typecell/](./archive/typecell/)** — the original TypeCell onboarding guides and
  development history, kept for historical/rebuild reference. Not the current plan — see
  the build guide above for that.

## Conventions

- `.prettierignore` excludes this directory — carried-over and hand-authored docs stay verbatim, not
  reformatted.
