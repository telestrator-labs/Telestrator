# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TypeCell is an open-source Notion-style workspace that combines collaborative document editing with live code execution. It's a monorepo using npm workspaces containing 9 packages.

**Key Technologies:** React 18, Vite, TypeScript, Yjs (CRDT), MobX, Monaco Editor, HocusPocus, Supabase, BlockNote

## Common Commands

```bash
# Setup
npm install
npm run build

# Development (run all three for full local environment)
npm run start:supabase    # Start Supabase Docker containers
npm run start:server      # Start HocusPocus server
npm start                 # Start React dev server (http://localhost:5173)

# Stop Supabase
npm run stop:supabase

# Testing
npm test                      # Run all tests (vitest + playwright)
npm run unittest:vitest       # Run vitest unit tests only
npm run playwright:dev        # Run Playwright tests in UI mode
npm run playwright:preview    # Run Playwright tests against preview build

# Building
npm run build             # Build all packages
npm run build:react       # Build React editor with optimizations

# Code Quality
npm run lint              # Run ESLint on all packages

# Database (from packages/server)
npm run gentypes          # Generate Supabase TypeScript types
npm run migrate           # Create new database migration
npm run diff              # Show database diff
```

## Architecture

### Packages (`/packages/`)

- **editor** - Main React application (Vite dev server, Atlaskit UI, Supabase Auth)
- **engine** - Reactive Runtime for live code execution with MobX-based dependency tracking
- **frame** - Sandboxed iframe where user code executes (Monaco Editor, Penpal for iframe communication)
- **server** - HocusPocus WebSocket server + Supabase backend for document persistence
- **shared** - Common TypeScript types and shared ESLint config (`.eslintrc.cjs`)
- **shared-test** - Test utilities and mocks
- **util** - Generic helper functions (UUID, nanoid, React hooks)
- **parsers** - Document format converters (TypeCell ⟷ Markdown)
- **y-penpal** - Custom Yjs provider for cross-frame communication via PostMessage

### Key Architectural Patterns

1. **Local-First Collaboration**: Yjs CRDT syncs documents between clients via HocusPocus WebSocket server. y-penpal handles Yjs transport between parent window and sandboxed iframes.

2. **Reactive Code Execution**: The engine package tracks dependencies between code cells using MobX. Cells automatically re-evaluate when dependencies change. Cells communicate through an observable context (`$`).

3. **Sandboxed Execution**: User code runs in an iframe (frame package) isolated from the main editor. Penpal handles parent ⟷ iframe communication.

4. **Dynamic NPM Imports**: Code blocks can import NPM packages at runtime via CDNs (ESM.sh, JSPM, Skypack).

### Key Entry Points

- `/packages/editor/src/index.tsx` - React app entry
- `/packages/editor/src/app/main/` - Main editor UI components
- `/packages/engine/src/ReactiveEngine.ts` - Core execution engine
- `/packages/frame/src/Frame.tsx` - Iframe runtime component
- `/packages/server/src/index.ts` - HocusPocus server entry
- `/packages/shared/src/schema.ts` - Auto-generated Supabase types
