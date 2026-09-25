# Split Engine_spec.js
Rewrite `worker/spec/services/Engine_spec.js` on top of `EngineSpecUtils.setup()`:
- Drop the local `enqueueJobs`/`buildEngineContext`, the `let` declarations and the manual `afterEach`. Read `ctx.engine`, `ctx.finished` and `ctx.dead` instead.
- Keep the basic `#start` cases, `registry defaults` and `#on / #emit` here.
- `keeps allocating while jobs cool down` uses `ctx.rebuild({ cooldown: 0 })` instead of calling `resetEngineState()` and `buildEngineContext` by hand.

Create `worker/spec/services/Engine_keep_alive_spec.js` (`describe('Engine', ...)` → `describe('#start', ...)` → `describe('when keepAlive is true', ...)`) with the moved block:
- The keepAlive / pause / resume tests use `EngineSpecUtils.buildEngine({ keepAlive: true, ... })`.
- The `idle timeout` sub-suite keeps its explanatory comment and `SAFETY_NET_ITERATIONS`, and uses `buildEngine` plus `stopAfterIterations` instead of hand-written spies. Assertions on `iterations` read the returned counter's `count`.
- Rename the shadowing local `busy` flag in `resets the idle window...` (e.g. `workersBusy`).

Every test name and every assertion stays the same.

## Files to Change
- `worker/spec/services/Engine_spec.js`: use the shared setup; the keepAlive block moves out.
- `worker/spec/services/Engine_keep_alive_spec.js`: new file holding keepAlive, pause/resume and idle timeout.
