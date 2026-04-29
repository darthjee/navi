# Plan: Add View to Show the Logs

## Overview

Add a `/#/logs` route to the React SPA that streams application logs in real time, styled as a dark terminal window with per-level colour coding. The root `/` redirects to `/#/logs`.

## Context

The backend already exposes `GET /logs.json?last_id=<id>` (issue #425), returning a paginated array of log objects (`id`, `level`, `message`, `attributes`, `timestamp`). The frontend needs a client and a page component to consume that endpoint continuously.

## Implementation Steps

### Step 1 — Add `LogsClient`

Create `frontend/src/clients/LogsClient.js`.

- `fetchLogs({ lastId } = {})` calls `GET /logs.json` with an optional `last_id` query parameter.
- Returns the parsed JSON array of log objects.

### Step 2 — Add `LogsPage` component

Create `frontend/src/components/LogsPage.jsx`.

Polling logic (runs in a `useEffect`, cleaned up on unmount):

1. Fetch `LogsClient.fetchLogs()` (no `lastId` on the first call).
2. If the response array is **empty**: wait 1 second, then fetch again (same `lastId`).
3. If the response array is **not empty**: append entries to the displayed list, then immediately fetch again using the **newest** log's `id` as `lastId`.

Display:
- Dark/black terminal-style container (e.g. `bg-dark text-light`, monospace font).
- Each log line shows `[timestamp] [level] message`.
- Per-level colour coding:
  - `debug` → phosphor green (`#00FF41` or similar, inline style)
  - `info` → default light text
  - `warn` → yellow (`text-warning`)
  - `error` → red (`text-danger`)
- Newest entry is at the bottom; container auto-scrolls to bottom when new entries arrive.

### Step 3 — Update routing in `main.jsx`

- Import `LogsPage` and React Router's `Navigate`.
- Add route `path="logs"` → `<LogsPage />`.
- Replace the current `<Route index element={null} />` with `<Route index element={<Navigate to="/logs" replace />} />` so that `/` redirects to `/#/logs`.

## Files to Change

- `frontend/src/clients/LogsClient.js` — new file; API client for `GET /logs.json`
- `frontend/src/components/LogsPage.jsx` — new file; terminal-style log viewer with continuous polling
- `frontend/src/main.jsx` — add `logs` route and root redirect

## Notes

- The polling loop must be cancelled on component unmount to prevent memory leaks (clear timeout / set a `cancelled` flag).
- Auto-scroll should only trigger when new logs arrive, not on every render.
- Colour coding relies on Bootstrap utility classes already present in the project.
- After implementing, run `yarn build` inside the frontend container and commit the updated `source/static/` assets.
