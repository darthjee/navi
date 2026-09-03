# Issue: Memory history: frontend client + polling controller

## Description

Part of #761 (temporal memory-usage graph on `/#/memory/status`).

`GET /memory/history.json` (separate sub-issue) serves a paginated, oldest-first JSON
array of `{ id, value, percentage, timestamp }` (timestamp = ISO string), capped at a
configurable page size, with a `?last_id=<id>` cursor that returns only entries newer
than `<id>` — the same shape as `/logs.json` and `/emissions.json`.

This sub-issue adds the frontend data layer that polls it and accumulates points, so
the chart sub-issue only has to render. The repo does NOT use `@tanstack/react-query`;
all polling is hand-rolled `setTimeout` recursion in plain controller classes, and three
slightly different controller shapes already coexist in `frontend/src/components/`:

- `pages/controllers/EmissionsController.jsx` — imports its fetch fn directly (no DI),
  constructor `(setData, setError, setLoading)`, private accumulator field + `MAX_ROWS`
  cap, `#handleResponse`/`#handleError`/`#emit` split.
- `elements/controllers/LogsController.jsx` — injects the fetch fn via the constructor
  `(logs, fetchLogs)`, no accumulator field (state lives in the caller's `logs` array).
- `pages/controllers/LogsPageController.jsx` — no injection, single accumulated array.

`MemoryChartController` should combine the two relevant traits: fetch-fn injection
(`LogsController`'s constructor style) with `EmissionsController`'s private accumulator
field, capping, and `setData`/`setError`/`setLoading` split — since the chart needs an
instance-held points buffer, not caller-held state.

## Solution

- `frontend/src/clients/MemoryHistoryClient.js` — copy the exact pattern of
  `frontend/src/clients/EmissionsClient.js` / `LogsClient.js`:
  `fetchMemoryHistory({ lastId } = {})` builds `/memory/history.json` or
  `/memory/history.json?last_id=${encodeURIComponent(lastId)}`, `fetch`, throw
  `new Error(\`HTTP ${res.status}\`)` on `!res.ok`, return `res.json()`.
  Default-export the function.

- `frontend/src/components/elements/controllers/MemoryChartController.jsx` — a class
  combining `LogsController`'s fetch-fn injection with `EmissionsController`'s
  accumulator/capping/emit split:
  - Constructor `(fetchMemoryHistory, setData, setError, setLoading)`; private fields
    `#fetchMemoryHistory`, `#setData`, `#setError`, `#setLoading`, `#points` (`= []`).
  - Static `build(fetchMemoryHistory, setData, setError, setLoading)` factory.
  - `buildPollingEffect(cancelledRef, lastIdRef)` returns the effect thunk: resets
    `cancelledRef.current = false`, kicks `#poll`, returns a cleanup that flips
    `cancelledRef.current = true`.
  - `#poll(cancelledRef, lastIdRef)`: bail if cancelled; call
    `this.#fetchMemoryHistory({ lastId: lastIdRef.current })`, `.then` →
    `#handleResponse`, `.catch` → `#handleError`.
  - `#handleResponse(entries, cancelledRef, lastIdRef)`: bail if cancelled;
    `setLoading(false)`, `setError(null)`; on non-empty `entries`, advance
    `lastIdRef.current` to the last entry's `id`, append and cap
    `this.#points = [...this.#points, ...entries].slice(-MAX_POINTS)`
    (`MAX_POINTS = 200`), `#emit()` (`setData(this.#points)`), then re-poll
    immediately; on empty, `setTimeout(#poll, POLL_DELAY_MS)` (`POLL_DELAY_MS = 1000`).
  - `#handleError(err, cancelledRef, lastIdRef)`: bail if cancelled; `setLoading(false)`,
    `setError(err.message)`, retry after `POLL_DELAY_MS` if not cancelled.

- Spec: `frontend/spec/components/controllers/MemoryChartController_spec.js`, copying
  `frontend/spec/components/Emissions_spec.js` /
  `frontend/spec/components/controllers/LogsController_spec.js` — stubbed `fetch`
  (`mockFetchSuccess` / `mockFetchFailure` from `spec/support/fetch.js`), real timers
  with `flushAsync = () => act(async () => new Promise(r => setTimeout(r, 0)))`
  (no `jasmine.clock`). Cover: first load populates points; `?last_id=` advances the
  cursor and appends; the cap holds; errors surface and recover.

### Acceptance criteria

- [ ] `MemoryHistoryClient.fetchMemoryHistory({ lastId })` matches the `LogsClient` /
      `EmissionsClient` shape (URL building, error throw, JSON return).
- [ ] `MemoryChartController` injects `fetchMemoryHistory` via its constructor (matching
      `LogsController`'s DI style), polls `/memory/history.json`, advances the
      `?last_id=` cursor, accumulates points on a private instance field, caps at
      `MAX_POINTS`, and pushes via the injected `setData`.
- [ ] Empty responses back off ~1s (`POLL_DELAY_MS`); errors surface via `setError` and
      recover.
- [ ] Cleanup stops polling (cancelled flag); no leaked timers.
- [ ] Spec covers first load, incremental append, cap, and error recovery.

### Out of scope

- Rendering the chart / any `recharts` usage (separate sub-issue).
- Touching `MemoryStatus.jsx` or its existing `/memory/status.json` polling.

### Dependencies

Depends on the `/memory/history.json` endpoint sub-issue (response shape). The chart +
page-integration sub-issue depends on this one.
