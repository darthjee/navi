# Issue: Reduce the size of EngineController_spec.js

## Description
The spec size check reports `source/spec/lib/services/engine/EngineController_spec.js` as **ERROR** with 569 lines.

## Problem
- The spec defines a `buildFakeEngine` test double and three shared scenario functions (`itDoesNothingWhenRunning`, `itStopsThenResumesInOrder`, `itDoesNothingWhenNotRunning`) inline, which takes about 100 lines.
- It covers both engine construction/wiring (`#buildEngine`, `#bind`, `.build`) and the whole lifecycle (`#start`, `#pause`, `#stop`, `#continue`, `#resumeProcessing`, `#restart`, `#reload`, `#shutdown`, `#finishRun`).

## Expected Behavior
- Every resulting spec file is under 300 lines (the size check reports no WARN/ERROR for it).
- No test coverage is lost: the same behaviors are asserted, and `yarn spec` and `yarn lint` stay green in `source/`.
- New shared helpers live in `source/spec/support/` (`factories/`, `utils/` or `dummies/`), following the style of the existing ones (`ResourceRequestFactory`, `AxiosUtils`, `LoggerUtils`, `JobLifecycleExamples`, `ResourceRequestSpecUtils`, ...).

## Solution
- Move `buildFakeEngine` to `source/spec/support/dummies/services/` (e.g. `FakeEngine.js`, next to `DummyWorkersAllocator`) or into a factory.
- Move the shared scenarios into a support util (e.g. `EngineControllerExamples`), in the style of `JobLifecycleExamples`.
- Share the controller/state setup (the `beforeEach`/`afterEach` that builds `EngineState`, the `enqueueResources`/`reloadConfig` spies and the registry stubs) through a helper (e.g. `EngineControllerSpecUtils`) so every resulting file uses the same one, as was done for `ResourceRequestSpecUtils` in #932.
- Split into, for example:
  - `EngineController_spec.js`: `#buildEngine`, `#bind`, `.build`
  - `EngineControllerLifecycle_spec.js`: `#start` through `#finishRun`
- The lifecycle block alone is about 260 lines, so a two-way split might still come close to 300. If it does, split the lifecycle specs again (for example, move `#resumeProcessing`, `#reload` and `#shutdown` to their own file).

The split and file names above are suggestions. The implementer can pick a different split, or extract helpers, whichever keeps the specs readable.

## Benefits
- Specs that are easier to read and navigate
- Reusable setup instead of long local helpers
- The spec size check stops flagging this file
