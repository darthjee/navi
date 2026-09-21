# Refactor LogsPageView spec
`frontend/spec/components/LogsPageView_spec.js` actually tests `LogsPageController`; keep the file name. Reduce its internal duplication:

- replace the local `flushAsync` with the one from `support/async.js` only if that does not change timing semantics (the local one is not act-wrapped and the controller is exercised outside React); otherwise keep a single local definition;
- extract the repeated `entries` fixture (`{ id: 10, level: 'info', message: 'Hello', ... }`) and the "first call resolves with entries, later calls stay pending" `fetch` stub (also used in `LogsPage_spec.js`) into shared helpers;
- extract the repeated `cancelledRef` / `lastIdRef` / `setLogs` spy / `LogsPageController.build([])` / `buildPollingEffect(...)()` setup used in the three `#buildPollingEffect` examples into a local (or support) helper returning `{ cancelledRef, lastIdRef, setLogs, cleanup }`;
- extract the `bottomRef` + `scrollIntoView` spy setup shared by the two `#buildScrollEffect` examples;
- keep every existing example (`.build`, polling with entries / empty response / cleanup, scroll with and without logs).

## Files to Change
- `frontend/spec/components/LogsPageView_spec.js` — extract fixture, fetch stub and polling/scroll setup helpers
- `frontend/spec/support/logs.js` — (if shared with step 01) host the shared "first call resolves" fetch stub
