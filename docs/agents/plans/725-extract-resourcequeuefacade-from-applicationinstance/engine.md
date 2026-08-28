# Engine Plan: Extract ResourceQueueFacade from ApplicationInstance

Main plan: [plan.md](plan.md)

## Implementation Steps

### Step 1 — Create `ResourceQueueFacade`

Create `source/lib/services/application/ResourceQueueFacade.js`, a sibling of `ApplicationInstance`/`ApplicationConfigurator`. Move the current bodies (and JSDoc) of `ApplicationInstance#enqueueFirstJobs` and `ApplicationInstance#enqueueResources` into it unchanged:

- `enqueueFirstJobs()` — `new ResourceEnqueuer().enqueueAll()`
- `enqueueResources(names = [])` — falls back to `this.enqueueFirstJobs()` when `names` is empty, otherwise `new ResourceEnqueuer().enqueue(names)`

Add `source/spec/lib/services/application/ResourceQueueFacade_spec.js`, moving the two `describe('#enqueueFirstJobs', ...)` / `describe('#enqueueResources', ...)` blocks currently in `ApplicationInstance_spec.js` (lines 29–56) over as-is, instantiating `ResourceQueueFacade` directly instead of `ApplicationInstance`.

### Step 2 — Delegate from `ApplicationInstance`

In `source/lib/services/application/ApplicationInstance.js`:

- Import `ResourceQueueFacade` from `./ResourceQueueFacade.js`; drop the now-unused `ResourceEnqueuer` import.
- Add a private `#resourceQueueFacade` field, constructor-injectable the same way `#configurator`/`#reporter` are (`{ ..., resourceQueueFacade } = {}` param, `this.#resourceQueueFacade = resourceQueueFacade ?? new ResourceQueueFacade();`), and document the new constructor param in the class JSDoc.
- Replace the bodies of `enqueueFirstJobs()` and `enqueueResources(names = [])` with thin delegators to `this.#resourceQueueFacade`, keeping the same names, signatures, and JSDoc (trimmed to reflect delegation, mirroring how the `EngineController` delegator methods are documented).

In `source/spec/lib/services/application/ApplicationInstance_spec.js`:

- Replace the moved `#enqueueFirstJobs`/`#enqueueResources` blocks (lines 29–56) with thin delegation-verification tests only: that `instance.enqueueFirstJobs()` calls `#resourceQueueFacade.enqueueFirstJobs()`, and `instance.enqueueResources(names)` calls `#resourceQueueFacade.enqueueResources(names)` and returns its result. Inject a stub/spy `resourceQueueFacade` via the constructor rather than spying on `ResourceEnqueuer` directly.
- Leave the other existing usages of `enqueueFirstJobs` (e.g. around `#run`, `#buildEngine`, "delegation to EngineController" describe blocks) untouched — they stub `instance.enqueueFirstJobs` itself and are unaffected by this refactor.
- Remove the now-unused `ResourceEnqueuer` import if nothing else in the file references it.

## Files to Change

- `source/lib/services/application/ResourceQueueFacade.js` — new file, holds `enqueueFirstJobs`/`enqueueResources`
- `source/spec/lib/services/application/ResourceQueueFacade_spec.js` — new file, delegation tests against `ResourceEnqueuer`
- `source/lib/services/application/ApplicationInstance.js` — replace method bodies with delegators to injected `#resourceQueueFacade`
- `source/spec/lib/services/application/ApplicationInstance_spec.js` — slim the two describe blocks down to delegation-only tests, inject a stub facade

## CI Checks

- `source`: `npm run coverage` (CI job: `jasmine`)

## Notes

- `Application.js` (`static enqueueFirstJobs()` / `static enqueueResources(names)`) calls straight into the `ApplicationInstance` singleton and requires no changes.
- Behavior must stay identical: `enqueueResources([])` still routes through `enqueueFirstJobs()` rather than calling `ResourceEnqueuer#enqueue([])` directly — preserve this inside `ResourceQueueFacade`, not in `ApplicationInstance`.
