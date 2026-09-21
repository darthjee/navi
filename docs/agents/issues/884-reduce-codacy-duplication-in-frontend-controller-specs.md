# Issue: Reduce Codacy duplication in frontend controller specs

## Description
Codacy reports 18% code duplication for the repository (the project goal is 10%). This issue tackles the frontend controller specs, which share the same hook-under-test scaffolding.

Figures below come from Codacy's analysis of `main` at `f25bf98`.

## Problem
| File | Lines | Clones | Duplicated lines |
| --- | ---: | ---: | ---: |
| `frontend/spec/components/controllers/LogsController_spec.js` | 101 | 15 | 134 |
| `frontend/spec/components/controllers/EmissionsController_spec.js` | 131 | 12 | 132 |
| `frontend/spec/components/controllers/ExtractionsController_spec.js` | 126 | 5 | 45 |
| `frontend/spec/components/controllers/MemoryChartController_spec.js` | 163 | 8 | 91 |

- The controller specs (40 clones across the four files) repeat the same scaffolding, but the four controllers are not all the same shape:
  - **`EmissionsController` and `MemoryChartController`** are near-identical polling controllers (`setData`/`setError`/`setLoading`, `cancelledRef`/`lastIdRef`). `mockResponses`, `flushMany`, the spy setup and the `#buildPollingEffect` scenarios are copied almost verbatim: first poll returns entries (stops loading, clears error, advances the cursor, polls again), subsequent polls append rows, fetch failure reports the error, cleanup cancels the loop. They differ only in payload shape (`{ counts, emissions }` vs a bare array) and fetched URL.
  - **`LogsController`** takes an injected `fetchLogs` and a `setLogs` callback, with no error/loading state. It only shares the first-poll, empty-response and cleanup scenarios.
  - **`ExtractionsController`** is not a polling controller: it uses `buildEffect` with a refresh interval. It only shares the spy setup, `flushAsync` and the "feed fails" block.
- `flushAsync` is redefined locally in all four specs (a plain version in Emissions/Logs/Extractions, an `act`-wrapped one in MemoryChart) although `frontend/spec/support/async.js` already exports the `act`-wrapped one

## Expected Behavior
Codacy reports markedly fewer duplication clones for the files above, and behaviour is unchanged (the affected specs still pass and still verify the same scenarios).

## Solution
- Extract a shared helper for building a polling effect with stubbed fetch results (`mockResponses`, `flushMany`, spy/ref setup), placed in `frontend/spec/support/` next to the existing helpers (`dom.js` with `useContainer`, `fetch.js` with `mockFetchSuccess`/`mockFetchFailure`, `async.js` with `flushAsync`)
- **Emissions + MemoryChart:** share the common polling scenarios as a shared example (a function invoked from each spec) parameterised by the controller: build function, payload factory and fetched URL
- **Logs:** reuse only the low-level helpers (spies/refs, flush, response stubbing) and keep its own scenarios; do not adapt `fetchLogs`/`setLogs` into the shared example
- **Extractions:** in scope, limited to the shared helpers (spies, flush) and the "feed fails" block; its interval-based scenarios stay as they are
- Replace every local `flushAsync` with the `act`-wrapped one from `frontend/spec/support/async.js`; verify by running the suite that `act()` does not change timing in the specs that previously used the plain version
- Keep every existing assertion and scenario: the refactor must not reduce what the specs verify or change any production code
- Prefer readability over maximal de-duplication; do not introduce abstractions that make a failing spec harder to read

## Benefits
- Lowers the repository duplication percentage reported by Codacy
- Makes the affected files shorter and easier to extend, so new scenarios need one line instead of a copied block
