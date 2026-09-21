# Refactor Logs and LogsPage specs
Rewrite `frontend/spec/components/Logs_spec.js` and `frontend/spec/components/LogsPage_spec.js` to use the new support module:

- remove the local `flushAsync` and `render` scaffolding in favour of `flushAsync` from `support/async.js` and `renderInAct` from `support/dom.js`;
- replace the local four-entry `logs` array with `logEntries`;
- call the shared-example function for the terminal / entries / empty / failed-fetch scenarios, passing each spec's own data source (`fetchLogs` spy for `Logs`; `globalThis.fetch` stub via the real `LogsPage` for `LogsPage`);
- keep the source-specific assertions locally: `fetchLogs.calls.argsFor(1)[0]` equals `{ lastId: 4 }` in `Logs`, and the second fetch URL contains `last_id=4` in `LogsPage`; keep "polls again immediately" / "does not poll again immediately" either shared or local, but present in both;
- use `visibleLogRows` instead of the inline `.bg-dark > div` filter.

Confirm the list of `it` descriptions before/after (`yarn spec`) so no scenario is lost.

## Files to Change
- `frontend/spec/components/Logs_spec.js` — use shared fixtures/examples and support helpers
- `frontend/spec/components/LogsPage_spec.js` — use shared fixtures/examples and support helpers
