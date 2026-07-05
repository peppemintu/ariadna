# Ariadna — frontend

React + TypeScript + Radix UI client for the Ariadna Kanban backend.
Neo-brutalist design system ported 1:1 from the Ariadna token set.

## Run

```bash
npm install
npm run dev        # http://localhost:5173, proxies /api and /ws to :8080
```

Backend expected on `http://localhost:8080`. For a different host, set
`VITE_API_BASE` (REST) and `VITE_WS_URL` (STOMP) — and enable CORS on the backend.

## Flow

`/login` (pick a user — no auth yet) → `/boards` (choose a board) → `/board/:id`
(the board). The picked user is kept in `sessionStorage` and restored on reload.

## Layout

```
src/
  api/        types.ts (DTO mirror) · http.ts (fetch + 409 handling) · endpoints.ts
  hooks/      queries.ts (TanStack Query read hooks)
  lib/        stomp.ts · queryClient.ts · currentUser.tsx · format.ts
  ui/         design-system kit over Radix (Button, Dialog, Select, Toast, …)
  features/
    auth/     LoginPage · RequireUser (route guard + session restore)
    board/    BoardsPage · BoardView · BoardHeader · Column · TaskCard
  App.tsx     router
```

## Backend notes / assumptions

- Frontend expects `GET /api/board/{id}/full` (aggregate: board + members + columns
  with nested cards, all sorted by `position`). **Must be added on the backend** —
  the board screen calls it. Column/card order is taken as-is from the server.
- No auth endpoint yet → "current user" is a client-side picker.
- Card fields are strictly what the API returns (no priority/labels/checklist).
- Optimistic locking: card `version` is sent on move; a 409 shows a toast and the
  board refetches to resolve the conflict.
- Drag-and-drop (cards) is optimistic: local state moves the card immediately, then
  `PATCH /position` commits `{targetColumnId, prevCardId, nextCardId, version}` and the
  backend derives the fractional position. Create-card is inline per column.
- Column reordering is not supported by the API; only cards will drag-and-drop.

## Managing boards, columns & members

- **Boards** — create from the Boards page, rename/delete from the ⋯ menu on a board.
- **Columns** — add via the tail composer (title + accent color), edit/delete via the ✎ button on a column header. No optimistic lock (the backend's column update DTO has no version).
- **Members** — the avatar stack in the board header opens a dialog to add users (from the global list) or remove them. Members drive the assignee picker.
- **Users** — create a user on the login screen (auto signs you in); rename yourself from the Boards header.

**Not broadcast over WebSocket:** board create/rename/delete, and member add/remove. The backend only emits `COLUMN_*` and `CARD_*` events, so other clients pick these changes up on their next refetch, not live.

**Backend endpoint still required:** removing a member calls `DELETE /api/boardUser/board/{boardId}/user/{userId}`, which does not exist yet — the current `DELETE /api/boardUser/{id}` needs a link id that no endpoint exposes. Add the pair-delete route or the remove button will 404.

## Views

Three tabs on a board: **Board** (kanban with drag-and-drop), **List** (compact
grouped overview, click a row to edit), **Activity** (live feed of board events).
Activity is fetched only while its tab is open.

## Realtime

The board subscribes to `/topic/board/{id}` over STOMP (`useBoardRealtime`). Any
event invalidates the board aggregate (and activity), so TanStack Query refetches
truth — we don't hand-patch the cache per event type. The header shows a Live /
Offline indicator driven by the socket connection. Subscriptions survive reconnects.

## Prod build note

This is an SPA with client-side routing. In dev, Vite serves `index.html` for any
path automatically. In production, configure your static host to fall back to
`index.html` for unknown paths (otherwise deep links like `/board/:id` 404 on reload).
