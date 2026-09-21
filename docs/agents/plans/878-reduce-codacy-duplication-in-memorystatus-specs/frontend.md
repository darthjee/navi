# Plan: Reduce Codacy duplication in MemoryStatus specs

Issue: [878-reduce-codacy-duplication-in-memorystatus-specs.md](../../issues/878-reduce-codacy-duplication-in-memorystatus-specs.md)

## Overview
Spec-only refactor of the two MemoryStatus specs. No production code changes and no assertion or scenario is dropped.

## Context
- `MemoryStatus_spec.js` hand-writes the "while loading" and "when the fetch fails" scenarios and defines a local `flushAsync`, although `itBehavesLikeFetchStates` (`support/fetch_states.js`) and `flushAsync` (`support/async.js`) already exist (issue #877) and are used by the Jobs, Job, Emissions, Extractions and StatsHeader specs.
- The five per-status `describe`s in `MemoryStatus_spec.js` (low / medium / high / over at 100 / over above 100) are copies of the same `mockFetchSuccessWithHistory(...)` + `beforeEach(render + flushAsync)` + "color class" + "renders the memory usage chart" block, varying only by payload and expected class.
- `MemoryStatusHelper_spec.js` hand-rolls the container/root setup that `useContainer` (`support/dom.js`) already provides, and repeats `await act(async () => { root.render(...) })` in every `beforeEach`.
- `support/fetch.js` is shipped verbatim in the navi-hey-test image and must not gain memory-specific helpers.

## Steps

- [01 — Add shared spec helpers](frontend/01-add-shared-spec-helpers.md)
- [02 — Refactor MemoryStatus_spec](frontend/02-refactor-memorystatus-spec.md)
- [03 — Refactor MemoryStatusHelper_spec](frontend/03-refactor-memorystatushelper-spec.md)

## CI Checks
- `frontend`: `cd frontend && yarn test` (CI job: `jasmine-frontend`)
- `frontend`: `cd frontend && yarn lint` (CI job: `checks-frontend`)

## Notes
- Keep generated `describe`/`it` names as close to the current ones as possible (e.g. `with status low`); small wording changes forced by table-driving are acceptable.
- Prefer readability over maximal de-duplication; do not introduce abstractions that make a failing spec harder to read.
- The clone reduction itself is verified manually on Codacy after merge (no numeric target); locally, `yarn test` and `yarn lint` must pass and the number of scenarios/assertions must not drop.
