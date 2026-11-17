# Job Lifecycle

Every job moves through a small state machine, tracked internally by `JobRegistry` across six collections. Understanding the states — and which `JobRegistry` methods drive the transitions between them — helps when you're debugging a stuck job or building tooling (a dashboard, a retry button) around the queue.

## States and transitions

1. **`enqueued`** — the job has been built and is waiting to be picked up by a worker. A job lands here via `JobRegistry.enqueue(factoryKey, params)`.
2. **`processing`** — a worker has picked the job up and is currently running its `perform()`. `JobRegistry.pick()` moves a job from `enqueued` (or `retryQueue`) into `processing`.
3. From `processing`, a job resolves one of two ways:
   - **`finished`** — `perform()` resolved successfully. `JobRegistry.finish(job)` moves it here; this is a terminal state.
   - **`failed`** — `perform()` threw. `JobRegistry.fail(job)` moves it here *unless* the job is already exhausted (see below), applying a cooldown period before it's eligible to retry.
4. **`retryQueue`** — once a `failed` job's cooldown has elapsed, `JobRegistry.promoteReadyJobs()` moves it here, ready to be picked again (back to step 2, `processing`).
5. **`dead`** — if `JobRegistry.fail(job)` is called on a job that has already exhausted its retries (see `exhausted()`/`maxRetries` in [Defining Jobs](./defining-jobs.md)), it goes straight to `dead` instead of `failed`. This is a terminal state, though it can still be manually revived (see `retryJob` below).

```
enqueued ──pick()──> processing ──finish()──> finished
                          │
                        fail()
                          │
              ┌───────────┴───────────┐
              │                       │
        (not exhausted)         (exhausted)
              │                       │
              v                       v
           failed                  dead
              │                       │
     promoteReadyJobs()         retryJob(id)
      (cooldown elapsed)       (manual, bypasses
              │                    cooldown)
              v                       │
         retryQueue <─────────────────┘
              │
           pick()
              │
              v
         processing (loop continues)
```

## `JobRegistry` methods

| Method | Description |
|--------|-------------|
| `JobRegistry.enqueue(factoryKey, params)` | Builds a job via the `JobFactory` registered under `factoryKey` (see [Setup](./setup.md)) and pushes it onto the `enqueued` queue. |
| `JobRegistry.pick()` | Removes and returns the next ready job — from `enqueued` first, falling back to `retryQueue` — moving it into `processing`. Called internally by `WorkersAllocator` on every `Engine` tick (see [Running the Engine](./running-the-engine.md)); you rarely call this yourself. |
| `JobRegistry.requeue(job)` | Moves a job from `processing` back to `enqueued`. Used when a job was picked but no idle worker was available to run it, so it isn't lost. |
| `JobRegistry.finish(job)` | Reports a job's successful outcome — removes it from `processing`, pushes it onto `finished`. |
| `JobRegistry.fail(job)` | Reports a job's failed outcome — removes it from `processing`, then either applies a cooldown and pushes it onto `failed`, or (if the job is already exhausted) pushes it straight onto `dead`. |
| `JobRegistry.promoteReadyJobs()` | Moves every job in `failed` whose cooldown has elapsed into `retryQueue`. Called once per `Engine` tick — you don't normally call this yourself unless you're driving the queue manually, outside of `Engine`. |
| `JobRegistry.retryJob(id)` | Manually moves a job straight into `retryQueue`, bypassing its cooldown — searches `failed` first, then `dead`. Intended for operator-triggered "retry now" flows (e.g. a button in a monitoring UI). Returns the job, or `null` if it wasn't found in either collection. |
| `JobRegistry.clearQueues()` | Clears `enqueued`, `retryQueue`, `failed`, `finished`, and `dead` — leaving `processing` untouched, so in-flight jobs are never lost by a reset. |
| `JobRegistry.hasJob()` | `true` if any job exists anywhere except `processing`/`finished`/`dead` — i.e. `enqueued`, `failed`, or `retryQueue` is non-empty. Drives whether the engine loop keeps running in one-shot mode. |
| `JobRegistry.hasReadyJob()` | `true` if `enqueued` or `retryQueue` is non-empty (excludes `failed`, which is still cooling down). Drives whether the engine allocates on a given tick. |
| `JobRegistry.jobsByStatus(status)` | Returns all jobs currently in the given status (`'enqueued'`, `'processing'`, `'failed'`, `'retryQueue'`, `'finished'`, `'dead'`). Useful for building a job list view. |
| `JobRegistry.jobById(id)` | Searches every status and returns `{ job, status }` for the matching job, or `null` if no job has that id. Useful for a job detail view. |
| `JobRegistry.prune(options)` | Manually evicts terminal jobs (`finished` / `dead`) from memory — see [Pruning terminal jobs](#pruning-terminal-jobs). Returns `{ finished, dead }` with the number of jobs removed from each. |
| `JobRegistry.stats()` | Returns `{ enqueued, processing, failed, retryQueue, finished, dead, total, pruned }` — per-status counts, `total` (`dead + finished`), and cumulative `pruned: { finished, dead }` eviction counters. |

## Pruning terminal jobs

`finished` and `dead` are terminal collections: nothing removes jobs from them on its own, so in a long-lived process (for example an `Engine` running with `keepAlive`) they grow without bound. Pruning bounds that memory. Only `finished` and `dead` are ever pruned — `enqueued`, `processing`, `failed` and `retryQueue` are never touched.

### `endedAt`

Each job exposes a read-only `job.endedAt` — the epoch ms at which it entered `finished` or `dead`, or `null` while it hasn't ended. `JobRegistry.retryJob(id)` on a dead job resets it to `null`, since the job is no longer terminal.

### Automatic retention

Pass `retention` to `JobRegistry.build()` (or `ensureBuild()`) to cap how many jobs each terminal collection keeps. The cap is enforced whenever a job is pushed by `finish()` / `fail()`, evicting the oldest jobs (insertion order) first.

```javascript
JobRegistry.build({
  retention: { finished: 1000, dead: 500 },
});
```

- Values must be non-negative integers; an invalid value throws an `Error` at construction.
- A status you omit is unbounded.
- `0` evicts a job as soon as it arrives.
- Enforcement removes only the excess oldest jobs, so its per-job cost does not grow with the cap.

### Manual pruning

`JobRegistry.prune({ statuses, keep, olderThan })` evicts on demand:

| Option | Description |
|--------|-------------|
| `statuses` | Which collections to prune. Defaults to `['finished', 'dead']`. Unknown or non-terminal statuses throw an `Error`. |
| `keep` | Non-negative integer. Keeps the N most recent jobs of each selected status and removes the rest. |
| `olderThan` | Non-negative milliseconds. Removes jobs whose `endedAt < Date.now() - olderThan`. Jobs with `endedAt === null` are never removed by `olderThan`. |

When both `keep` and `olderThan` are given, the rules combine as a union: a job is removed if either rule selects it. With neither, every job of the selected statuses is removed (so a bare `prune()` empties `finished` and `dead`). Invalid input (a negative or non-integer `keep`, a negative `olderThan`) throws an `Error`.

It returns the removed counts, with `0` for statuses that weren't selected:

```javascript
// Periodically drop terminal jobs that ended more than an hour ago
setInterval(() => {
  const { finished, dead } = JobRegistry.prune({ olderThan: 3_600_000 });
  console.log(`pruned ${finished} finished and ${dead} dead jobs`);
}, 600_000);
```

### Effect on stats and lookups

- `stats().finished`, `stats().dead` and `stats().total` are in-memory counts, so they drop when jobs are pruned.
- `stats().pruned` (`{ finished, dead }`) counts evictions cumulatively, from both `retention` and `prune()`; `clearQueues()` resets it.
- A pruned job is gone: `jobById(id)` and `retryJob(id)` return `null` for it.

[← Back to How to Use deku-swarm](../HOW_TO_USE_DEKU_SWARM.md)
