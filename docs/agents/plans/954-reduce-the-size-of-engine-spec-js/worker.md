# Worker Plan: Reduce the size of Engine_spec.js

Main plan: [plan.md](plan.md)

## Overview
Make `worker/spec/services/Engine_spec.js` (338 lines) smaller than 300 lines. First extract the setup that is shared, or duplicated, across the Engine specs into `worker/spec/support/utils/EngineSpecUtils.js`. Then move the `when keepAlive is true` block into its own spec file, and move `Engine_async_spec.js` onto the same helper.

## Context
- `Engine_spec.js` defines `enqueueJobs` and `buildEngineContext` locally, and builds `new Engine({ jobRegistry: JobRegistry, workersRegistry: WorkersRegistry, keepAlive: true, sleepMs: -1, ... })` by hand in 8 places.
- The idle-timeout tests repeat the same pattern each time: a `promoteReadyJobs` spy that counts iterations and calls `engine.stop()` at `SAFETY_NET_ITERATIONS`.
- `Engine_async_spec.js` copies `enqueueJobs` and the collection/registry build. Its differences: it passes `workers: new IdentifyableCollection()` to `WorkersRegistry.build`, and it passes a `DummyWorkersAllocator` to the Engine.
- The helper follows the `setup()` → context object precedent in `source/spec/support/utils/EmitJobSpecUtils.js`: the helper registers `beforeEach`/`afterEach` and returns a `ctx` that is refreshed every time. Cleanup reuses `RegistryCleanupUtils.resetEngineState()` (`worker/spec/support/utils/RegistryCleanupUtils.js`).

## Steps

- [01 — Add EngineSpecUtils](worker/01-add-engine-spec-utils.md)
- [02 — Split Engine_spec.js](worker/02-split-engine-spec.md)
- [03 — Migrate Engine_async_spec.js](worker/03-migrate-engine-async-spec.md)

## CI Checks
- `worker`: `yarn spec` / `yarn test` (CI job: `jasmine-worker`)
- `worker`: `yarn lint` (and `yarn report` for jscpd duplication) (CI job: `checks-worker`)

## Notes
- No production code in `worker/lib/` changes.
- Test count and assertions stay the same. Compare the jasmine spec count before and after (`yarn spec` summary).
- Inside the `resets the idle window...` test, the local `let busy = true` shadows the outer `busy` collection. Rename it (e.g. `workersBusy`) while moving the test.
- The file names and the helper API are suggestions from the issue. Adjust them if something else reads better, but keep every resulting file under 300 lines.
