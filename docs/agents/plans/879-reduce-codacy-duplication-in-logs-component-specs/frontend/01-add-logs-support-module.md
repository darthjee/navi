# Add the shared logs support module
Create `frontend/spec/support/logs.js`, exporting:

- `logEntries` — the shared four-entry fixture (`info` "Server started", `warn` "High memory usage", `error` "Connection refused", `debug` "Cache hit", ids 1–4, timestamps `2024-01-01T00:00:00Z`…`00:00:03Z`). Export it frozen/cloned-safe so specs cannot mutate it across examples.
- `visibleLogRows(container)` — returns the `.bg-dark > div` elements whose `textContent.trim() !== ''` (replaces the filter currently copied six times).
- `itBehavesLikeLogsTerminal({ state, ... })` (name may be adjusted) — registers, at describe level, the scenarios common to `Logs`, `LogsPage` and `LogsPanel`, mirroring the style of `itBehavesLikeFetchStates` in `support/fetch_states.js`:
  - terminal container rendered (`.bg-dark`, `.bg-dark.text-light`) and no visible rows (the "initial render" / empty scenarios);
  - entries rendered: message, timestamp and `[level]` label for each entry, and the `text-warning` / `text-danger` / `text-debug` classes;
  - the "does not apply text-debug to info entries" check.
  Take whatever callbacks are needed to adapt to each data source (e.g. a `render` function per scenario, or a small `sources` object with `pending`, `entries`, `empty`, `failure` setup functions), so `Logs` (spy), `LogsPage` (`globalThis.fetch` stub) and `LogsPanel` (props) can all call it. Keep the polling-call-count assertions parameterised (a `callCount` accessor) if they can be shared cleanly; otherwise leave them in the specs.

Reuse `flushAsync` from `./async.js`, and `mockFetchSuccess` / `mockFetchFailure` from `./fetch.js` where they fit. If a "first call resolves, later calls stay pending" fetch stub is shared with step 04, define it here (or in a sibling file such as `support/fetch_logs.js`) — importing `noop` from `frontend/src` is fine here, but never add it to `support/fetch.js`.

Add a short header comment explaining what the module is for, in the style of `fetch_states.js`.

## Files to Change
- `frontend/spec/support/logs.js` — new module with the fixtures, `visibleLogRows` and the shared-example function
