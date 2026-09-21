# Issue: Reduce Codacy duplication in Logs component specs

## Description
Codacy reports 18% code duplication for the repository (the project goal is 10%). This issue tackles the Logs page/component specs, which repeat render and state scaffolding.

Figures below come from Codacy's analysis of `main` at `f25bf98`.

## Problem
| File | Lines | Clones | Duplicated lines |
| --- | ---: | ---: | ---: |
| `frontend/spec/components/LogsPage_spec.js` | 126 | 21 | 222 |
| `frontend/spec/components/Logs_spec.js` | 116 | 17 | 193 |
| `frontend/spec/components/LogsPageView_spec.js` | 94 | 15 | 135 |
| `frontend/spec/components/LogsPanel_spec.js` | 69 | 8 | 100 |

- Together these four specs have 61 clones
- `Logs_spec.js` and `LogsPage_spec.js` are almost identical: the same four log fixtures and the same scenarios (initial render, entries returned, empty response, fetch failure) and per-level checks (`text-warning`, `text-danger`, `text-debug`); they differ only in the data source (a `fetchLogs` spy vs. a `globalThis.fetch` stub)
- `LogsPanel_spec.js` repeats the terminal-container and per-level class checks with a near-identical fixture (different message literals) and does not use the shared `useContainer` helper
- `LogsPageView_spec.js` actually tests `LogsPageController` (the polling and scroll effects) and renders nothing, so it has no state assertions in common with the others; its clones come from the repeated `entries` fixture, the "first call resolves, later calls stay pending" fetch stub, and the `cancelledRef`/`lastIdRef`/`setLogs` setup repeated in every `buildPollingEffect` example
- `flushAsync` is redefined locally in three of the specs even though `frontend/spec/support/async.js` already exports it, and the "non-empty `.bg-dark > div` rows" filter is copied six times

## Expected Behavior
Codacy reports markedly fewer duplication clones for the files above, and behaviour is unchanged (the affected specs still pass and still verify the same scenarios).

## Solution
- Follow the pattern introduced by the previous Codacy duplication issues (e.g. `itBehavesLikeFetchStates` in `frontend/spec/support/fetch_states.js`): add a new module in `frontend/spec/support/` (e.g. `logs.js`) exporting the shared log fixtures and an `itBehavesLike...`-style function that registers the scenarios common to `Logs`, `LogsPage` and `LogsPanel` (terminal container, entries rendered with message/timestamp/level and per-level classes, empty response, failed fetch). Each spec calls it with its own render function and data source
- Unify the fixtures: `LogsPanel_spec.js` switches to the shared entries (its literals change, its assertions do not); panel-only assertions (the sentinel row count, the `[timestamp]` format) and the page/component-specific polling assertions (`last_id` in the URL vs. `{ lastId }` argument) stay in their own specs
- Add a small helper for the "visible log rows" query, and use `useContainer`/`renderInAct` from `frontend/spec/support/dom.js` and `flushAsync` from `frontend/spec/support/async.js` instead of the local copies
- In `LogsPageView_spec.js`, extract the shared `entries` fixture, the fetch stub and the polling-effect setup (refs, `setLogs` spy, cleanup) into helpers; keep the file name (it tests `LogsPageController`; renaming it is out of scope for this issue)
- Do not add helpers to `frontend/spec/support/fetch.js`: it is shipped verbatim in the `navi-hey-test` image and must not import from `frontend/src`; new helpers go in new files, like `fetch_states.js` does
- Keep every existing assertion and scenario: the refactor must not reduce what the specs verify or change any production code
- Prefer readability over maximal de-duplication; do not introduce abstractions that make a failing spec harder to read

## Benefits
- Lowers the repository duplication percentage reported by Codacy
- Makes the affected files shorter and easier to extend, so new scenarios need one line instead of a copied block
