# Split the spec file

Split `source/spec/lib/services/application/ApplicationInstance_spec.js` per the issue's Public API Preservation decision: behavioral tests for the methods that moved move to a new `EngineController_spec.js`; `ApplicationInstance_spec.js` keeps everything that didn't move plus thin delegation checks.

**Moves to `source/spec/lib/services/engine/EngineController_spec.js`** (construct `EngineController` directly, no `ApplicationInstance` involved):
- `describe('#pause', ...)` (currently lines 33-45)
- `describe('#stop', ...)` (46-64)
- `describe('#continue', ...)` (65-87)
- `describe('#start', ...)` (88-178), including the nested `when called with { enqueue: false }` block. Adapt the `enqueueResources`-related assertions: instead of `spyOn(instance, 'enqueueResources')`, construct the `EngineController` with `enqueueResources: jasmine.createSpy('enqueueResources')` (or similar) and assert on that spy directly, since `start()` now calls the injected callback rather than a sibling method.
- `describe('#reload', ...)` (180-227)
- `describe('#shutdown', ...)` (258-297), including its two nested `when a web server is present` / `when there is no web server` blocks. Set `webServer` on the `EngineController` instance directly (the new public field from step 01) instead of on `ApplicationInstance`.
- The reporter-outcome assertion currently inside `describe('#run', ...)` (`reports the run outcome once the engine finishes`, lines 385-394) — move this into a new `describe('#finishRun', ...)` block, calling `engineController.finishRun()` directly and asserting `reporter.report` was called with `{ failureConfig }` and that `state.get()` (or the injected `EngineState` spy) ends at `'stopped'`.

Add test setup mirroring the current top-of-file `beforeEach` (lines 12-24) but scoped to `EngineController`: a plain mock `engine` object (`{ stop, pause, resume }`), a shared `EngineState` instance set to `'running'`, `spyOn(WorkersRegistry, 'hasBusyWorker').and.returnValue(false)`, `spyOn(JobRegistry, 'clearQueues').and.stub()`, and the same `afterEach` resets (`JobRegistry.reset()`, `LogRegistry.reset()`, `EngineEvents.reset()`).

Optional (not required for behavior parity, but worth doing while the file is being split since there is currently no `#restart` coverage anywhere in the existing spec): add a `describe('#restart', ...)` block to `EngineController_spec.js` covering `stop()` + `start()` being called in sequence when running.

**Stays in `source/spec/lib/services/application/ApplicationInstance_spec.js`**:
- `describe('#enqueueFirstJobs', ...)`, `describe('#enqueueResources', ...)` (228-257) — unchanged, these methods didn't move.
- `describe('#buildEngine', ...)` (298-365) — unchanged; these tests spy on `instance.shutdown` (the delegator, still present) and are unaffected by the `onIdleTimeout` rewiring, since the observable behavior (`buildEngine`'s idle timeout eventually calls `shutdown()`) is identical.
- `describe('#run', ...)` (367+) — keep the autostart/non-autostart branching and promise-aggregation tests; replace the reporter-outcome assertion (moved above) with a thinner check that `run()` results in `instance.status()` ending at `'stopped'` and/or that a spy on `instance.#engineController.finishRun` (or an equivalent observable) was invoked — whatever is idiomatic once `#engineController` exists as a private field.
- Add new, thin `describe` blocks (or extend existing ones) asserting each of the seven delegator methods (`pause`, `stop`, `continue`, `start`, `restart`, `reload`, `shutdown`) forwards to `#engineController`'s same-named method with the same arguments and returns its result — this is the only new test surface `ApplicationInstance_spec.js` needs for the moved methods now that their behavior lives elsewhere.

## Files to Change

- `source/spec/lib/services/application/ApplicationInstance_spec.js` — remove the moved `describe` blocks, add thin delegation tests for the seven forwarded methods.
- `source/spec/lib/services/engine/EngineController_spec.js` (new) — the moved behavioral tests plus their own setup/teardown.
