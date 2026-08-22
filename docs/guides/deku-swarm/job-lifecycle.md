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
| `JobRegistry.stats()` | Returns `{ enqueued, processing, failed, retryQueue, finished, dead, total }` — per-status counts, plus `total` (`dead + finished`). |

[← Back to How to Use deku-swarm](../HOW_TO_USE_DEKU_SWARM.md)
