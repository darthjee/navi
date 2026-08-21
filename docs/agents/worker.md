# Worker Subsystem

## Overview

The worker subsystem is the queue-and-pool machinery that turns enqueued `Job`s into executed HTTP work: a fixed-size pool of `Worker`s pulled from `WorkersRegistry`, a set of typed job queues managed by `JobRegistry`, and an `Engine` loop that ties the two together via `WorkersAllocator`. It is designed as a cohesive, largely self-contained unit — for a narrative, step-by-step account of the same loop, see [Engine and Workers](flow/engine-and-workers.md). This document instead gives a class-by-class architectural reference and, since the long-term goal is to **extract the subsystem into a standalone package**, an explicit map of what is generic enough to ship with that package versus what is Navi-specific and stays behind.

## Core classes

### `Worker` (`source/lib/background/Worker.js`)

Executes one job at a time. `assign(job)` stores the job on the instance; `perform()` runs it under a try/catch/finally:

1. Builds a `LogContext` scoped to `{ workerId, jobId }`.
2. Awaits `job.perform(logContext)`.
3. On success, reports `jobRegistry.finish(job)`; on error, logs it and reports `jobRegistry.fail(job)`.
4. In `finally`, clears `this.job` and calls `workersRegistry.setIdle(this.id)` unconditionally — a worker always returns to idle, whether the job succeeded or failed.

Calling `perform()` with no assigned job throws synchronously. `jobRegistry` and `workersRegistry` are injected at construction time and held in private fields — a `Worker` never reaches for a static singleton itself, which is what keeps it decoupled from Navi's global state (see "Current coupling" below for where that decoupling stops).

### `WorkerFactory` (`source/lib/background/WorkerFactory.js`)

Extends the generic `Factory` base class (`source/lib/factory/Factory.js` — an implementation detail, not documented further here). Configured with a `klass` (default `Worker`) and an `attributesGenerator` (default `IdGenerator`, producing a unique `id` per build). `build()` calls `super.build({ jobRegistry, workersRegistry })`, so every `Worker` it produces is pre-wired with the same pair of registries the factory itself was constructed with.

### `WorkersRegistry` (`source/lib/background/WorkersRegistry.js`)

Static singleton facade. `build(options)` constructs and stores a `WorkersRegistryInstance`, throwing if already built; `reset()` clears it (test teardown). Every other static method (`initWorkers`, `setBusy`, `setIdle`, `hasBusyWorker`, `hasIdleWorker`, `getIdleWorker`, `stats`) delegates to the stored instance, throwing if `build()` hasn't been called yet.

### `WorkersRegistryInstance` (`source/lib/background/WorkersRegistryInstance.js`)

Owns the actual worker pool via three `IdentifyableCollection`s: `#workers` (all of them), `#busy`, `#idle`. Constructed with a `quantity` and an optional injected `factory` (defaults to a fresh `WorkerFactory({ jobRegistry, workersRegistry })`).

- `initWorkers()` — builds `quantity` workers via the factory, pushing each into both `#workers` and `#idle` (every worker starts idle).
- `setBusy(id)` / `setIdle(id)` — look the worker up in `#workers`, then move it between `#idle` and `#busy` (no-op if the id is unknown).
- `getIdleWorker()` — returns `null` if `#idle` is empty; otherwise takes the first idle worker (`#idle.byIndex(0)`), calls `setBusy` on its id, and returns it.
- `hasBusyWorker()` / `hasIdleWorker()` — delegate to `hasAny()` on the respective collection; these back the Engine loop's continuation and allocation checks.
- `stats()` — returns `{ idle, busy }` counts, consumed by the web UI's stats endpoint.

### `Job` (`source/lib/background/Job.js`, abstract base)

Constructed with just an `id`; tracks two private fields: `#attempts` (starts at 0) and `#readyBy` (starts at 0, an absolute epoch-ms timestamp).

- `perform()` — throws unconditionally; every concrete subclass must override it.
- `applyCooldown(ms)` — sets `#readyBy = Date.now() + ms` (a negative `ms` marks the job immediately ready).
- `isReadyBy(currentTime)` — `currentTime >= readyBy`.
- `get maxRetries()` — defaults to `3`; subclasses override the getter to change it (e.g. to `1`, meaning the first failure already exhausts the job — see "Job subclasses" below).
- `exhausted(maxRetries = this.maxRetries)` — `#attempts >= maxRetries`.
- `_fail(error)` *(protected)* — increments `#attempts`, stores `this.lastError = error`, then re-throws. Subclasses call this from their own `perform()` error paths before the error propagates up to `Worker#perform()`.
- `get _attempts()` *(protected)* — read access to the attempt counter, used by tests and subclasses.

### `JobFactory` (`source/lib/background/JobFactory.js`)

Also extends `Factory`. Unlike `WorkerFactory`, it is both an instance class and a static registry: `JobFactory.build(name, attributes)` constructs a `JobFactory` and stores it in an internal `Map` under `name` (via `JobFactory.registry(name, factory)`); `JobFactory.get(name)` retrieves it; `JobFactory.reset()` clears the map (test isolation).

As an instance, a `JobFactory` is configured with `klass` (default `ResourceRequestJob`), `attributesGenerator` (default `IdGenerator`), and `attributes` — a fixed object merged into every build. Its overridden `build(params)` calls `super.build({ ...this.#attributes, ...params })`, so constructor-time attributes (e.g. an injected `clients` map) are always present alongside whatever params the caller supplies per job.

### `JobRegistry` (`source/lib/background/JobRegistry.js`)

Static singleton facade over `JobRegistryInstance`, following the exact same `build`/`reset`/throw-if-unbuilt pattern as `WorkersRegistry`. Every instance method below is exposed as a same-named static method.

### `JobRegistryInstance` (`source/lib/background/JobRegistryInstance.js`)

The actual job-queue state, held across six internal collections:

| Field | Type | Role |
|---|---|---|
| `#enqueued` | `Queue` | Jobs ready to be picked, FIFO |
| `#retryQueue` | `Queue` | Jobs promoted from `#failed` once their cooldown elapsed, FIFO |
| `#failed` | `SortedCollection` (sorted by `job.readyBy`) | Jobs cooling down after a non-fatal failure |
| `#processing` | `IdentifyableCollection` | Jobs currently assigned to a worker |
| `#finished` | `IdentifyableCollection` | Jobs that completed successfully |
| `#dead` | `IdentifyableCollection` | Jobs that exhausted their retries |

Constructed with an optional `cooldown` (default `5000` ms) and `maxRetries` (default `3`) — both are passed in at boot from `workersConfig` (see "Job factory registration" below) and apply uniformly to every job unless the job's own `get maxRetries()` override changes the exhaustion check.

- `enqueue(factoryKey, params = {})` — `JobFactory.get(factoryKey).build(params)`, then pushes the result onto `#enqueued`.
- `pick()` — takes the first job from `#enqueued`, falling back to `#retryQueue` if empty; if a job was found, pushes it onto `#processing` before returning it.
- `fail(job)` — removes the job from `#processing`; if `job.exhausted(this.#maxRetries)`, pushes it to `#dead`; otherwise calls `job.applyCooldown(this.#cooldown)` and pushes it to `#failed`.
- `finish(job)` — removes the job from `#processing`, pushes it to `#finished`.
- `requeue(job)` — removes the job from `#processing`, pushes it back onto `#enqueued` (used when a job was picked but no idle worker was available — see `WorkersAllocator` below).
- `retryJob(id)` — manual retry trigger (backs the job-retry web/API route): searches `#failed` first, rebuilding it without the matching job and pushing it onto `#retryQueue`; if not found there, checks `#dead` and moves it the same way. Returns the job, or `null` if it wasn't in either collection.
- `promoteReadyJobs()` — called once per Engine tick; splits `#failed` via `upTo(now)` / `after(now)`, keeps the still-cooling jobs as the new `#failed`, and pushes every ready job onto `#retryQueue`.
- `clearQueues()` — resets `#enqueued`, `#retryQueue`, `#failed`, `#finished`, and `#dead` to empty; leaves `#processing` untouched (used by the web UI's "reset" action, which must not lose in-flight jobs).
- `hasJob()` — `true` if any of `#enqueued`, `#failed`, or `#retryQueue` is non-empty; drives the Engine's non-`keepAlive` loop continuation together with `WorkersRegistry.hasBusyWorker()`.
- `hasReadyJob()` — `true` if `#enqueued` or `#retryQueue` is non-empty (excludes `#failed`, which is still cooling); drives whether the Engine allocates on a given tick.
- `jobsByStatus(status)` / `jobById(id)` — read-only lookups over the six collections, keyed by status name (`'enqueued'`, `'processing'`, `'failed'`, `'retryQueue'`, `'finished'`, `'dead'`); back the web UI's job list/detail views.
- `stats()` — returns per-status counts plus `total` (`dead + finished`); consumed by the web UI's stats endpoint and by `FailureChecker`.

## Engine and allocation

### `Engine` (`source/lib/services/Engine.js`)

Owns the main loop. Constructed with an `allocator` (default `new WorkersAllocator()`), `sleepMs` (default `500`; negative disables sleeping, used in tests), `keepAlive` (default `false` — `true` when the web UI is present, so the loop never exits on its own), `idleTimeoutMs` (default `0`, disabling idle tracking), and an `onIdleTimeout` callback.

`start()` loops while not stopped and `#shouldContinue()`:

1. `JobRegistry.promoteReadyJobs()`.
2. If not paused and `JobRegistry.hasReadyJob()`, call `this.allocator.allocate()`.
3. `#checkIdleTimeout()`.
4. `await #sleep()`.

`#shouldContinue()` is `keepAlive || (JobRegistry.hasJob() || WorkersRegistry.hasBusyWorker())` — in one-shot (non-`keepAlive`) mode the loop naturally exits once every job has finished or died and every worker is idle. `stop()` sets a flag checked at the top of the next iteration (the current iteration always completes first); `pause()`/`resume()` toggle a flag that skips allocation without exiting the loop, so promotion and idle-timeout tracking keep running while paused. `#checkIdleTimeout()` tracks how long `#continueAllocating()` (jobs-or-busy-workers) has been false, firing `onIdleTimeout` (without awaiting it) at most once per idle window — any activity resets the window and re-arms the timeout.

### `WorkersAllocator` (`source/lib/services/WorkersAllocator.js`)

Stateless — no constructor parameters. `allocate()` loops `_allocateNext()` while `_canAllocate()` (`WorkersRegistry.hasIdleWorker() && JobRegistry.hasReadyJob()`). `_allocateNext()` picks one job via `JobRegistry.pick()`, returning immediately if none is available; then asks `WorkersRegistry.getIdleWorker()` — if that returns `null` (a race between the `_canAllocate()` check and this call, or simply pool exhaustion mid-loop), the job is pushed back via `JobRegistry.requeue(job)` rather than lost. Otherwise `_allocateWorkerToJob(worker, job)` calls `worker.assign(job)` then `worker.perform()` — fire-and-forget; the allocator does not await job completion, since `Worker#perform()` reports back to the registries itself.

## Collections (`source/lib/utils/collections/`)

All three extend the abstract `Collection` base class, which supplies `hasAny()` (`size() > 0`) and a default `findById()` in terms of `list()`.

- **`IdentifyableCollection`** — items keyed by `item.id` in a plain object. `push()`, `remove(id)`, `get(id)`, `has(id)`, `findById(id)` (overrides the base default with a direct key lookup), `byIndex(index)`, `list()` (`Object.values`), `size()` (memoized, invalidated on `push`/`remove`). Backs `WorkersRegistryInstance`'s `#workers`/`#busy`/`#idle` and `JobRegistryInstance`'s `#finished`/`#dead`/`#processing`.
- **`Queue`** — plain FIFO array. `push()` appends, `pick()` shifts the first item, `size()`, `list()` returns a shallow copy preserving order. Backs `JobRegistryInstance`'s `#enqueued` and `#retryQueue`.
- **`SortedCollection`** — maintains elements ordered by a required `sortBy` function, using a deferred/lazy-flush strategy: new items land in an unsorted buffer (`push()` is O(1)); any read operation first sorts the buffer (O(m log m)) and merges it into the already-sorted array via a two-pointer merge (O(n + m)). Range queries (`after`, `from`, `before`, `upTo`) use binary search (`SortedArraySearcher`) against the flushed sorted array — O(log n) plus the slice. Backs `JobRegistryInstance`'s `#failed`, sorted by `job.readyBy`; `promoteReadyJobs()` uses `upTo(now)`/`after(now)` to split ready-vs-cooling jobs without a full scan.

## Engine auxiliary services

These four services currently reach into the worker subsystem's static singletons or into Navi's `Application`/`config` layer directly, which is why they are called out separately: **the Engine should eventually support a generic injectable listener mechanism** so each of them can be attached by Navi from the outside, without any of them needing to live inside the extracted worker package.

| Service | File | Responsibility | Extraction note |
|---|---|---|---|
| `EngineEvents` | `source/lib/services/EngineEvents.js` | Static `EventEmitter`-backed bus for lifecycle transitions (`'stop'`, `'start'`, `'restart'`, `'reset'`); `emit`/`on`/`reset`. | Should become an injectable listener rather than a global bus. |
| `EngineStopService` | `source/lib/services/EngineStopService.js` | Shared logic for `PATCH /engine/stop` and `POST /api/engine/stop`: throws `ConflictError` unless `Application.isRunning()`, otherwise calls `Application.stop()`. | Navi-specific HTTP glue; not generic today. Should become an injectable listener. |
| `FailureChecker` | `source/lib/services/FailureChecker.js` | Post-run check: reads `JobRegistry.stats()`, computes the dead/total ratio, and calls `process.exit(1)` if it exceeds the configured `failureConfig.threshold`. No-op if `failureConfig` is `null` or `total === 0`. | Should become an injectable listener. |
| `RunSummary` | `source/lib/services/RunSummary.js` | Computes and formats the final run report (`percentage()`, `result()` — `'Success'`/`'Failure'` against an optional threshold, `report()` — multi-line summary string). | Should become an injectable listener. |

## `ResourceEnqueuer` — already extracted

Unlike the services above, this extraction has already happened. `ApplicationInstance.enqueueFirstJobs()` simply delegates to `new ResourceEnqueuer().enqueueAll()` (`source/lib/utils/ResourceEnqueuer.js`), which resolves a namespace via `NamespaceMap.getNamespace()` (defaulting to `'default'`), discovers every parameter-free, enabled `ResourceRequest` in it via `ResourceRequestCollector.requestsNeedingNoParams()`, and enqueues each with `JobRegistry.enqueue('ResourceRequestJob', { resourceRequest, parameters: {} })` — from *outside* the worker subsystem. The same class also backs `enqueue(names)`, the by-name enqueue path used by the web API (`POST /api/config` resource enqueueing): it resolves each name against the namespace's `resourceRegistry`, skipping (and reporting, via `{ name, reason }`) any resource that's unknown (`'not_found'`), has a disabled request (`'disabled'`), or needs parameters (`'needs_params'`), rather than partially enqueueing it.

`ResourceEnqueuer` is the dedicated Navi-specific class that owns first-job enqueueing; no further extraction work is needed for this piece.

## Job subclasses (Navi-specific — not detailed here)

These are concrete `Job` implementations that stay in Navi when the worker package is extracted; the abstract `Job` base class goes with the package, these subclasses do not. Their `perform()` internals belong to Navi's request/resource-chaining domain and are out of scope for this document — see [Engine and Workers](flow/engine-and-workers.md) for the "Worker Execution" narrative and `docs/agents/architecture/source-layout.md`'s `jobs/` section for a one-line-per-class summary.

| Factory key | Class | `maxRetries` |
|---|---|---|
| `'ResourceRequestJob'` | `ResourceRequestJob` | 3 (default, not overridden) |
| `'Action'` | `ActionProcessingJob` | 1 (overridden — first failure exhausts) |
| `'PaginatedAction'` | `PaginatedActionProcessingJob` | 1 (overridden) |
| `'HtmlParse'` | `HtmlParseJob` | 1 (overridden) |
| `'AssetDownload'` | `AssetDownloadJob` | 3 (default, not overridden) |

## Job factory registration

During boot, `ApplicationInstance.#initRegistries()` (`source/lib/services/ApplicationInstance.js`) registers the five factories above with `JobFactory.build(name, attributes)`, then builds `JobRegistry` (with `cooldown`/`maxRetries` from `workersConfig`) and `WorkersRegistry` (with `quantity` and the other `workersConfig` fields, plus injected `jobRegistry`/`workersRegistry` references), before calling `WorkersRegistry.initWorkers()`:

| Factory key | Class | Injected `attributes` |
|---|---|---|
| `'ResourceRequestJob'` | `ResourceRequestJob` (default `klass`) | `{ clients: config.namespaceMap }` |
| `'Action'` | `ActionProcessingJob` | *(none)* |
| `'PaginatedAction'` | `PaginatedActionProcessingJob` | *(none)* |
| `'HtmlParse'` | `HtmlParseJob` | `{ jobRegistry: JobRegistry, clientRegistry: config.namespaceMap }` |
| `'AssetDownload'` | `AssetDownloadJob` | `{ clientRegistry: config.namespaceMap }` |

## Out of scope

- The web server, monitoring UI, frontend, and HTTP routes — see [Web Server](web-server.md) and [Frontend](frontend.md) instead.
- The generic `Factory` base class (`source/lib/factory/Factory.js`) — an implementation detail underlying `WorkerFactory` and `JobFactory`, not documented separately here.

## Coupling map for extraction

**Generic (goes with the package):**

- `Worker`, `WorkerFactory`, `WorkersRegistry`, `WorkersRegistryInstance`
- `Job` (abstract base), `JobFactory`, `JobRegistry`, `JobRegistryInstance`
- `Engine`, `WorkersAllocator`
- Collections: `IdentifyableCollection`, `Queue`, `SortedCollection` (and their helpers `Collection`, `SortedArrayMerger`, `SortedArraySearcher`)

**Navi-specific (stays in Navi):**

- The 5 `Job` subclasses: `ResourceRequestJob`, `ActionProcessingJob`, `PaginatedActionProcessingJob`, `HtmlParseJob`, `AssetDownloadJob`
- `ResourceEnqueuer` — already the dedicated Navi class that calls `JobRegistry.enqueue()` from outside the worker package
- `EngineEvents`, `EngineStopService`, `FailureChecker`, `RunSummary` — should become injectable listeners attached from Navi
- `ApplicationInstance` — orchestrates boot, registers the five job factories, builds `JobRegistry`/`WorkersRegistry`

**Current coupling via static singletons:**

- `Worker` depends on `JobRegistry` and `WorkersRegistry` — but only via constructor-injected references, not static calls, so an extracted `Worker` would keep working unchanged as long as it's still handed instance-like registries.
- `WorkersAllocator` calls `JobRegistry.pick()`/`requeue()` and `WorkersRegistry.getIdleWorker()`/`hasIdleWorker()` as **static** methods.
- `Engine` calls `JobRegistry.promoteReadyJobs()`/`hasReadyJob()`/`hasJob()` and `WorkersRegistry.hasBusyWorker()` as **static** methods.
- For extraction: `WorkersAllocator` and `Engine` are the two classes that would need their static `JobRegistry`/`WorkersRegistry` calls refactored into injected instance references (mirroring how `Worker` and `WorkerFactory` already receive theirs), since a standalone package cannot depend on Navi's process-wide singletons.
