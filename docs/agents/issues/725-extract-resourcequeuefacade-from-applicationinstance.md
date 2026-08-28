# Issue: Extract ResourceQueueFacade from ApplicationInstance

## Description
Split off from #724 (Extract responsibilities from ApplicationInstance), which extracts `EngineController` from `ApplicationInstance` (`source/lib/services/application/ApplicationInstance.js`) as Phase 1. This issue covers Phase 2: a trivial, low-risk extraction of the resource-enqueuing responsibility, tracked separately so it can land as its own small PR.

## Problem
`ApplicationInstance` still owns the resource-enqueuing responsibility — `enqueueFirstJobs()` and `enqueueResources(names)` — mixed in with its other duties, even after the `EngineController` extraction in #724.

## Solution
Move these two methods out of `ApplicationInstance` into a new `ResourceQueueFacade` class:

- `enqueueFirstJobs()` — delegates to `ResourceEnqueuer#enqueueAll()`
- `enqueueResources(names)` — delegates to `ResourceEnqueuer#enqueue(names)`, falling back to `enqueueFirstJobs()` when `names` is empty (matching current behavior)

`ApplicationInstance` keeps thin public delegator methods with the same names/signatures (mirroring the delegation pattern used for `EngineController` in #724), since `Application.js` (the static singleton facade) calls `enqueueFirstJobs()` and `enqueueResources(names)` directly on the `ApplicationInstance` singleton and must not need to change.

Suggested file location: `source/lib/services/application/ResourceQueueFacade.js` — sibling to `ApplicationInstance`/`ApplicationConfigurator`, matching how `ApplicationConfigurator` stayed in `application/` as an instance-level collaborator despite being extracted out.

### Testing
Existing `enqueueFirstJobs`/`enqueueResources` tests in `ApplicationInstance_spec.js` should move to a new `ResourceQueueFacade_spec.js`, testing the facade's delegation to `ResourceEnqueuer` directly; `ApplicationInstance_spec.js` keeps only thin delegation-verification tests for these two methods.

## Benefits
Continues the responsibility-extraction effort started in #724, keeping `ApplicationInstance` thinner while `Application.js` and its public API remain untouched.
