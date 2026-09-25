# Engine Plan: Reduce the size of ApiEngineStartHandler_spec.js

Main plan: [plan.md](plan.md)

## Overview
Bring `source/spec/lib/server/handlers/api/ApiEngineStartHandler_spec.js` under 300 lines without losing any asserted behavior. Do this by extracting the shared setup into a support util and moving the parameters scenarios into a sibling spec.

## Context
- The file is 314 lines. The spec size check reports it as WARN.
- The stopped and running branches look alike, but they are not true duplicates. The stopped branch asserts `Application.start()` calls (`([], { enqueue: false })` when targets are given). The running branch asserts that `Application.start()`/`enqueueResources()` are *not* called and that enqueueing goes through the namespace. Forcing both into one parametrized example set would hurt readability. Moving the long parameters block out gives the clearest result.
- The `when the engine is running › and targets carries parameters` block (lines 200–300, ~100 lines) is the biggest single chunk. The `when the engine is stopped › and targets carries an object-form resource with parameters` block (lines 133–155) covers the same topic.
- Both files need the same setup: the `res` double, the `JobRegistry.enqueue` stub, `processBody`, `expectRunningResponse`, and the `Application.reset()`/`NamespaceMap.reset()` teardown.

## Implementation Steps

### Step 1 — Extract shared setup into `ApiEngineStartHandlerSpecUtils`
Create `source/spec/support/utils/ApiEngineStartHandlerSpecUtils.js`, following the style of the other `*SpecUtils` helpers (a class with static methods and JSDoc; see `EngineControllerSpecUtils`, `ApplicationStateUtils`). It should provide:
- `setup()`: registers the `beforeEach` (builds the `res` double with `json`/`status` spies and stubs `JobRegistry.enqueue`) and the `afterEach` (`Application.reset()`, `NamespaceMap.reset()`). It returns a context object whose `res` is read lazily, like `EngineControllerSpecUtils.setupController`.
- `processBody(ctx, body)`: runs `new ApiEngineStartHandler({ body }, ctx.res, 'token').process()`.
- `expectRunningResponse(ctx, enqueued, skippedResources = [])`: asserts `ctx.res.json` was called with `{ status: 'running', enqueued, skippedResources }`.

Update `ApiEngineStartHandler_spec.js` to use it instead of its local `res`/`processBody`/`expectRunningResponse`/hooks. Local one-line wrappers are fine if they keep the call sites short.

### Step 2 — Move the parameters scenarios into `ApiEngineStartHandlerParameters_spec.js`
Create `source/spec/lib/server/handlers/api/ApiEngineStartHandlerParameters_spec.js` with `describe('ApiEngineStartHandler', () => { describe('#process with target parameters', ...) })`, using the util from Step 1. Move these blocks unchanged into it, keeping their `ApplicationStateUtils.stubStopped()`/`stubRunning()` setup:
- `when the engine is stopped › and targets carries an object-form resource with parameters` (1 spec)
- `when the engine is running › and targets carries parameters` (7 specs, including the `NamespaceMap.reset()` inside `threads extra parameter keys ...`)

Remove those blocks from `ApiEngineStartHandler_spec.js`. That file keeps the instance check, malformed-targets validation, stopped/running omitted/given scenarios and the ConflictError case.

## Files to Change
- `source/spec/support/utils/ApiEngineStartHandlerSpecUtils.js` — new shared setup/helpers.
- `source/spec/lib/server/handlers/api/ApiEngineStartHandler_spec.js` — use the util; drop the moved parameter blocks (target ≈ 190 lines).
- `source/spec/lib/server/handlers/api/ApiEngineStartHandlerParameters_spec.js` — new; holds the parameters scenarios (target ≈ 140 lines).

## CI Checks
- `source`: `yarn spec` and `yarn lint` (run inside `source/`)

## Notes
- The spec count must stay the same: 1 instance + 12 malformed + 2+3+1 stopped + 2+2+7 running + 1 conflict = 31 `it`s across both files. Compare `yarn spec` totals before and after.
- Don't change any assertion or description text beyond what's needed to move the block. This is a pure restructure.
- If the implementer finds that parametrized shared examples (per the issue's first suggestion) read better, that's acceptable, as long as both files stay under 300 lines and coverage is unchanged.
