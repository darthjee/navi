# Frontend Plan: Reduce Codacy duplication in frontend controller specs

Main plan: [plan.md](plan.md)

## Context
- `EmissionsController_spec.js` and `MemoryChartController_spec.js` are near-identical `#buildPollingEffect` specs (same `setData`/`setError`/`setLoading` spies, `cancelledRef`/`lastIdRef`, `mockResponses`, `flushMany`, failure and cleanup blocks). They differ only in payload shape (`{ counts, emissions }` vs bare array), the fetched URL and how `setData`'s argument exposes the rows.
- `LogsController_spec.js` uses an injected `fetchLogs` and `setLogs`; `ExtractionsController_spec.js` uses `buildEffect` with an interval. Both only reuse low-level helpers.
- `flushAsync` is redefined locally in all four specs; `spec/support/async.js` already exports the `act`-wrapped one.
- Decisions from the issue discussion: shared example for Emissions + MemoryChart only; helpers-only for Logs; Extractions limited to shared helpers and the "feed fails" block; every local `flushAsync` in these four specs replaced by the `act`-wrapped one.

## Steps

- [01 — Add shared low-level helpers](frontend/01-add-shared-helpers.md)
- [02 — Add the polling controller shared example](frontend/02-add-polling-shared-example.md)
- [03 — Refactor Emissions and MemoryChart specs](frontend/03-refactor-emissions-and-memory-specs.md)
- [04 — Refactor Logs and Extractions specs](frontend/04-refactor-logs-and-extractions-specs.md)

## CI Checks
- `frontend`: `npm test` (CI job: `jasmine-frontend`)
- `frontend`: `npm run lint` (CI job: `checks-frontend`)

## Notes
- Production code (`frontend/src/`) must not change; the diff is confined to `frontend/spec/`.
- Switching Emissions/Logs/Extractions to the `act`-wrapped `flushAsync` may change timing or emit act warnings: these specs do not import `spec/support/dom.js` (which sets `IS_REACT_ACT_ENVIRONMENT`), though MemoryChart already uses `act` this way. Run the suite after each step; if a spec breaks, keep the fix local rather than reverting the decision silently and report it.
- Other specs (`ExtensionRoutes_spec.js`, `Layout_spec.js`, `LogsPageView_spec.js`, `MemoryUsageChart_spec.js`, `ReadyCountdown_spec.js`) also define a local `flushAsync`; they are out of scope for this issue.
- The shared example may add assertions a controller spec did not previously have (e.g. "does not poll again on an empty response" for MemoryChart) as long as they pass; it must never remove one. Keep controller-specific scenarios (Emissions counts, MemoryChart `MAX_POINTS` cap, `last_id` cursor URL, fail-then-recover) in their own specs.
- Prefer readability: if a shared-example parameter makes a failing spec hard to read, keep that scenario inline instead.
- After the refactor, re-check Codacy duplication for the four files (Codacy MCP `codacy_get_file_clones`) once the branch is analysed.
