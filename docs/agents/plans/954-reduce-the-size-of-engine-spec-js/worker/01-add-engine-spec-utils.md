# Add EngineSpecUtils
Create `worker/spec/support/utils/EngineSpecUtils.js`, a static-method class exported by name. Document it with JSDoc in the style of `RegistryCleanupUtils` and `source/spec/support/utils/EmitJobSpecUtils.js`. It exposes:

- `enqueueJobs(count)`: enqueues `count` `ResourceRequestJob`s with `{ resourceRequest: {}, parameters: {} }`.
- `buildEngine(options = {})`: returns `new Engine({ jobRegistry: JobRegistry, workersRegistry: WorkersRegistry, sleepMs: -1, ...options })`.
- `setup(defaults = {})`: call it inside a top-level `describe`. It returns a `ctx` object and registers:
  - `beforeEach` → `EngineSpecUtils.build(ctx, defaults)`
  - `afterEach` → `RegistryCleanupUtils.resetEngineState()`

  `ctx.rebuild(options)` resets the registries and rebuilds with the merged options. The `keeps allocating while jobs cool down` case uses it with `{ cooldown: 0 }`.
- `build(ctx, { cooldown = -1, workers, engineOptions = {} })`: fills `ctx.finished`, `ctx.dead`, `ctx.busy` (new `IdentifyableCollection`s), `ctx.jobFactory` (`DummyJobFactory`) and `ctx.workerFactory` (`DummyWorkerFactory`). It registers the job factory, builds `JobRegistry` and `WorkersRegistry` (quantity 2, passing `workers` when given), calls `initWorkers()` and `DummyJob.setSuccessRate(1)`, then sets `ctx.engine = buildEngine(engineOptions)`. `engineOptions` may be a function of `ctx`, so the async spec can build its `DummyWorkersAllocator` against the live registries.
- `stopAfterIterations(engine, { limit, onIteration } = {})`: spies `JobRegistry.promoteReadyJobs` with a fake. The fake increments a counter, calls `onIteration(counter.count)` when given, and calls `engine.stop()` once `limit` is reached. It returns the counter object (`{ count }`) so the test can assert on iterations. This replaces the hand-written iteration spies in the keepAlive and idle-timeout tests.

Keep the per-spec `spyOn(console, 'error').and.stub()` in the specs, or add it as a `setup` option. Don't hide it silently.

## Files to Change
- `worker/spec/support/utils/EngineSpecUtils.js`: new shared helper.
