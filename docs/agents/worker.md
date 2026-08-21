# Worker Subsystem

## Overview

The worker subsystem is the queue-and-pool machinery that turns enqueued `Job`s into executed work: a fixed-size pool of `Worker`s pulled from `WorkersRegistry`, a set of typed job queues managed by `JobRegistry`, and an `Engine` loop that ties the two together via `WorkersAllocator`. It ships as a standalone, generic npm package — `deku-swarm` (`worker/`) — with no domain knowledge of HTTP, caching, or resources; `source/` consumes it as a regular dependency (`"deku-swarm": "file:../worker"` in `source/package.json`, `import { ... } from 'deku-swarm'` everywhere it's used). For a narrative, step-by-step account of the same loop from Navi's side, see [Engine and Workers](flow/engine-and-workers.md). This document instead gives a class-by-class architectural reference for the package, plus a map of what stayed in Navi and how the two sides connect.

## Core classes

### `Worker` (`worker/lib/background/Worker.js`)

Executes one job at a time. `assign(job)` stores the job on the instance; `perform()` runs it under a try/catch/finally:

1. Calls the injected `loggerFactory({ workerId, jobId })` to obtain a logger-like object exposing `debug/info/warn/error`.
2. Awaits `job.perform(logger)`.
3. On success, reports `jobRegistry.finish(job)`; on error, logs it and reports `jobRegistry.fail(job)`.
4. In `finally`, clears `this.job` and calls `workersRegistry.setIdle(this.id)` unconditionally — a worker always returns to idle, whether the job succeeded or failed.

Calling `perform()` with no assigned job throws synchronously. `jobRegistry`, `workersRegistry`, and `loggerFactory` are all injected at construction time and held in private fields — `Worker` never reaches for a static singleton or a concrete logging implementation itself, which is what keeps the package generic. Navi wires its own `LogContext` in as the logger factory (see "How Navi wires it up" below); a consumer with no logging needs at all can pass any function returning an object with those four methods.

### `WorkerFactory` (`worker/lib/background/WorkerFactory.js`)

Extends the generic `Factory` base class (`worker/lib/Factory.js` — an implementation detail, not documented further here). Configured with a `klass` (default `Worker`), an `attributesGenerator` (default `IdGenerator`, producing a unique `id` per build), and the same `jobRegistry`/`workersRegistry`/`loggerFactory` triple `Worker` itself needs. `build()` calls `super.build({ jobRegistry, workersRegistry, loggerFactory })`, so every `Worker` it produces is pre-wired with everything the factory itself was constructed with.

### `WorkersRegistry` (`worker/lib/background/WorkersRegistry.js`)

Static singleton facade. `build(options)` constructs and stores a `WorkersRegistryInstance`, throwing if already built; `reset()` clears it (test teardown). Every other static method (`initWorkers`, `setBusy`, `setIdle`, `hasBusyWorker`, `hasIdleWorker`, `getIdleWorker`, `stats`) delegates to the stored instance, throwing if `build()` hasn't been called yet.

### `WorkersRegistryInstance` (`worker/lib/background/WorkersRegistryInstance.js`)

Owns the actual worker pool via three `IdentifyableCollection`s: `#workers` (all of them), `#busy`, `#idle`. Constructed with a `quantity` and an optional injected `factory` (defaults to a fresh `WorkerFactory({ jobRegistry, workersRegistry })` — note the default factory does *not* set up a `loggerFactory`; callers that need worker-level logging must inject their own `WorkerFactory` with one, as Navi does).

- `initWorkers()` — builds `quantity` workers via the factory, pushing each into both `#workers` and `#idle` (every worker starts idle).
- `setBusy(id)` / `setIdle(id)` — look the worker up in `#workers`, then move it between `#idle` and `#busy` (no-op if the id is unknown).
- `getIdleWorker()` — returns `null` if `#idle` is empty; otherwise takes the first idle worker (`#idle.byIndex(0)`), calls `setBusy` on its id, and returns it.
- `hasBusyWorker()` / `hasIdleWorker()` — delegate to `hasAny()` on the respective collection; these back the Engine loop's continuation and allocation checks.
- `stats()` — returns `{ idle, busy }` counts, consumed by the web UI's stats endpoint.

### `Job` (`worker/lib/background/Job.js`, abstract base)

Constructed with just an `id`; tracks two private fields: `#attempts` (starts at 0) and `#readyBy` (starts at 0, an absolute epoch-ms timestamp).

- `perform()` — throws unconditionally; every concrete subclass must override it.
- `applyCooldown(ms)` — sets `#readyBy = Date.now() + ms` (a negative `ms` marks the job immediately ready).
- `isReadyBy(currentTime)` — `currentTime >= readyBy`.
- `get maxRetries()` — defaults to `3`; subclasses override the getter to change it (e.g. to `1`, meaning the first failure already exhausts the job — see "Job subclasses" below).
- `exhausted(maxRetries = this.maxRetries)` — `#attempts >= maxRetries`.
- `_fail(error)` *(protected)* — increments `#attempts`, stores `this.lastError = error`, then re-throws. Subclasses call this from their own `perform()` error paths before the error propagates up to `Worker#perform()`.
- `get _attempts()` *(protected)* — read access to the attempt counter, used by tests and subclasses.

### `JobFactory` (`worker/lib/background/JobFactory.js`)

Also extends `Factory`. Unlike `WorkerFactory`, it is both an instance class and a static registry: `JobFactory.build(name, attributes)` constructs a `JobFactory` and stores it in an internal `Map` under `name` (via `JobFactory.registry(name, factory)`); `JobFactory.get(name)` retrieves it; `JobFactory.reset()` clears the map (test isolation).

As an instance, a `JobFactory` is configured with `klass` (default: the generic `Job` base class — Navi's registrations always pass an explicit `klass`, since the abstract base can't be instantiated meaningfully on its own), `attributesGenerator` (default `IdGenerator`), and `attributes` — a fixed object merged into every build. Its overridden `build(params)` calls `super.build({ ...this.#attributes, ...params })`, so constructor-time attributes (e.g. an injected `clients` map) are always present alongside whatever params the caller supplies per job.

### `JobRegistry` (`worker/lib/background/JobRegistry.js`)

Static singleton facade over `JobRegistryInstance`, following the exact same `build`/`reset`/throw-if-unbuilt pattern as `WorkersRegistry`. Every instance method below is exposed as a same-named static method.

### `JobRegistryInstance` (`worker/lib/background/JobRegistryInstance.js`)

The actual job-queue state, held across six internal collections:

| Field | Type | Role |
|---|---|---|
| `#enqueued` | `Queue` | Jobs ready to be picked, FIFO |
| `#retryQueue` | `Queue` | Jobs promoted from `#failed` once their cooldown elapsed, FIFO |
| `#failed` | `SortedCollection` (sorted by `job.readyBy`) | Jobs cooling down after a non-fatal failure |
| `#processing` | `IdentifyableCollection` | Jobs currently assigned to a worker |
| `#finished` | `IdentifyableCollection` | Jobs that completed successfully |
| `#dead` | `IdentifyableCollection` | Jobs that exhausted their retries |

Constructed with an optional `cooldown` (default `5000` ms) and `maxRetries` (default `3`) — Navi passes both in at boot from `workersConfig` (see "How Navi wires it up" below) and they apply uniformly to every job unless the job's own `get maxRetries()` override changes the exhaustion check.

- `enqueue(factoryKey, params = {})` — `JobFactory.get(factoryKey).build(params)`, then pushes the result onto `#enqueued`.
- `pick()` — takes the first job from `#enqueued`, falling back to `#retryQueue` if empty; if a job was found, pushes it onto `#processing` before returning it.
- `fail(job)` — removes the job from `#processing`; if `job.exhausted(this.#maxRetries)`, pushes it to `#dead`; otherwise calls `job.applyCooldown(this.#cooldown)` and pushes it to `#failed`.
- `finish(job)` — removes the job from `#processing`, pushes it to `#finished`.
- `requeue(job)` — removes the job from `#processing`, pushes it back onto `#enqueued` (used when a job was picked but no idle worker was available — see `WorkersAllocator` below).
- `retryJob(id)` — manual retry trigger (backs Navi's job-retry web/API route): searches `#failed` first, rebuilding it without the matching job and pushing it onto `#retryQueue`; if not found there, checks `#dead` and moves it the same way. Returns the job, or `null` if it wasn't in either collection.
- `promoteReadyJobs()` — called once per Engine tick; splits `#failed` via `upTo(now)` / `after(now)`, keeps the still-cooling jobs as the new `#failed`, and pushes every ready job onto `#retryQueue`.
- `clearQueues()` — resets `#enqueued`, `#retryQueue`, `#failed`, `#finished`, and `#dead` to empty; leaves `#processing` untouched (used by Navi's web UI "reset" action, which must not lose in-flight jobs).
- `hasJob()` — `true` if any of `#enqueued`, `#failed`, or `#retryQueue` is non-empty; drives the Engine's non-`keepAlive` loop continuation together with `WorkersRegistry.hasBusyWorker()`.
- `hasReadyJob()` — `true` if `#enqueued` or `#retryQueue` is non-empty (excludes `#failed`, which is still cooling); drives whether the Engine allocates on a given tick.
- `jobsByStatus(status)` / `jobById(id)` — read-only lookups over the six collections, keyed by status name (`'enqueued'`, `'processing'`, `'failed'`, `'retryQueue'`, `'finished'`, `'dead'`); back Navi's web UI job list/detail views.
- `stats()` — returns per-status counts plus `total` (`dead + finished`); consumed by Navi's web UI stats endpoint and by `FailureChecker`.

## Engine and allocation

### `Engine` (`worker/lib/services/Engine.js`)

Owns the main loop. Constructed with `jobRegistry`/`workersRegistry` (injected — see below), an `allocator` (default `new WorkersAllocator({ jobRegistry, workersRegistry })`), `sleepMs` (default `500`; negative disables sleeping, used in tests), `keepAlive` (default `false` — Navi passes `true` when the web UI is present, so the loop never exits on its own), `idleTimeoutMs` (default `0`, disabling idle tracking), and an `onIdleTimeout` callback.

`start()` loops while not stopped and `#shouldContinue()`:

1. `jobRegistry.promoteReadyJobs()`.
2. If not paused and `jobRegistry.hasReadyJob()`, call `this.allocator.allocate()`.
3. `#checkIdleTimeout()`.
4. `await #sleep()`.

`#shouldContinue()` is `keepAlive || (jobRegistry.hasJob() || workersRegistry.hasBusyWorker())` — in one-shot (non-`keepAlive`) mode the loop naturally exits once every job has finished or died and every worker is idle. `stop()` sets a flag checked at the top of the next iteration (the current iteration always completes first); `pause()`/`resume()` toggle a flag that skips allocation without exiting the loop, so promotion and idle-timeout tracking keep running while paused. `#checkIdleTimeout()` tracks how long `#continueAllocating()` (jobs-or-busy-workers) has been false, firing `onIdleTimeout` (without awaiting it) at most once per idle window — any activity resets the window and re-arms the timeout.

`jobRegistry`/`workersRegistry` are plain injected references — `Engine` accepts either the static facade classes (`JobRegistry`/`WorkersRegistry`) or any instance exposing the same method names, since it only ever calls methods on whatever it was handed. Navi passes the static facades themselves (see "How Navi wires it up" below).

### `WorkersAllocator` (`worker/lib/services/WorkersAllocator.js`)

Constructed with `{ jobRegistry, workersRegistry }` — same injection contract as `Engine`, no static calls of its own. `allocate()` loops `_allocateNext()` while `_canAllocate()` (`workersRegistry.hasIdleWorker() && jobRegistry.hasReadyJob()`). `_allocateNext()` picks one job via `jobRegistry.pick()`, returning immediately if none is available; then asks `workersRegistry.getIdleWorker()` — if that returns `null` (a race between the `_canAllocate()` check and this call, or simply pool exhaustion mid-loop), the job is pushed back via `jobRegistry.requeue(job)` rather than lost. Otherwise `_allocateWorkerToJob(worker, job)` calls `worker.assign(job)` then `worker.perform()` — fire-and-forget; the allocator does not await job completion, since `Worker#perform()` reports back to the registries itself.

## Collections (`worker/lib/collections/`)

All three extend the abstract `Collection` base class, which supplies `hasAny()` (`size() > 0`) and a default `findById()` in terms of `list()`.

- **`IdentifyableCollection`** — items keyed by `item.id` in a plain object. `push()`, `remove(id)`, `get(id)`, `has(id)`, `findById(id)` (overrides the base default with a direct key lookup), `byIndex(index)`, `list()` (`Object.values`), `size()` (memoized, invalidated on `push`/`remove`). Backs `WorkersRegistryInstance`'s `#workers`/`#busy`/`#idle` and `JobRegistryInstance`'s `#finished`/`#dead`/`#processing`.
- **`Queue`** — plain FIFO array. `push()` appends, `pick()` shifts the first item, `size()`, `list()` returns a shallow copy preserving order. Backs `JobRegistryInstance`'s `#enqueued` and `#retryQueue`.
- **`SortedCollection`** — maintains elements ordered by a required `sortBy` function, using a deferred/lazy-flush strategy: new items land in an unsorted buffer (`push()` is O(1)); any read operation first sorts the buffer (O(m log m)) and merges it into the already-sorted array via a two-pointer merge (O(n + m)). Range queries (`after`, `from`, `before`, `upTo`) use binary search (`SortedArraySearcher`) against the flushed sorted array — O(log n) plus the slice. Backs `JobRegistryInstance`'s `#failed`, sorted by `job.readyBy`; `promoteReadyJobs()` uses `upTo(now)`/`after(now)` to split ready-vs-cooling jobs without a full scan.

## Public API (`worker/lib/index.js`)

`deku-swarm` re-exports exactly these classes: `Worker`, `WorkerFactory`, `WorkersRegistry`, `Job`, `JobFactory`, `JobRegistry`, `Engine`, `WorkersAllocator`, `IdentifyableCollection`, `Queue`, `SortedCollection`. `Factory`, `Collection`, `SortedArrayMerger`, `SortedArraySearcher`, `IdGenerator`, and `UUidGenerator` are internal implementation details, not part of the public surface.

## How Navi wires it up

`source/lib/services/ApplicationInstance.js`'s `#initRegistries()` registers Navi's five job-class factories with `JobFactory.build(name, { klass, attributes })` (see "Job factory registration" below — every registration passes an explicit `klass`, since `JobFactory`'s own default is the generic base `Job`), then builds `JobRegistry` (with `cooldown`/`maxRetries` from `workersConfig`) and `WorkersRegistry` (with `quantity` and the other `workersConfig` fields, plus a `WorkerFactory` injected with `jobRegistry: JobRegistry`, `workersRegistry: WorkersRegistry`, and a `loggerFactory`), before calling `WorkersRegistry.initWorkers()`. The `loggerFactory` is a small closure Navi builds itself, wrapping its own `LogContext`:

```js
const loggerFactory = ({ workerId, jobId }) => new LogContext({ workerId, jobId });
```

`ApplicationInstance.buildEngine()` then constructs the `Engine` for a run, passing `jobRegistry: JobRegistry`, `workersRegistry: WorkersRegistry`, plus `sleepMs`/`keepAlive`/`idleTimeoutMs`/`onIdleTimeout` from Navi's own config and web-server state.

| Factory key | Class | `maxRetries` |
|---|---|---|
| `'ResourceRequestJob'` | `ResourceRequestJob` | 3 (default, not overridden) |
| `'Action'` | `ActionProcessingJob` | 1 (overridden — first failure exhausts) |
| `'PaginatedAction'` | `PaginatedActionProcessingJob` | 1 (overridden) |
| `'HtmlParse'` | `HtmlParseJob` | 1 (overridden) |
| `'AssetDownload'` | `AssetDownloadJob` | 3 (default, not overridden) |

## Job factory registration

| Factory key | Class | Injected `attributes` |
|---|---|---|
| `'ResourceRequestJob'` | `ResourceRequestJob` | `{ clients: config.namespaceMap }` |
| `'Action'` | `ActionProcessingJob` | *(none)* |
| `'PaginatedAction'` | `PaginatedActionProcessingJob` | *(none)* |
| `'HtmlParse'` | `HtmlParseJob` | `{ jobRegistry: JobRegistry, clientRegistry: config.namespaceMap }` |
| `'AssetDownload'` | `AssetDownloadJob` | `{ clientRegistry: config.namespaceMap }` |

## `ResourceEnqueuer` — Navi-specific, calls into the package from outside

`ApplicationInstance.enqueueFirstJobs()` simply delegates to `new ResourceEnqueuer().enqueueAll()` (`source/lib/utils/ResourceEnqueuer.js`), which resolves a namespace via `NamespaceMap.getNamespace()` (defaulting to `'default'`), discovers every parameter-free, enabled `ResourceRequest` in it via `ResourceRequestCollector.requestsNeedingNoParams()`, and enqueues each with `JobRegistry.enqueue('ResourceRequestJob', { resourceRequest, parameters: {} })` — from *outside* the worker package, using only its public `JobRegistry` facade. The same class also backs `enqueue(names)`, the by-name enqueue path used by the web API (`POST /api/config` resource enqueueing): it resolves each name against the namespace's `resourceRegistry`, skipping (and reporting, via `{ name, reason }`) any resource that's unknown (`'not_found'`), has a disabled request (`'disabled'`), or needs parameters (`'needs_params'`), rather than partially enqueueing it.

## Job subclasses (Navi-specific — not detailed here)

These are concrete `Job` implementations that live in `source/lib/jobs/`, importing the abstract `Job` base class from `deku-swarm`. Their `perform()` internals belong to Navi's request/resource-chaining domain and are out of scope for this document — see [Engine and Workers](flow/engine-and-workers.md) for the "Worker Execution" narrative and `docs/agents/architecture/source-layout.md`'s `jobs/` section for a one-line-per-class summary.

| Factory key | Class |
|---|---|
| `'ResourceRequestJob'` | `ResourceRequestJob` |
| `'Action'` | `ActionProcessingJob` |
| `'PaginatedAction'` | `PaginatedActionProcessingJob` |
| `'HtmlParse'` | `HtmlParseJob` |
| `'AssetDownload'` | `AssetDownloadJob` |

## Engine auxiliary services (Navi-specific)

These four services stay in `source/lib/services/` and currently reach into the worker package's static singletons directly, rather than through any formal listener interface `Engine` exposes — the extraction did not change this, since it was scoped to `Engine`/`WorkersAllocator`/`Worker`'s own dependency injection, not to these four:

| Service | File | Responsibility | Extraction note |
|---|---|---|---|
| `EngineEvents` | `source/lib/services/EngineEvents.js` | Static `EventEmitter`-backed bus for lifecycle transitions (`'stop'`, `'start'`, `'restart'`, `'reset'`); `emit`/`on`/`reset`. | Should become an injectable listener rather than a global bus. |
| `EngineStopService` | `source/lib/services/EngineStopService.js` | Shared logic for `PATCH /engine/stop` and `POST /api/engine/stop`: throws `ConflictError` unless `Application.isRunning()`, otherwise calls `Application.stop()`. | Navi-specific HTTP glue; not generic today. Should become an injectable listener. |
| `FailureChecker` | `source/lib/services/FailureChecker.js` | Post-run check: reads `JobRegistry.stats()`, computes the dead/total ratio, and calls `process.exit(1)` if it exceeds the configured `failureConfig.threshold`. No-op if `failureConfig` is `null` or `total === 0`. | Should become an injectable listener. |
| `RunSummary` | `source/lib/services/RunSummary.js` | Computes and formats the final run report (`percentage()`, `result()` — `'Success'`/`'Failure'` against an optional threshold, `report()` — multi-line summary string). | Should become an injectable listener. |

## What stays in Navi

- The 5 `Job` subclasses: `ResourceRequestJob`, `ActionProcessingJob`, `PaginatedActionProcessingJob`, `HtmlParseJob`, `AssetDownloadJob`
- `ResourceEnqueuer` — the dedicated Navi class that calls `JobRegistry.enqueue()` from outside the package
- `LogContext` (`source/lib/utils/logging/LogContext.js`) — Navi-specific logging, wired into `Worker` via the injected `loggerFactory` rather than imported by the package directly
- `IncrementalIdGenerator` (`source/lib/utils/generators/IncrementalIdGenerator.js`) — used by `source/lib/common/utils/logging/LogFactory.js`, outside the worker subsystem; not part of `deku-swarm`
- `EngineEvents`, `EngineStopService`, `FailureChecker`, `RunSummary` — see "Engine auxiliary services" above
- `ApplicationInstance` — orchestrates boot, registers the five job factories, builds `JobRegistry`/`WorkersRegistry`/`Engine` from `deku-swarm`

## Out of scope

- The web server, monitoring UI, frontend, and HTTP routes — see [Web Server](web-server.md) and [Frontend](frontend.md) instead.
- The generic `Factory` base class (`worker/lib/Factory.js`) — an implementation detail underlying `WorkerFactory` and `JobFactory`, not documented separately here.
