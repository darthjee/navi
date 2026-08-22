# Reference sub-page

Create `docs/guides/deku-swarm/reference.md` as the full public API surface, exhaustive and table-driven (this is the one sub-page allowed to read like `worker/README.md`'s reference tables, adapted/reorganized rather than copied verbatim) — covering every export from `worker/lib/index.js`:

- `Worker` (`worker/lib/background/Worker.js`) — `constructor({ id, jobRegistry, workersRegistry, loggerFactory })`, `assign(job)`, `async perform()`.
- `WorkerFactory` (`worker/lib/background/WorkerFactory.js`) — `new WorkerFactory({ klass, attributesGenerator, jobRegistry, workersRegistry, loggerFactory })`.
- `WorkersRegistry` (`worker/lib/background/WorkersRegistry.js`) — `build(options)`, `reset()`, `initWorkers()`, `getIdleWorker()`, `setBusy(id)`/`setIdle(id)`, `hasBusyWorker()`/`hasIdleWorker()`, `stats()` (`{ idle, busy }`).
- `Job` (`worker/lib/background/Job.js`) — full member table (cross-reference [Defining Jobs](./defining-jobs.md) for the narrative version).
- `JobFactory` (`worker/lib/background/JobFactory.js`) — `new JobFactory({ klass, attributesGenerator, attributes })`, `build(name, options)`, `get(name)`, `reset()`.
- `JobRegistry` (`worker/lib/background/JobRegistry.js`) — full method table (cross-reference [Job Lifecycle](./job-lifecycle.md) for the narrative version).
- `Engine` (`worker/lib/services/Engine.js`) — full options + method table (cross-reference [Running the Engine](./running-the-engine.md)).
- `WorkersAllocator` (`worker/lib/services/WorkersAllocator.js`) — matches ready jobs to idle workers; `allocate()` loops `pick()`/`getIdleWorker()` until either queue is exhausted, re-queuing a picked job if no worker is free; built automatically by `Engine` unless a custom one is injected via the `allocator` option.
- `IdentifyableCollection`, `Queue`, `SortedCollection` (cross-reference [Collections](./collections.md)).

Verify every signature/option/default against current `worker/lib/**` source (and `docs/agents/worker.md`) before publishing — do not rely solely on this plan or the issue text, in case the source has drifted.

## Files to Change

- `docs/guides/deku-swarm/reference.md` — new sub-page.
