# Add the /emissions page view

A dedicated route showing a live emissions feed with a counts strip and a status filter, built from the three-file convention.

## Route

`src/main.jsx` — import `Emissions` and add `<Route path="emissions" element={<Emissions />} />` inside the `Layout` route.

## Components

- `src/components/pages/Emissions.jsx` — state (`data`, `error`, `loading`, `statusFilter`), builds an `EmissionsController`, runs its effect, delegates to `EmissionsHelper`. Same skeleton as `MemoryStatus.jsx`.
- `src/components/pages/controllers/EmissionsController.jsx` — data logic:
  - Poll `fetchEmissions({ lastId })` on a `last_id` cursor, appending new rows to a local list, mirroring `LogsPageController`'s `#poll` / `#appendEntries` loop (poll delay ~1000 ms; keep the `cancelledRef` cleanup). Seed the first fetch with no `lastId`.
  - Keep the latest `counts` from each response.
  - Optionally cap the retained row list (e.g. last 500) so an all-day session does not grow unbounded — the backend buffer is already small, so this is a safety net.
- `src/components/pages/helpers/EmissionsHelper.jsx` — pure render:
  - `renderLoading()` / `renderError(error)` via `LoadingSpinner` / `ErrorAlert`.
  - `render({ counts, rows, statusFilter, onStatusFilterChange })`:
    - A counts strip (`extracted / emitted / failed / dead`) using `card` or `badge text-bg-*` chips.
    - A status filter: `all` / `success` / `failed` / `dead` (Bootstrap `btn-group` or `form-select`), applied client-side to `rows`.
    - A `table table-striped` feed: columns **Time** (`date-fns` format of `timestamp`), **Status** (badge — `success`→success, `failed`→warning, `dead`→dark), **Method**, **Target URL** (`font-monospace`, truncate/wrap), **HTTP** (`httpStatus ?? '—'`), **Item** (`itemRef ?? '—'`), **Error** (`error ?? '—'`, `font-monospace`).
    - Newest row first (reverse the appended list for display) or oldest-first with autoscroll — pick one and keep it consistent; newest-first is simpler here and needs no scroll ref.
  - Empty state: "No emissions recorded yet." when `rows` is empty.

## Files to Change

- `src/main.jsx` — register the `/emissions` route.
- `src/components/pages/Emissions.jsx` — new.
- `src/components/pages/controllers/EmissionsController.jsx` — new.
- `src/components/pages/helpers/EmissionsHelper.jsx` — new.
- `src/components/pages/Emissions.css` — new (optional; only if table/strip needs layout rules).
