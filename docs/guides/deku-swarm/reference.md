# Reference

The full public API exported from `deku-swarm` (`lib/index.js`): `Worker`, `WorkerFactory`, `WorkersRegistry`, `Job`, `JobFactory`, `JobRegistry`, `Engine`, `WorkersAllocator`, `IdentifyableCollection`, `Queue`, `SortedCollection`. Everything else (`Factory`, `Collection`, the `generators/` classes, etc.) is an internal implementation detail, not part of the public surface.

## `Job`

Abstract base class for every unit of work. See [Defining Jobs](./defining-jobs.md) for the narrative version.

| Member | Description |
|--------|-------------|
| `constructor({ id, maxRetries, cooldown })` | `id` is the job's unique identifier. `maxRetries`/`cooldown` are optional per-instance overrides (see the getters below). |
| `async perform(logContext)` | Must be overridden by subclasses. Throwing marks the job as failed; resolving marks it finished. |
| `get readyBy` | The absolute timestamp (epoch ms) before which the job isn't eligible for retry. |
| `applyCooldown(ms)` | Sets `readyBy` to `Date.now() + ms`. Called internally on failure; a negative `ms` marks the job immediately ready. |
| `isReadyBy(currentTime)` | Whether the job's cooldown has elapsed as of `currentTime`. |
| `get maxRetries()` | Maximum retry count for this job. Returns the constructor's `maxRetries` if given, else `3`; override the getter in a subclass to customize per job class (the override always wins over the constructor param). |
| `get cooldown()` | This job's own cooldown override in ms, or `undefined` if not passed to the constructor. Used by `JobRegistry.fail(job)` in place of the registry's configured global when set. |
| `exhausted(maxRetries = this.maxRetries)` | Whether the job has used up its retry attempts. |
| `get endedAt` | Read-only. Epoch ms at which the job entered `finished` or `dead`, or `null` if it hasn't ended. Reset to `null` by `JobRegistry.retryJob(id)` on a dead job. Used by pruning (`olderThan`). |

## `JobFactory`

Builds `Job` instances with generated unique IDs; also serves as a static name → factory registry.

| Member | Description |
|--------|-------------|
| `new JobFactory({ klass, attributesGenerator, attributes })` | `klass` defaults to the generic `Job` base class; `attributesGenerator` defaults to a fresh `IdGenerator`; `attributes` are merged into every built job. |
| `build(params)` | Builds a job, merging constructor-level `attributes` with `params` (params win on key collisions). |
| `JobFactory.build(name, options)` | Creates a `JobFactory` from `options` (`{ klass, attributesGenerator, attributes }`) and registers it under `name` for lookup by `JobRegistry.enqueue(name, params)`. |
| `JobFactory.get(name)` | Retrieves a previously registered factory. |
| `JobFactory.reset()` | Clears all registered factories. Intended for test teardown. |

## `JobRegistry`

Static singleton facade managing the job queues (`enqueued`, `processing`, `failed`, `retryQueue`, `finished`, `dead`). See [Setup](./setup.md) for building the singleton and [Job Lifecycle](./job-lifecycle.md) for the narrative version of every method below.

| Method | Description |
|--------|-------------|
| `JobRegistry.build(options)` | Builds the singleton. `options.cooldown` (ms, default `5000`) and `options.maxRetries` (default `3`) control retry behavior. `options.retention` (`{ finished?: number, dead?: number }`, non-negative integers) caps how many jobs the `finished` / `dead` collections keep, evicting the oldest on push; an omitted status is unbounded, `0` evicts on arrival, and invalid values throw. Throws if already built. |
| `JobRegistry.ensureBuild(options)` | Builds the singleton only if not already built; a pure no-op (options ignored) once built; returns the instance. |
| `JobRegistry.reset()` | Destroys the singleton. Use in test teardown. |
| `JobRegistry.enqueue(factoryKey, params = {})` | Builds a job via the named `JobFactory` and pushes it onto `enqueued`. |
| `JobRegistry.pick()` | Removes and returns the next ready job (`enqueued` first, then `retryQueue`), moving it to `processing`. `undefined` if none are ready. |
| `JobRegistry.requeue(job)` | Moves a job from `processing` back to `enqueued`. |
| `JobRegistry.finish(job)` | Removes the job from `processing`, pushes it onto `finished`. |
| `JobRegistry.fail(job)` | Removes the job from `processing`; pushes it onto `dead` if `job.exhausted()`, otherwise applies cooldown and pushes it onto `failed`. |
| `JobRegistry.retryJob(id)` | Manually moves a job from `failed` or `dead` straight into `retryQueue`, bypassing cooldown. Returns the job, or `null` if not found in either. |
| `JobRegistry.promoteReadyJobs()` | Moves jobs whose cooldown has elapsed from `failed` into `retryQueue`. Called each `Engine` tick. |
| `JobRegistry.clearQueues()` | Clears `enqueued`/`retryQueue`/`failed`/`finished`/`dead`, leaving `processing` untouched. |
| `JobRegistry.hasJob()` | Whether any jobs exist in `enqueued`, `failed`, or `retryQueue`. |
| `JobRegistry.hasReadyJob()` | Whether any jobs are immediately pickable (`enqueued` or `retryQueue` non-empty). |
| `JobRegistry.jobsByStatus(status)` | All jobs in the given status collection (`'enqueued'`, `'processing'`, `'failed'`, `'retryQueue'`, `'finished'`, `'dead'`), or `[]` for an unknown status. |
| `JobRegistry.jobById(id)` | Searches every status and returns `{ job, status }`, or `null` if not found. |
| `JobRegistry.prune({ statuses, keep, olderThan } = {})` | Evicts terminal jobs. `statuses` defaults to `['finished', 'dead']` (unknown/non-terminal throw); `keep` (non-negative integer) keeps the N most recent; `olderThan` (non-negative ms) removes jobs with `endedAt < Date.now() - olderThan` (jobs with `endedAt === null` are never removed by it). Rules combine as a union; with neither, all jobs of the selected statuses are removed. Returns `{ finished, dead }` removed counts (`0` for unselected statuses). Pruned jobs return `null` from `jobById` / `retryJob`. See [Job Lifecycle](./job-lifecycle.md#pruning-terminal-jobs). |
| `JobRegistry.stats()` | `{ enqueued, processing, failed, retryQueue, finished, dead, total, pruned }` — per-status in-memory counts, `total` (`dead + finished`), and cumulative `pruned: { finished, dead }` evictions (reset by `clearQueues()`). |

## `Worker`

Pulls one assigned `Job` at a time and runs it, reporting the outcome back to the registries.

| Member | Description |
|--------|-------------|
| `constructor({ id, jobRegistry, workersRegistry, loggerFactory, onWorkerIdle })` | `loggerFactory` is a `({ workerId, jobId }) => logger` function; the returned logger must expose `debug`/`info`/`warn`/`error`. `onWorkerIdle` is an optional `() => void` (default no-op) called with no arguments after `setIdle`, on both success and failure; if it throws, the error is logged once at `warn` and `perform()` still resolves. |
| `assign(job)` | Assigns a `Job` to this worker. |
| `async perform()` | Runs the assigned job (throws synchronously if none is assigned). On success calls `jobRegistry.finish(job)`; on error, logs it via `logContext.error` and calls `jobRegistry.fail(job)`. In both cases, clears the assignment and calls `workersRegistry.setIdle(this.id)`. |

## `WorkerFactory`

Builds `Worker` instances, pre-wired with the given registries/logger factory.

| Member | Description |
|--------|-------------|
| `new WorkerFactory({ klass, attributesGenerator, jobRegistry, workersRegistry, loggerFactory, onWorkerIdle })` | `klass` defaults to the base `Worker` class; `attributesGenerator` defaults to a fresh `IdGenerator`. Every built `Worker` receives the given `jobRegistry`/`workersRegistry`/`loggerFactory`/`onWorkerIdle` (no-op default when omitted). |
| `build()` | Builds and returns a new `Worker` instance. |

## `WorkersRegistry`

Static singleton facade managing the worker pool. See [Setup](./setup.md) for building the singleton.

| Method | Description |
|--------|-------------|
| `WorkersRegistry.build(options)` | Builds the singleton. `options.quantity` sets the pool size; `options.factory` optionally injects a custom `WorkerFactory` (defaults to one built with no `loggerFactory` — inject your own `WorkerFactory` if you need worker-level logging). Throws if already built. |
| `WorkersRegistry.ensureBuild(options)` | Builds the singleton only if not already built; a pure no-op (options ignored) once built; returns the instance. |
| `WorkersRegistry.reset()` | Destroys the singleton. Use in test teardown. |
| `WorkersRegistry.initWorkers()` | Builds `quantity` workers via the factory and marks them all idle. Idempotent — calling it again after the pool is populated is a no-op. |
| `WorkersRegistry.getIdleWorker()` | Picks (and marks busy) an idle worker, or returns `null` if none are idle. |
| `WorkersRegistry.setBusy(id)` | Moves the worker with the given id from idle to busy (no-op if the id is unknown). |
| `WorkersRegistry.setIdle(id)` | Moves the worker with the given id from busy to idle (no-op if the id is unknown). |
| `WorkersRegistry.hasBusyWorker()` | Whether at least one worker is busy. |
| `WorkersRegistry.hasIdleWorker()` | Whether at least one worker is idle. |
| `WorkersRegistry.stats()` | `{ idle, busy }` counts. |

## `Engine`

Drives the main loop. See [Running the Engine](./running-the-engine.md) for the narrative version.

| Option | Description |
|--------|-------------|
| `jobRegistry` / `workersRegistry` | Optional. Default to the `JobRegistry`/`WorkersRegistry` static facades when omitted. Any object exposing the same method names works — the static facades directly, or your own instances. |
| `allocator` | Optional `WorkersAllocator`. Defaults to one built from `jobRegistry`/`workersRegistry`. |
| `sleepMs` | Milliseconds to wait between loop ticks. Defaults to `500`; a negative value disables sleeping. |
| `keepAlive` | When `true`, the loop never exits on its own — only `stop()` ends it. Defaults to `false` (the loop exits once there are no jobs and no busy workers). |
| `idleTimeoutMs` | Milliseconds of sustained idleness before `onIdleTimeout` fires. `0` (default) disables tracking. |
| `onIdleTimeout` | Callback invoked (not awaited) at most once per idle window once `idleTimeoutMs` is crossed. |

| Method | Description |
|--------|-------------|
| `async start()` | Runs the loop until it should stop (see `keepAlive`), `stop()` is called, or a `shutdown()` drain ends. Each iteration: promotes ready jobs, allocates (if not paused and jobs are ready), checks the idle timeout, then sleeps `sleepMs`. |
| `stop()` | Requests the loop exit after the current iteration completes. Immediate and non-draining. |
| `async shutdown({ timeoutMs })` | Returns `Promise<boolean>`. Stops promotion, allocation and idle tracking, then waits until no worker is busy (`true`) or `timeoutMs` elapses (`false`). `start()` resolves in both cases. In-flight jobs are never cancelled and queued jobs are kept. `timeoutMs` omitted or `0` resolves immediately with the current pool state; repeated calls share one promise. See [Graceful shutdown](./running-the-engine.md#graceful-shutdown). |
| `pause()` / `resume()` | Suspend/resume job allocation without exiting the loop. |
| `wake()` | Ends the current sleep immediately in any mode (running, paused, draining); if called mid-tick, the next sleep returns immediately once. No-op when the loop is not running; never throws or starts the loop. See [Waking the loop early](./running-the-engine.md#waking-the-loop-early). |
| `get status` | One of `'idle'`, `'running'`, `'paused'`, `'draining'`, `'stopping'`, `'stopped'`, `'crashed'`. While running, precedence is `stopping` > `draining` > `paused` > `running`; after exit it is `crashed` if the last run threw, else `stopped`. |
| `snapshot()` | Fresh plain object per call: `{ status, startedAt, stoppedAt, lastTickAt, lastError }`. Timestamps are epoch ms (`number`) or `null` (`stoppedAt` is `null` while running or never run); `lastError` is `{ name, message, at }` or `null`, and survives a restart until a new crash overwrites it. |

| Event | Description |
|-------|-------------|
| `'crash'` | Emitted via `engine.on('crash', (error) => ...)` with the original `Error` when the loop throws. `start()` still rejects with the same error; a throwing listener never replaces the rejection reason. |

See [Observing engine status](./running-the-engine.md#observing-engine-status).

## `WorkersAllocator`

Matches ready jobs to idle workers. Built automatically by `Engine` unless you inject your own via the `allocator` option.

| Member | Description |
|--------|-------------|
| `new WorkersAllocator({ jobRegistry, workersRegistry })` | Same injection contract as `Engine` — accepts the static facades or equivalent instances. |
| `allocate()` | Loops, allocating one job to one idle worker at a time, until either `workersRegistry.hasIdleWorker()` or `jobRegistry.hasReadyJob()` is false. |
| `_allocateNext()` *(internal)* | Picks one job via `jobRegistry.pick()`; if no idle worker is available, re-queues the picked job via `jobRegistry.requeue(job)` rather than losing it. Otherwise assigns the job to the worker and calls `worker.perform()` (fire-and-forget — the allocator doesn't await job completion; `Worker#perform()` reports back to the registries itself). |

## Collections

`IdentifyableCollection`, `Queue`, and `SortedCollection` are the small building blocks used internally by the registries. See [Collections](./collections.md) for the full method tables and standalone usage examples — most consumers only need `Job`, `JobFactory`, `JobRegistry`, `Worker`, `WorkerFactory`, `WorkersRegistry`, and `Engine`.

[← Back to How to Use deku-swarm](../HOW_TO_USE_DEKU_SWARM.md)
