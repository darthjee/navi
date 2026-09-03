# Frontend Plan: Memory history: frontend client + polling controller

Main plan: [plan.md](plan.md)

## Context

`GET /memory/history.json` (separate sub-issue) serves a paginated, oldest-first JSON
array of `{ id, value, percentage, timestamp }`, with a `?last_id=<id>` cursor —
the same shape as `/logs.json` and `/emissions.json`. This repo hand-rolls polling
via `setTimeout` recursion in plain controller classes (no `react-query`), and three
slightly different controller shapes already coexist:

- `frontend/src/components/pages/controllers/EmissionsController.jsx` — imports its
  fetch fn directly (no DI), constructor `(setData, setError, setLoading)`, private
  accumulator field + `MAX_ROWS` cap, `#handleResponse`/`#handleError`/`#emit` split.
- `frontend/src/components/elements/controllers/LogsController.jsx` — injects the
  fetch fn via the constructor `(logs, fetchLogs)`, no accumulator field of its own.
- `frontend/src/components/pages/controllers/LogsPageController.jsx` — no injection,
  single accumulated array.

`MemoryChartController` combines fetch-fn injection (`LogsController`'s constructor
style) with `EmissionsController`'s private accumulator field, capping, and
`setData`/`setError`/`setLoading` split.

## Steps

- [01 — Add MemoryHistoryClient](frontend/01-add-memory-history-client.md)
- [02 — Add MemoryChartController](frontend/02-add-memory-chart-controller.md)
- [03 — Add MemoryChartController spec](frontend/03-add-memory-chart-controller-spec.md)

## CI Checks

- `frontend`: `yarn lint` (CI job: `checks-frontend`)
- `frontend`: `yarn coverage` (CI job: `jasmine-frontend`)

## Notes

- `MAX_POINTS = 200` and `POLL_DELAY_MS = 1000` are new constants local to
  `MemoryChartController` — not shared with `EmissionsController`'s `MAX_ROWS = 500`.
- Out of scope: rendering the chart (`recharts`) and any changes to
  `MemoryStatus.jsx` or its existing `/memory/status.json` polling — separate
  sub-issue.
- Depends on the `/memory/history.json` endpoint sub-issue for the response shape;
  this plan assumes that shape is `{ id, value, percentage, timestamp }[]`.
