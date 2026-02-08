# TypeCell Developer Documentation

This directory contains onboarding guides for developers new to the TypeCell codebase. Each guide explains the architecture, key components, and data flow for a core package.

## Package Guides

| Package | Description | Guide |
|---------|-------------|-------|
| **engine** | Reactive code execution engine with MobX-based dependency tracking | [engine-onboarding-guide.md](./engine-onboarding-guide.md) |
| **frame** | Sandboxed iframe runtime with Monaco editor and BlockNote | [frame-onboarding-guide.md](./frame-onboarding-guide.md) |
| **editor** | Main application shell with auth, routing, and document management | [editor-onboarding-guide.md](./editor-onboarding-guide.md) |
| **server** | HocusPocus collaboration server with Supabase persistence | [server-onboarding-guide.md](./server-onboarding-guide.md) |

## Reading Order

For a complete understanding of the system, we recommend reading in this order:

1. **[engine](./engine-onboarding-guide.md)** — Start here to understand the core reactive execution model. This is the foundation that makes code cells automatically re-run when dependencies change.

2. **[frame](./frame-onboarding-guide.md)** — Next, understand how the engine runs inside a sandboxed iframe, integrated with Monaco and BlockNote for the editing experience.

3. **[editor](./editor-onboarding-guide.md)** — Then learn how the main application hosts the iframe, handles authentication, and manages document persistence.

4. **[server](./server-onboarding-guide.md)** — Finally, understand the backend that enables real-time collaboration and stores documents.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         USER'S BROWSER                                   │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                    EDITOR PACKAGE (Parent Window)                   │ │
│  │                                                                     │ │
│  │  • Authentication (Supabase)                                        │ │
│  │  • Routing (React Router)                                           │ │
│  │  • Document management (DocConnection, SyncManager)                 │ │
│  │  • Local storage (IndexedDB)                                        │ │
│  │                                                                     │ │
│  │  ┌───────────────────────────────────────────────────────────────┐ │ │
│  │  │                  FRAME PACKAGE (Iframe)                        │ │ │
│  │  │                                                                │ │ │
│  │  │  • BlockNote editor (Notion-like blocks)                       │ │ │
│  │  │  • Monaco code blocks (VS Code editor)                         │ │ │
│  │  │  • TypeScript compilation                                      │ │ │
│  │  │                                                                │ │ │
│  │  │  ┌─────────────────────────────────────────────────────────┐  │ │ │
│  │  │  │              ENGINE PACKAGE (Execution)                  │  │ │ │
│  │  │  │                                                          │  │ │ │
│  │  │  │  • Reactive execution (MobX autorun)                     │  │ │ │
│  │  │  │  • Dependency tracking between cells                     │  │ │ │
│  │  │  │  • NPM import resolution                                 │  │ │ │
│  │  │  └─────────────────────────────────────────────────────────┘  │ │ │
│  │  └───────────────────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
└────────────────────────────────────┼─────────────────────────────────────┘
                                     │
                          WebSocket + Yjs sync
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         SERVER PACKAGE                                   │
│                                                                          │
│  • HocusPocus (Yjs WebSocket sync)                                       │
│  • Supabase (PostgreSQL + Auth)                                          │
│  • Real-time collaboration                                               │
│  • Document persistence                                                  │
└─────────────────────────────────────────────────────────────────────────┘
```

## Key Concepts

### Local-First Architecture
Documents are stored locally in IndexedDB and sync with the server when online. Users can work offline, and changes merge automatically using Yjs CRDTs.

### Reactive Execution
Code cells run inside MobX's `autorun()`. When a cell reads from the shared context (`$`), MobX tracks the dependency. When that value changes, the cell automatically re-runs.

### Sandboxed Execution
User code runs in an iframe for security isolation. The parent window (editor) and iframe (frame) communicate via Penpal, with Yjs updates tunneled through y-penpal.

### Row Level Security
Database access control is enforced in PostgreSQL using RLS policies. The server trusts the database to determine who can read/write each document.
