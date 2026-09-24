# Extract shared setup and examples
Create two support utils so every resulting spec file shares the same setup and scenarios.

**`EngineControllerSpecUtils`** (in the style of `ResourceRequestSpecUtils`):
- `static setupController()`: registers the current top-level `beforeEach`/`afterEach` and returns a context object whose fields (`controller`, `state`, `enqueueResources`, `reloadConfig`) are filled in on every `beforeEach`:
  - `state = new EngineState(); state.set('running')`
  - `enqueueResources` spy returning `{ enqueued: [], skippedResources: [] }`, `reloadConfig` spy
  - `controller = new EngineController({ state, sleepMs: 0, enqueueResources, reloadConfig })` with `controller.engine = { stop, pause, resume, emit }` no-ops
  - `spyOn(WorkersRegistry, 'hasBusyWorker').and.returnValue(false)`, `spyOn(JobRegistry, 'clearQueues').and.stub()`
  - `afterEach`: `JobRegistry.reset()`, `LogRegistry.reset()`

**`EngineControllerExamples`** (in the style of `JobLifecycleExamples`): static methods that register `it` blocks with the same descriptions as today and read the controller/state lazily from the context object (or from getters):
- `doesNothingWhenRunning(ctx, method, requiredState)`
- `stopsThenResumesInOrder(ctx, method)`
- `doesNothingWhenNotRunning(ctx, method)`

The `#shutdown`-local `itStopsTheEngine` scenario and the `#bind`/`.build`/`#buildEngine` local helpers (`clearedOnStop`, `buildController`, `runEngineUntil`) stay local to their `describe` blocks. They are used only there.

## Files to Change
- `source/spec/support/utils/EngineControllerSpecUtils.js` — new; shared `beforeEach`/`afterEach` controller setup that returns a context object.
- `source/spec/support/utils/EngineControllerExamples.js` — new; the three shared lifecycle scenarios.
