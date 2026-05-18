# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server at http://localhost:3000 (Next.js 16 + Turbopack)
npm run build    # Production build
npm run start    # Run production build
```

No test suite is configured. Type-check with:

```bash
npx tsc --noEmit
```

## Architecture

**Monolithic Next.js 16 App Router** with a SQLite database. No external services. Requires **React 19** — Next.js 16 dropped React 18 support and the async Server Component types don't exist in `@types/react@18`.

### Database

`@libsql/client` is used instead of `better-sqlite3` because Windows lacks the Visual Studio C++ compiler required for native Node.js addons. `@libsql/client` ships prebuilt Rust binaries for all platforms.

- DB file lives at `./data/kanban.db` (created on first run)
- Schema is initialized in `src/lib/db.ts` via `client.executeMultiple()` on module load
- All DB access goes through `getDb()` which awaits the init promise before returning the client
- API is fully async — use `await db.execute({ sql, args })` everywhere

**Critical**: `@libsql/client` returns every SQLite integer column as JavaScript `bigint`. `bigint` cannot cross the React Server→Client serialization boundary and will throw at the `return <ClientComponent />` line. Always convert rows through the helpers in `src/lib/rows.ts` (`toProject`, `toStage`, `toCard`, `toComment`) before passing data to client components or returning from API routes. Never use `as unknown as T[]` casts on raw rows.

### Data model

```
projects → stages → cards
                    cards → comments
```

All foreign keys cascade on delete. Cards track `stage_id`, `project_id`, and `position` (integer order within a stage).

### Request flow

- **Server components** (`src/app/page.tsx`, `src/app/projects/[id]/page.tsx`) call `getDb()` directly to seed initial props, then render client components.
- **Client components** call the REST API routes (`/api/*`) for all mutations and subsequent fetches.
- **Next.js 16 note**: `params` in both page components and API route handlers is a `Promise` — always `await params` before destructuring.

### Key components

- `KanbanBoard` — the entire board view. Owns all board state (stages, cardMap keyed by stageId, modal state). Uses `@hello-pangea/dnd` (`DragDropContext` / `Droppable` / `Draggable`) for drag-and-drop; `onDragEnd` optimistically updates `cardMap` then PATCHes `/api/cards/[id]`.
- `CardModal` — full-screen overlay for a card. Fetches comments on mount. Saves title/description on blur. Deletes via `/api/cards/[id]`.
- `ProjectsView` — projects grid on the home page. Handles create/delete project modals client-side.
- `ThemeProvider` — sets/reads `localStorage('theme')` and toggles the `dark` class on `<html>`. Default theme is `dark`.

### Theming

Tailwind `darkMode: 'class'` strategy. CSS custom properties defined in `globals.css` under `:root` (light) and `.dark` (dark). Custom Tailwind color aliases (`k-navy`, `k-gold`, `k-black`, etc.) map to the Black & Gold Elegance palette: `#0a0a0a`, `#0d1b35`, `#f5a623`, `#e8e8e8`, `#f5f5f5`.

### Project colors

New projects are assigned a color by cycling through 8 dark palette colors based on `COUNT(*) % 8`. The color is stored on the `projects` row and used as the colored header strip on project cards.
