# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A **greenfield reactive notebook** — rich-text prose interleaved with live TypeScript/React code cells that share reactive state, run sandboxed in the browser with runtime npm imports, and (eventually) sync collaboratively. It is **inspired by** [TypeCell](https://github.com/TypeCellOS/TypeCell) but built from scratch on a deliberately different stack — no carried-over technical debt.

**Status:** early. The repo is currently at **milestone M0** (scaffold + the core data model). Everything past M0 is still to be built; follow the milestone roadmap rather than inventing structure ahead of it.

> The previous TypeCell implementation and its onboarding guides live on the **`staging`** branch for reference. This `next/*` line is the greenfield rebuild.

## The plan is the source of truth

Two documents in `.docs/` drive this project — read them before making architectural decisions:

- **`.docs/greenfield-build-guide.md`** — the feature-ordered build path, milestones **M0 → M8**, each a shippable vertical slice.
- **`.docs/stack-decisions.md`** — ADR-style record of the **committed stack** and the alternatives considered/rejected.

Do not re-open settled decisions or pull in libraries that contradict the committed stack without updating these docs first.

### Committed stack (see stack-decisions.md for the why)

| Concern             | Decision                                                                                                                                |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| App framework       | **Vite + React 18 SPA** (single app + small `core` lib)                                                                                 |
| Editor              | **Tiptap-direct** + Tiptap UI Components; code cells are raw Tiptap **NodeViews** (not BlockNote)                                       |
| Execution / sandbox | **Sandpack** (`@codesandbox/sandpack-*`) for sandbox + bundle + npm + export                                                            |
| Reactivity          | a **custom injected `$` runtime** on top of Sandpack (fine-grained re-run); MobX vs `@preact/signals-core` to be settled by an M3 spike |
| Collaboration       | **Yjs** via a **managed provider** (Liveblocks / y-sweet / PartyKit) over `y-prosemirror`                                               |
| Persistence / auth  | **Supabase** (auth + DB + cascading RLS permissions)                                                                                    |

### Milestone roadmap

M0 scaffold + cell model · M1 Tiptap document with code-cell node · M2 run one cell (Sandpack) · **M3 reactive `$` context** · M4 npm imports + types · M5 persistence (Yjs + IndexedDB) · M6 real-time collaboration · M7 auth/sharing/workspaces · M8 distribution (export + cross-notebook imports).

## Commands

```bash
npm install        # install deps
npm run dev        # Vite dev server
npm run build      # tsc typecheck + vite build
npm test           # vitest (run once)
npm run test:watch # vitest watch
npm run format     # prettier --write (scoped by .prettierignore)
```

## Architecture & key files

The app is intentionally small right now:

- **`src/core/notebook.ts`** — the load-bearing data model: a `NotebookDocument` is an ordered list of typed `Cell`s (`markdown | typescript | css`), plus `createCell` / `createNotebook` / `serialize` / `deserialize`. **Every later milestone reads and writes this shape** — change it deliberately. Keep it framework-agnostic (no React/DOM imports) so it stays the shared `core`.
- **`src/App.tsx`** — the M0 demo (builds a notebook, round-trips it through JSON, renders the result). Will be replaced by the Tiptap editor in M1.
- **`src/main.tsx`** — React entry.
- **`src/core/notebook.test.ts`** — vitest round-trip test guarding the model invariant.

## Conventions

- **React 18 is a hard constraint** (Tiptap UI Components target React 18). Do not upgrade to React 19. Vite 5 is paired with it.
- **Don't pin to a Node version.** ID generation uses `globalThis.crypto?.randomUUID()` with a fallback; keep new code runtime-portable (browser / Node 18+ / edge) rather than relying on a specific host global.
- **Prettier** config is `prettier.config.cjs` (carried over). `.prettierignore` excludes `.docs/` (carried-over docs stay verbatim) and `package-lock.json` — keep formatting scoped to app code.
- **TypeScript strict** is on (`noUnusedLocals` / `noUnusedParameters`); the build typechecks before bundling, so keep it clean.

## Branching

- **`next/staging`** is the base for this greenfield line.
- Scoped feature work goes on **`next/feat/<name>`** branches off `next/staging`.
- `staging` holds the original TypeCell implementation — don't merge it into `next/*`.
