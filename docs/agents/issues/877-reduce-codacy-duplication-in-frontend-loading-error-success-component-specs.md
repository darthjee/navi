# Issue: Reduce Codacy duplication in frontend loading/error/success component specs

## Description
Codacy reports 18% code duplication for the repository (the project goal is 10%). This issue tackles the frontend component specs that fetch data and repeat the same loading, error and success state scaffolding.

Figures below come from Codacy's analysis of `main` at `f25bf98`.

## Problem
| File | Lines | Clones | Duplicated lines |
| --- | ---: | ---: | ---: |
| `frontend/spec/components/Emissions_spec.js` | 114 | 8 | 65 |
| `frontend/spec/components/Extractions_spec.js` | 120 | 9 | 65 |
| `frontend/spec/components/Job_spec.js` | 135 | 17 | 153 |
| `frontend/spec/components/Jobs_spec.js` | 136 | 13 | 110 |
| `frontend/spec/components/StatsHeader_spec.js` | 108 | 14 | 137 |

- The same `while loading` (spinner + loading text) and error blocks appear in all five specs, e.g. Emissions:46-52, Extractions:49-55, Job:33-39, Jobs:24-30, StatsHeader:17-23. They differ only in the component/render call, the loading text ("Loading emissions", "Loading extractions", "Loading job", "Loading jobs", "Loading stats"), and the error status/text
- The pending-fetch stub (`returnValue(new Promise(noop))`) is repeated in every `while loading` block
- The error block is not uniform: Job, Jobs and StatsHeader use four `it`s (no spinner, `.alert-danger`, "Failed to load X", "HTTP N"), while Emissions and Extractions use a single `it` that skips the "no spinner" check. Job and Jobs also stub the failed fetch inline (`Promise.resolve({ ok: false, status })`), which is exactly what `mockFetchFailure` already does
- The same imports and the `render` boilerplate (`act` + `root.render(createElement(MemoryRouter, ...))`) are repeated in all five specs
- `const flushAsync = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });` is redefined locally in 17 frontend spec files (all five above, plus e.g. `EngineControls_spec.js`, `LogsPage_spec.js`, `MenuMenu_spec.js`). Four other specs (`LogsPageView_spec.js` and the Emissions/Extractions/Logs controller specs) define a variant without `act`, which is not interchangeable
- The success blocks rely on spec-specific fetch mocks (`mockCursorFeed`, `mockPair`, `mockJobFetch`, a URL-based fake in Jobs), so they are too specific to share
- `MemoryStatus_spec.js` shares the same blocks but is covered by #878. Other frontend spec files are covered by #879–#885

## Expected Behavior
Codacy reports markedly fewer duplication clones for the five files above, and behaviour is unchanged: the affected specs still pass and still verify the same scenarios (Emissions and Extractions may gain one extra "no spinner" assertion in their error state, see Solution).

## Solution
Add new shared helpers under `frontend/spec/support/` (which already hosts `dom.js` with `useContainer` and `fetch.js` with `mockFetchSuccess`/`mockFetchFailure`):

- **`support/async.js`** (new): exports `flushAsync` (the `act`-wrapped form)
- **`support/fetch.js`** (extended): add `mockFetchPending()`, the never-resolving fetch used by every `while loading` block
- **`support/fetch_states.js`** (new): a shared example, e.g. `itBehavesLikeFetchStates({ render, loadingText, errorText, status })`, called at describe level following the same convention as `useContainer`/`mockFetchSuccess`. It covers the `while loading` block (via `mockFetchPending`) and the error block (via `mockFetchFailure(status)`, using the four-`it` form: no spinner, `.alert-danger`, "Failed to load X", "HTTP N")

Then, in the **five target specs only** (Emissions, Extractions, Job, Jobs, StatsHeader):
- Replace the local `flushAsync` with the shared import
- Replace the `while loading` and error blocks with the shared example. Job and Jobs therefore also stop stubbing the failed fetch inline and use `mockFetchFailure` instead
- Keep each spec's own `render` closure and success-state mocks

Notes and constraints:
- `mockFetchFailure` registers its stub in a `beforeEach`, so the shared example must be called at describe level, with rendering happening in the `it` (or a later `beforeEach`), so the stub is in place before the component renders
- Emissions and Extractions gain the "no spinner" assertion in their error state as a side effect of using the shared four-`it` form; this only adds coverage and is accepted
- Keep every other existing assertion and scenario, including spec-specific ones (Job's 404 "not found" block, the empty-state blocks, Jobs' route-param block); do not change any production code
- Out of scope: adopting the shared `flushAsync` in other spec files (left to #878–#884 to avoid merge conflicts), the 4 non-`act` `flushAsync` variants, and the success-state mocks
- Prefer readability over maximal de-duplication; do not introduce abstractions that make a failing spec harder to read

## Benefits
- Lowers the repository duplication percentage reported by Codacy
- Makes the affected files shorter and easier to extend, so new scenarios need one line instead of a copied block
- Provides shared `flushAsync`, `mockFetchPending` and fetch-states helpers that the follow-up frontend spec issues can adopt
