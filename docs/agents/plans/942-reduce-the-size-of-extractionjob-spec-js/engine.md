# Engine Plan: Reduce the size of ExtractionJob_spec.js

Main plan: [plan.md](plan.md)

## Overview
Bring `source/spec/lib/jobs/ExtractionJob_spec.js` under 300 lines without losing coverage. Move the registry-oriented `emission tracking` and `extraction tracking` blocks into their own spec file, and extract the file-local setup both files need into a spec util. This follows the `EmitJobSpecUtils` / `ApiEngineStartHandlerSpecUtils` precedent.

## Context
- The spec is 312 lines, and the size check reports it as WARN.
- Lines ~206–312 hold `describe('emission tracking')` and `describe('extraction tracking')`. Both use the file-local setup: the `let` vars (`job`, `rawBody`, `parser`, `parserRegistry`, `parserImpl`, `jobRegistry`, `logContext`), the top-level `beforeEach`, and the helpers `buildJob`, `performWith` and `expectEmitEnqueued`. They also use the module-level constants `emit`, `parameters`, `originUrl`, `singleItem` and `twoItems`.
- `performIgnoringFailure` and `unregisteredParser` are only used by the `#perform` blocks, which stay in the original file.
- Precedent: `source/spec/support/utils/EmitJobSpecUtils.js` has a static `setup()`, called inside the top-level `describe`. It registers the `beforeEach` and returns a mutable `ctx` object with bound helpers (`ctx.rebuildJob(...)`, `ctx.performIgnoringFailure(...)`). The spec files use `ctx.job`, `ctx.logContext` and so on.

## Implementation Steps

### Step 1 — Add `ExtractionJobSpecUtils`
Create `source/spec/support/utils/ExtractionJobSpecUtils.js`, modeled on `EmitJobSpecUtils`:
- Static getters for the shared fixtures: `emit` (`ResourceRequestEmitFactory.build({ method: 'POST', url: 'https://example.com/items/{:id}' })`), `parameters` (`{ id: '42' }`), `originUrl`, `singleItem` and `twoItems`.
- `static setup()` installs a `beforeEach` that fills `ctx.logContext`, `ctx.rawBody`, `ctx.parser`, `ctx.parserImpl`, `ctx.parserRegistry` and `ctx.jobRegistry` exactly like today's top-level `beforeEach`, then returns `ctx`. `ctx` exposes bound helpers:
  - `ctx.buildJob(overrides)` builds `ctx.job` via `ExtractionJobFactory.build({ rawBody, parser, parserRegistry, jobRegistry, ...overrides })`.
  - `ctx.performWith(items)` stubs `ctx.parserImpl.extract` to return `items`, then awaits `ctx.job.perform(ctx.logContext)`.
  - `ctx.performIgnoringFailure()`.
  - `ctx.expectEmitEnqueued(item, extractionId = null)`.
- Add JSDoc in the same style as `EmitJobSpecUtils`, including the class-level comment.

Note: the `emit` getter must return the same instance on every call, because `expectEmitEnqueued` compares by equality. `ResourceRequestEmitFactory.build` returns a new object each time, but `toHaveBeenCalledWith` uses deep equality, so that works. It is still simpler to build it once in a module-level const and return that.

### Step 2 — Split the spec
- Create `source/spec/lib/jobs/ExtractionJobTracking_spec.js` with `describe('ExtractionJob', () => { const ctx = ExtractionJobSpecUtils.setup(); ... })`. It contains the `emission tracking` and `extraction tracking` blocks, rewritten against `ctx.*` and the util getters, with the same `describe`/`it` titles and the same assertions.
- Remove those blocks from `ExtractionJob_spec.js`. Rewrite the remaining blocks (`#constructor`, `#maxRetries`, `#arguments`, `#perform`, `#exhausted`) to use `ExtractionJobSpecUtils.setup()` instead of the local `let`s, `beforeEach` and helpers. Drop imports that are no longer used (`EmissionRegistry`, `ExtractionRegistry`, and any others the move leaves unused).
- Check that both files are under 300 lines (`wc -l`) and that the total number of specs is unchanged.

## Files to Change
- `source/spec/support/utils/ExtractionJobSpecUtils.js` — new shared setup/helper util.
- `source/spec/lib/jobs/ExtractionJobTracking_spec.js` — new spec with the emission and extraction tracking blocks.
- `source/spec/lib/jobs/ExtractionJob_spec.js` — tracking blocks removed, setup switched to the util.

## CI Checks
- `source`: `yarn spec` and `yarn lint` (CI job: `lint-and-report` via `scripts/ci.sh lint-and-report source`, plus the source spec job).

## Notes
- Compare the jasmine spec count before and after the split. It must stay the same.
- In `extraction tracking`, the test `still increments the emission extracted counter` builds and resets `EmissionRegistry` inline. Keep that behavior as is.
- Put both `setup()` calls in the top-level `describe`, so each file gets its own fresh context.
