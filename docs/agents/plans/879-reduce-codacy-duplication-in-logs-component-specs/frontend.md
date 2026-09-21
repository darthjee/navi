# Frontend Plan: Reduce Codacy duplication in Logs component specs

Main plan: [plan.md](plan.md)

## Overview
Codacy reports 61 clones across `LogsPage_spec.js`, `Logs_spec.js`, `LogsPageView_spec.js` and `LogsPanel_spec.js`. Following the pattern used by the previous Codacy issues (`itBehavesLikeFetchStates` in `frontend/spec/support/fetch_states.js`), a new support module holds the shared log fixtures and an `itBehavesLike...` function registering the scenarios common to `Logs`, `LogsPage` and `LogsPanel`. Each spec calls it with its own render function and data source, and keeps its own specific assertions.

## Context
- `Logs_spec.js` and `LogsPage_spec.js` are almost identical (same four fixtures, same scenarios, same per-level class checks); they differ only in the data source: a `fetchLogs` spy (`Logs`) vs. a `globalThis.fetch` stub (`LogsPage`, which renders `<Logs fetchLogs={fetchLogs} />` with the real `LogsClient`).
- `LogsPanel_spec.js` renders `LogsPanel` directly with `{ logs, bottomRef }`, uses a near-identical fixture with different message literals, and does not use `useContainer`.
- `LogsPageView_spec.js` tests `LogsPageController` (`build`, `buildPollingEffect`, `buildScrollEffect`) — no rendering, so nothing to share with the other three besides fixtures and setup boilerplate. Keep its file name (renaming is out of scope).
- `flushAsync` is redefined locally in `Logs_spec.js`, `LogsPage_spec.js` (act-wrapped) and `LogsPageView_spec.js` (plain promise); `support/async.js` already exports the act-wrapped one. `renderInAct` and `useContainer` already exist in `support/dom.js`.
- `support/fetch.js` is shipped verbatim in the `navi-hey-test` image and must not import from `frontend/src` — do not add helpers there; use new files like `fetch_states.js` does. `support/fixtures/` holds files loaded by URL (dynamic-import fixtures), not shared data — do not put log fixtures there.

## Steps

- [01 — Add the shared logs support module](frontend/01-add-logs-support-module.md)
- [02 — Refactor Logs and LogsPage specs](frontend/02-refactor-logs-and-logs-page-specs.md)
- [03 — Refactor LogsPanel spec](frontend/03-refactor-logs-panel-spec.md)
- [04 — Refactor LogsPageView spec](frontend/04-refactor-logs-page-view-spec.md)

## CI Checks
- `frontend`: `yarn coverage` (CI job: `jasmine-frontend`)
- `frontend`: `yarn lint` (CI job: `checks-frontend`)

Run inside the `navi_frontend` container: `docker compose run --rm navi_frontend bash -c "yarn coverage && yarn lint"`.

## Notes
- Every existing assertion and scenario must be kept; adding an assertion to a spec because a shared example now covers it there too (e.g. "does not apply text-debug to info entries", currently only in `LogsPage_spec.js`) is acceptable, dropping one is not.
- Panel-only assertions (sentinel row count `logs.length + 1`, `[timestamp]` bracket format) and source-specific polling assertions (`last_id=4` in the fetch URL for `LogsPage` vs. `{ lastId: 4 }` argument for `Logs`) stay in their own specs.
- `LogsPanel_spec.js` switches to the shared fixture, so its message literals change (e.g. `'Started'` → `'Server started'`); its assertions must be adapted accordingly, not weakened.
- Prefer readability over maximal de-duplication; a failing shared example must still name the scenario clearly. Compare the Codacy duplication for the four files afterwards (via the PR analysis) to confirm the clone count dropped.
- Never touch production code under `frontend/src/`.
