# Issue: Document navi worker

## Description

`docs/agents/flow/engine-and-workers.md` covers the Engine Loop and Worker Execution at a high level — the 7-step perform sequence, the allocation tick, and the keepAlive/idleTimeout mechanics. However, there is no dedicated document that describes the worker **subsystem** as a cohesive unit: its classes, individual responsibilities, public interfaces, internal lifecycle, and — critically — the coupling points that would need to be resolved to extract the subsystem into a standalone package.

The motivation for this issue is that the worker system should, at some point, be **extracted into a dedicated package**. This document is the first step: establishing a clear architectural description of the subsystem as it exists today, with explicit notes on what is generic (goes with the package) versus what is Navi-specific (stays behind).

## Solution

Create `docs/agents/worker.md` (evolving into `docs/agents/worker/` if the file grows too large) documenting the worker subsystem as a cohesive, extractable unit. Update `AGENTS.md` Index and add a link from `flow/engine-and-workers.md` pointing to the new document.

### In scope

#### Core classes — document with full interface descriptions

| Class | File | Responsibility |
|---|---|---|
| `Worker` | `source/lib/background/Worker.js` | Receives a job via `assign()`, executes via `perform()`, reports `finish`/`fail` to `JobRegistry`, returns to idle on `WorkersRegistry`. Try/catch/finally with `LogContext`. |
| `WorkerFactory` | `source/lib/background/WorkerFactory.js` | Extends `Factory` (implementation detail). Creates `Worker` instances with unique IDs via `IdGenerator`, injects `jobRegistry` and `workersRegistry`. |
| `WorkersRegistry` | `source/lib/background/WorkersRegistry.js` | Static singleton facade — delegates to `WorkersRegistryInstance`. |
| `WorkersRegistryInstance` | `source/lib/background/WorkersRegistryInstance.js` | Manages the worker pool with 3 internal collections (`#workers`, `#busy`, `#idle`). `initWorkers()` creates `quantity` workers (all start idle). `getIdleWorker()` picks first idle, marks as busy, returns. `setBusy()`/`setIdle()` transition workers between collections. `hasBusyWorker()`/`hasIdleWorker()` for Engine loop checks. `stats()` returns `{ idle, busy }`. |
| `Job` (abstract base) | `source/lib/background/Job.js` | Abstract base class — `perform()` must be overridden. `applyCooldown(ms)` sets `readyBy = Date.now() + ms`. `isReadyBy(currentTime)` checks cooldown elapsed. `maxRetries` getter (default 3, overridable). `exhausted(maxRetries)` checks if attempts ≥ maxRetries. `_fail(error)` increments `#attempts`, stores `lastError`, re-throws. `_attempts` getter. |
| `JobFactory` | `source/lib/background/JobFactory.js` | Static registry with internal `Map`. `build(name, attributes)` creates and registers a `JobFactory` instance. `registry(name, factory)` registers manually. `get(name)` retrieves by key. `reset()` clears all (for tests). Each factory merges constructor-level `#attributes` with build-time params. |
| `JobRegistry` | `source/lib/background/JobRegistry.js` | Static singleton facade — delegates to `JobRegistryInstance`. |
| `JobRegistryInstance` | `source/lib/background/JobRegistryInstance.js` | 6 internal collections: `#enqueued` (Queue), `#failed` (SortedCollection by `readyBy`), `#retryQueue` (Queue), `#finished` (IdentifyableCollection), `#dead` (IdentifyableCollection), `#processing` (IdentifyableCollection). `enqueue(factoryKey, params)` → `JobFactory.get(key).build(params)` → `#enqueued.push()`. `pick()` takes from `#enqueued` or `#retryQueue`, moves to `#processing`. `fail(job)` — if `exhausted()` → `#dead`, else `applyCooldown()` → `#failed`. `finish(job)` → `#finished`. `requeue(job)` → back to `#enqueued`. `retryJob(id)` — from `#failed` or `#dead` → `#retryQueue`. `promoteReadyJobs()` — `#failed.upTo(now)` → `#retryQueue`. `clearQueues()` — resets all except `#processing`. `hasJob()` / `hasReadyJob()` / `stats()` / `jobsByStatus()` / `jobById()`. |
| `Engine` | `source/lib/services/Engine.js` | Main loop: `start()` iterates `promoteReadyJobs()` → `allocator.allocate()` → `#sleep()`. `#shouldContinue()` — `keepAlive` or `hasJob() || hasBusyWorker()`. `#checkIdleTimeout()` tracks idle time, fires `onIdleTimeout` once per idle window. `pause()`/`resume()`/`stop()` control loop state. |
| `WorkersAllocator` | `source/lib/services/WorkersAllocator.js` | `allocate()` loops `_allocateNext()` while `_canAllocate()`. `_allocateNext()` — `JobRegistry.pick()` + `WorkersRegistry.getIdleWorker()`; if no worker, `JobRegistry.requeue(job)`. `_allocateWorkerToJob(worker, job)` calls `worker.assign(job)` then `worker.perform()`. |

#### Collections — document how internal state is stored

| Collection | File | Used by | Behavior |
|---|---|---|---|
| `IdentifyableCollection` | `source/lib/utils/collections/IdentifyableCollection.js` | `WorkersRegistryInstance` (`#workers`, `#busy`, `#idle`), `JobRegistryInstance` (`#finished`, `#dead`, `#processing`) | Lookup by ID via `get(id)`/`findById(id)`. `push()`, `remove(id)`, `hasAny()`, `size()`, `list()`. |
| `Queue` | `source/lib/utils/collections/Queue.js` | `JobRegistryInstance` (`#enqueued`, `#retryQueue`) | FIFO — `push()`, `pick()` (removes first), `hasAny()`, `size()`. |
| `SortedCollection` | `source/lib/utils/collections/SortedCollection.js` | `JobRegistryInstance` (`#failed`) | Sorted by `readyBy` timestamp. `upTo(now)` returns jobs ready for retry. `after(now)` returns still-cooling. Enables `promoteReadyJobs()`. |

#### Engine auxiliary services — document with extraction note

These services are currently coupled to the Engine inside Navi. The document should describe what they do and note that **the Engine should support a generic injectable listener mechanism** so these can be attached by Navi without belonging to the worker package.

| Service | File | Responsibility | Extraction note |
|---|---|---|---|
| `EngineEvents` | `source/lib/services/EngineEvents.js` | Emits lifecycle events for the Engine | Should become an injectable listener |
| `EngineStopService` | `source/lib/services/EngineStopService.js` | Handles `pausing`/`stopping` transitions — waits for workers to go idle, then finalizes | Should become an injectable listener |
| `FailureChecker` | `source/lib/services/FailureChecker.js` | Checks if dead-job ratio exceeds `failure.threshold` → exits non-zero | Should become an injectable listener |
| `RunSummary` | `source/lib/services/RunSummary.js` | Generates final execution report (finished/dead counts) | Should become an injectable listener |

#### `enqueueFirstJobs()` — document with extraction note

Today, `ApplicationInstance.enqueueFirstJobs()` discovers parameter-free `ResourceRequest`s from `ResourceRegistry` and enqueues them via `JobRegistry.enqueue()`. The document should note that **this logic should be extracted into a dedicated class belonging to Navi** (not the worker package) that calls `JobRegistry.enqueue()` from outside.

#### Job subclasses — list only, in a special section

These are **Navi-specific implementations** of `Job` that stay in Navi when the worker package is extracted. The `Job` base class goes with the package; these concrete implementations do not. List them without detailing their `perform()` internals:

| Factory Key | Class | `maxRetries` | Stays in |
|---|---|---|---|
| `'ResourceRequestJob'` | `ResourceRequestJob` | 3 (default) | Navi |
| `'Action'` | `ActionProcessingJob` | 1 (first failure exhausts) | Navi |
| `'PaginatedAction'` | `PaginatedActionProcessingJob` | 1 | Navi |
| `'HtmlParse'` | `HtmlParseJob` | 1 | Navi |
| `'AssetDownload'` | `AssetDownloadJob` | 3 (default) | Navi |

#### Job factory registration — document how the 5 factories are registered at boot

During `ApplicationInstance.#initRegistries()`, five `JobFactory.build(name, attributes)` calls register the factories above. The document should include the registration table showing factory key, class, and injected attributes (e.g. `clients`/`clientRegistry`/`jobRegistry`).

### Out of scope

- Web server / monitoring UI / frontend / HTTP routes
- `Factory` base class (`source/lib/factory/Factory.js`) — implementation detail, not documented

### Coupling map for extraction

The document should include a section mapping what is generic (goes with the worker package) vs. what is Navi-specific (stays behind):

**Generic (goes with the package):**
- `Worker`, `WorkerFactory`, `WorkersRegistry`, `WorkersRegistryInstance`
- `Job` (abstract base), `JobFactory`, `JobRegistry`, `JobRegistryInstance`
- `Engine`, `WorkersAllocator`
- Collections: `IdentifyableCollection`, `Queue`, `SortedCollection`

**Navi-specific (stays in Navi):**
- 5 Job subclasses (`ResourceRequestJob`, `ActionProcessingJob`, `PaginatedActionProcessingJob`, `HtmlParseJob`, `AssetDownloadJob`)
- `enqueueFirstJobs()` — should become a dedicated Navi class
- `EngineEvents`, `EngineStopService`, `FailureChecker`, `RunSummary` — should become injectable listeners
- `ApplicationInstance` — orchestrates boot, registers factories

**Current coupling via static singletons:**
- `Worker` depends on `JobRegistry` (static) and `WorkersRegistry` (static)
- `WorkersAllocator` depends on `JobRegistry.pick()` and `WorkersRegistry.getIdleWorker()` (static)
- `Engine` depends on `JobRegistry.promoteReadyJobs()`/`hasReadyJob()`/`hasJob()` and `WorkersRegistry.hasBusyWorker()` (static)
- For extraction: static singletons will need to be refactored to injectable instances

### Structure

- Initial file: `docs/agents/worker.md`
- If it grows too large: split into `docs/agents/worker/` with sub-files (following the `flow/` and `architecture/` pattern)
- `flow/engine-and-workers.md` gets a link pointing to the new document
- `AGENTS.md` Index gets a new entry
