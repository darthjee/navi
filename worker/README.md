# deku-swarm

Queue-based worker pool for Node.js, with cooldown-based automatic retry and support for job chaining.

`deku-swarm` is the generic queue-and-pool engine originally built for [Navi](https://github.com/darthjee/navi)'s cache-warming job processing, extracted into a standalone, reusable package. It has no domain knowledge of HTTP requests or caching — you subclass `Job` with your own `perform()` logic, and `deku-swarm` takes care of queuing, worker allocation, cooldown-based retry, and dead-lettering.

---

## Installation

```bash
npm install deku-swarm
```

## Library usage

```js
import { Job, JobFactory, JobRegistry, WorkerFactory, WorkersRegistry, Engine } from 'deku-swarm';

// 1. Define a Job subclass with your own work
class GreetJob extends Job {
  constructor({ id, name }) {
    super({ id });
    this.name = name;
  }

  async perform(logger) {
    logger.info(`Hello, ${this.name}!`);
    // A job's perform() can enqueue further jobs — this is how job chaining works.
    // JobRegistry.enqueue('greet', { name: 'again' });
  }
}

// 2. Register a factory that builds GreetJob instances under a lookup key
JobFactory.build('greet', { klass: GreetJob });

// 3. Build the singleton registries (once per process)
JobRegistry.build({ cooldown: 2000, maxRetries: 3 });
WorkersRegistry.build({
  quantity: 5,
  factory: new WorkerFactory({ jobRegistry: JobRegistry, workersRegistry: WorkersRegistry }),
});
WorkersRegistry.initWorkers();

// 4. Enqueue work
JobRegistry.enqueue('greet', { name: 'World' });

// 5. Run the engine until every job is finished/dead and every worker is idle
const engine = new Engine({ sleepMs: 500 });
await engine.start();
```

`Engine`'s `jobRegistry` / `workersRegistry` are optional — omitting them (as above) wires the `JobRegistry` / `WorkersRegistry` static facades automatically. Pass them, or your own instances, only when you want the dependency injection visible at the call site.

`JobRegistry` and `WorkersRegistry` are static singleton facades: `build()` once at startup, `reset()` between test examples. Both `Engine` and `WorkerFactory` accept either the static facade classes or plain instances exposing the same method names — pass whichever fits your application's dependency-injection style. When a bootstrap path can run more than once per process, use `JobRegistry.ensureBuild()` / `WorkersRegistry.ensureBuild()` instead of `build()`.

### `Job`

Abstract base class for every unit of work. Subclass it and implement `perform`.

| Member | Description |
|--------|-------------|
| `constructor({ id })` | `id` is the job's unique identifier. |
| `async perform(logContext)` | Must be overridden. Throwing marks the job as failed; resolving marks it finished. |
| `applyCooldown(ms)` | Marks the job not-ready-for-retry until `ms` milliseconds from now. Called internally on failure. |
| `isReadyBy(currentTime)` | Whether the job's cooldown has elapsed as of `currentTime`. |
| `get maxRetries()` | Maximum retry count for this job class. Defaults to `3`; override to customize per subclass. |
| `exhausted(maxRetries)` | Whether the job has used up its retry attempts. |

### `Worker`

Pulls one assigned `Job` at a time and runs it, reporting the outcome back to the registries.

| Member | Description |
|--------|-------------|
| `constructor({ id, jobRegistry, workersRegistry, loggerFactory })` | `loggerFactory` is a `({ workerId, jobId }) => logger` function; the returned logger must expose `debug/info/warn/error`. |
| `assign(job)` | Assigns a `Job` to this worker. |
| `async perform()` | Runs the assigned job, then reports `finish`/`fail` to `jobRegistry` and sets itself idle on `workersRegistry`. |

### `JobFactory` / `WorkerFactory`

Build instances of `Job`/`Worker` subclasses with generated unique IDs.

| Member | Description |
|--------|-------------|
| `new JobFactory({ klass, attributesGenerator, attributes })` | `klass` defaults to the base `Job` class; `attributes` are merged into every built job (e.g. shared dependencies). |
| `JobFactory.build(name, options)` | Creates a `JobFactory` and registers it under `name` for lookup by `JobRegistry.enqueue(name, params)`. |
| `JobFactory.get(name)` | Retrieves a previously registered factory. |
| `JobFactory.reset()` | Clears all registered factories. Intended for test teardown. |
| `new WorkerFactory({ klass, attributesGenerator, jobRegistry, workersRegistry, loggerFactory })` | `klass` defaults to the base `Worker` class. Injects the given registries/logger factory into every built worker. |

### `JobRegistry`

Static singleton facade managing the job queues: enqueued, processing, failed (cooling down), retry, finished, and dead.

| Method | Description |
|--------|-------------|
| `JobRegistry.build(options)` | Builds the singleton. `options.cooldown` (ms, default `5000`) and `options.maxRetries` (default `3`) control retry behavior. Throws if already built. |
| `JobRegistry.ensureBuild(options)` | Builds the singleton only if not already built; a pure no-op (options ignored) once built. Returns the instance. |
| `JobRegistry.reset()` | Destroys the singleton. Use in test teardown. |
| `JobRegistry.enqueue(factoryKey, params)` | Builds a job via the named `JobFactory` and pushes it onto the enqueued queue. |
| `JobRegistry.pick()` | Removes and returns the next ready job, moving it to processing. Used internally by `WorkersAllocator`. |
| `JobRegistry.finish(job)` / `JobRegistry.fail(job)` | Reports a job outcome. A failed job is either re-queued with cooldown applied or moved to dead once `exhausted()`. |
| `JobRegistry.requeue(job)` | Moves a job from processing back to enqueued (e.g. no idle worker was available). |
| `JobRegistry.retryJob(id)` | Manually moves a failed or dead job straight into the retry queue, bypassing cooldown. |
| `JobRegistry.promoteReadyJobs()` | Moves jobs whose cooldown has elapsed from failed into the retry queue. Called each `Engine` tick. |
| `JobRegistry.clearQueues()` | Clears enqueued/retry/failed/finished/dead, leaving processing untouched. |
| `JobRegistry.hasJob()` / `JobRegistry.hasReadyJob()` | Whether any jobs exist at all / are immediately pickable. |
| `JobRegistry.jobsByStatus(status)` / `JobRegistry.jobById(id)` | Introspection helpers, e.g. for a monitoring UI. |
| `JobRegistry.stats()` | `{ enqueued, processing, failed, retryQueue, finished, dead, total }` counts. |

### `WorkersRegistry`

Static singleton facade managing the worker pool.

| Method | Description |
|--------|-------------|
| `WorkersRegistry.build(options)` | Builds the singleton. `options.quantity` sets the pool size; `options.factory` optionally injects a custom `WorkerFactory`. Throws if already built. |
| `WorkersRegistry.ensureBuild(options)` | Builds the singleton only if not already built; a pure no-op (options ignored, workers not initialized) once built. Returns the instance. |
| `WorkersRegistry.reset()` | Destroys the singleton. Use in test teardown. |
| `WorkersRegistry.initWorkers()` | Builds `quantity` workers and marks them idle. Idempotent — only the first call populates the pool; a later call once workers exist is a no-op. |
| `WorkersRegistry.getIdleWorker()` | Picks (and marks busy) an idle worker, or returns `null`. |
| `WorkersRegistry.setBusy(id)` / `WorkersRegistry.setIdle(id)` | Moves a worker between the busy/idle collections. |
| `WorkersRegistry.hasBusyWorker()` / `WorkersRegistry.hasIdleWorker()` | Pool-state checks. |
| `WorkersRegistry.stats()` | `{ idle, busy }` counts. |

### `WorkersAllocator`

Matches ready jobs to idle workers. `allocate()` loops `pick()`/`getIdleWorker()` until either queue is exhausted, re-queuing a picked job if no worker is free. Built automatically by `Engine` unless you inject your own via `allocator`.

### `Engine`

Drives the main loop: promotes cooling-down jobs, allocates ready jobs to idle workers, and (optionally) watches for sustained idleness.

| Option | Description |
|--------|-------------|
| `jobRegistry` / `workersRegistry` | Optional. Default to the `JobRegistry` / `WorkersRegistry` static facades when omitted. Any object exposing the same method names works — the static facades directly, or your own instances for explicit dependency injection. |
| `allocator` | Optional `WorkersAllocator`. Defaults to one built from `jobRegistry`/`workersRegistry`. |
| `sleepMs` | Milliseconds to wait between loop ticks. Defaults to `500`; a negative value disables sleeping (useful in tests). |
| `keepAlive` | When `true`, the loop never exits on its own — only `stop()` ends it. Use this when a long-lived process (e.g. a web UI) needs the engine to wait for new work. Defaults to `false`, meaning the loop exits once there are no jobs and no busy workers. |
| `idleTimeoutMs` | Milliseconds of sustained idleness (no jobs, no busy workers) before `onIdleTimeout` fires. `0` (default) disables tracking. |
| `onIdleTimeout` | Callback invoked at most once per idle window once `idleTimeoutMs` is crossed. |

| Method | Description |
|--------|-------------|
| `async start()` | Runs the loop until it should stop (see `keepAlive` above) or `stop()` is called. |
| `stop()` | Requests the loop to exit after the current iteration. |
| `pause()` / `resume()` | Suspend/resume job allocation without exiting the loop. |

### Collections

`IdentifyableCollection`, `Queue`, and `SortedCollection` are the small building blocks used internally by the registries (lookup-by-id storage, FIFO push/pick, and cooldown-ordered storage, respectively). They're exported for advanced use cases (e.g. building a custom registry), but most consumers only need `Job`, `JobFactory`, `JobRegistry`, `WorkerFactory`, `WorkersRegistry`, and `Engine`.

---

## Source & Documentation

GitHub repository: [darthjee/navi](https://github.com/darthjee/navi) — `deku-swarm` lives under [`worker/`](https://github.com/darthjee/navi/tree/main/worker).
