# Engine Plan: Reduce the size of EngineController_spec.js

Main plan: [plan.md](plan.md)

## Overview
Test-only refactor of `source/spec/lib/services/engine/EngineController_spec.js` (569 lines, flagged ERROR by the spec size check). Extract the inline test double, the shared scenarios and the common setup into `source/spec/support/`, then split the spec into three files that are each under 300 lines. No production code changes and no assertions added or removed.

## Context
The current file contains:
- `buildFakeEngine` (lines ~10–33): a fake engine with an `on`/`emit` listener API.
- The top-level `beforeEach`/`afterEach` (lines ~35–58): builds an `EngineState` set to `running`, the `enqueueResources`/`reloadConfig` spies, a controller with a plain `{ stop, pause, resume, emit }` engine, spies `WorkersRegistry.hasBusyWorker` and `JobRegistry.clearQueues`, and resets `JobRegistry`/`LogRegistry` after each spec.
- Three shared scenarios (`itDoesNothingWhenRunning`, `itStopsThenResumesInOrder`, `itDoesNothingWhenNotRunning`) that close over `controller` and `state`.
- Wiring specs: `#buildEngine` (~65 lines), `#bind` (~75), `.build` (~57).
- Lifecycle specs: `#start`, `#pause`, `#stop`, `#continue`, `#resumeProcessing` (~80), `#restart`, `#reload`, `#shutdown`, `#finishRun` (~260 lines together).

A two-way split would leave the lifecycle file at about 295 lines, which is too close to the limit, so this plan uses a three-way split. It follows the precedent from #932 (`ResourceRequest_<topic>_spec.js` + `ResourceRequestSpecUtils`).

## Steps

- [01 — Extract FakeEngine dummy](engine/01-extract-fake-engine.md)
- [02 — Extract shared setup and examples](engine/02-extract-setup-and-examples.md)
- [03 — Split the spec into three files](engine/03-split-spec.md)

## CI Checks
- `source/`: `yarn spec` (CI job: `jasmine`)
- `source/`: `yarn lint` (CI job: `checks`)

## Notes
- The shared scenarios currently read the local `controller`/`state` variables. Once they are extracted, they must read the values built in the current `beforeEach` through a context object or getters, as `JobLifecycleExamples` does. Capturing values at definition time would read stale objects.
- `#finishRun` replaces the controller in its own `beforeEach`. With a context object it must assign `ctx.controller`, so that `state`/spies from the shared setup keep being used.
- Keep the `hasBusyWorker`/`clearQueues` spies and the registry resets in the shared setup for every file, even where a file does not strictly need them, so behavior stays identical.
- Spec descriptions should stay the same (`describe('EngineController', ...)` → `describe('#method', ...)`), so reports read the same as before.
- File names are suggestions. Any split works as long as every file stays under 300 lines and no coverage is lost.
