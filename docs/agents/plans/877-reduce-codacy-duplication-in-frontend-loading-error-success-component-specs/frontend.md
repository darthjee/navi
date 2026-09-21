# Frontend Plan: Reduce Codacy duplication in frontend loading/error/success component specs

Main plan: [plan.md](plan.md)

## Overview
Add shared helpers to `frontend/spec/support/` and use them in `Emissions_spec.js`, `Extractions_spec.js`, `Job_spec.js`, `Jobs_spec.js` and `StatsHeader_spec.js` (all under `frontend/spec/components/`). No production code changes.

## Context
- Each of the five specs repeats: a local `flushAsync` (the `act`-wrapped form), a `while loading` block (`spyOn(globalThis, 'fetch').and.returnValue(new Promise(noop))` + render + spinner/loading-text assertions) and an error block.
- `support/fetch.js` already exports `mockFetchSuccess` and `mockFetchFailure`; both are called at describe level and register a `beforeEach` that spies on `globalThis.fetch`. Emissions, Extractions and StatsHeader already use `mockFetchFailure(503)`; **Job (500) and Jobs (503) stub the failure inline** and must be moved onto it.
- Error blocks are not uniform: Job, Jobs and StatsHeader have four `it`s (no spinner, `.alert-danger`, "Failed to load X", "HTTP N"); Emissions and Extractions have one `it` asserting `.alert-danger`, the message and the status together, without the "no spinner" check. Adopting the shared four-`it` form gives those two one extra assertion (accepted in the issue discussion).
- Per-spec render closures differ (bare `MemoryRouter`; `initialEntries` + `Routes/Route` for Job; a two-route `Routes` with `initialPath` for Jobs) and success-state mocks are spec-specific (`mockCursorFeed`, `mockPair`, `mockJobFetch`, URL-based fake in Jobs, `mockFetchSuccess` in StatsHeader). Those stay in their specs.
- `flushAsync` is defined in 21 spec files: 17 use the `act`-wrapped form, 4 (`LogsPageView_spec.js`, and the Emissions/Extractions/Logs controller specs) use a plain `new Promise(setTimeout)` without `act` and are not interchangeable. Adoption outside the five target specs is out of scope (issues #878–#884 cover the other files, so touching them here would risk merge conflicts).
- Jasmine has no built-in shared examples; the repo convention is a function that registers `describe`/`it`/`beforeEach` when called at describe level (`useContainer`, `mockFetchSuccess`). `support/dom.js` is auto-loaded as a Jasmine helper; other helpers are imported by relative path (`../support/fetch.js`).

## Steps

- [01 — Add shared spec helpers](frontend/01-add-shared-spec-helpers.md)
- [02 — Adopt helpers in Emissions and Extractions](frontend/02-adopt-in-emissions-and-extractions.md)
- [03 — Adopt helpers in Job and Jobs](frontend/03-adopt-in-job-and-jobs.md)
- [04 — Adopt helpers in StatsHeader and verify](frontend/04-adopt-in-statsheader-and-verify.md)

## CI Checks
- `frontend`: `npm run lint` (CI job: `checks-frontend`)
- `frontend`: `npm test` (CI job: `jasmine-frontend`)

## Notes
- `mockFetchFailure` registers its stub in a `beforeEach`, so the shared example must be called at describe level and the component must be rendered in a later `beforeEach`/`it`, so the stub is in place first.
- Keep every existing assertion and scenario, including spec-specific blocks (Job's 404 "not found" block, the empty-state blocks in Emissions/Extractions, Jobs' route-param block).
- Prefer readability over maximal de-duplication; do not introduce abstractions that make a failing spec harder to read. Success-state blocks are intentionally left alone.
- The duplication numbers come from Codacy's analysis of `main`; confirming the reduction requires a Codacy re-run on the PR (locally, `npm run report` runs jscpd on `src/` only and does not cover specs).
