# Issue 165 — Add Delay After a Job Fails

## Summary

When a job fails, it is currently placed into the **failed queue** and can be picked up again immediately by a worker. This means retries happen too aggressively, with no back-off window, which can hammer a struggling server and prevent it from recovering.

The goal of this issue is to introduce a **delay mechanism** so that failed jobs are not retried until a minimum cooling-off period has elapsed.

---

## Current Behaviour

1. A job fails (e.g. the HTTP response status does not match the expected status).
2. The job is placed in the `failed` queue inside `JobRegistry`.
3. Workers that become idle can immediately pick jobs from the `failed` queue and retry them, regardless of how recently the failure occurred.

---

## Desired Behaviour

### New Queue: `retryQueue`

Introduce a dedicated **retry queue** alongside the existing `failed` queue.

| Queue | Purpose |
|-------|---------|
| `main` | New jobs waiting to be processed for the first time. |
| `failed` | Jobs that have failed and are waiting for their cooldown period to expire. |
| `retryQueue` | Jobs whose cooldown period has expired and are ready to be retried. |
| `finished` | Jobs that completed successfully. |
| `deadJobs` | Jobs that exceeded the maximum retry limit. |

### Worker Pickup Rules

- Workers **continue to pick jobs from the `main` queue** as before.
- Workers now **also pick jobs from the `retryQueue`** (i.e., jobs that are past their cooldown and ready to be retried).
- Workers **do NOT pick jobs directly from the `failed` queue** — that queue is only drained by the engine's promotion step.

### Failure Handling

When a job fails:

1. Increment the job's failure counter and store the last exception (same as today).
2. If the failure count is within the allowed maximum:
   - Set a `readyBy` attribute on the job to `Date.now() + 5000` (5 seconds in the future).
   - Move the job to the **`failed` queue**.
3. If the failure count exceeds the maximum: move the job to **`deadJobs`** (same as today).

### Engine Promotion Step

At every cycle of the engine loop, before assigning jobs to workers, the engine must:

1. Iterate over all jobs currently in the `failed` queue.
2. For each job whose `readyBy` timestamp is **≤ `Date.now()`** (i.e., the cooldown has elapsed), move it to the **`retryQueue`**.

This ensures the `retryQueue` is continuously fed from the `failed` queue as jobs become ready.

### Engine Continuation Condition

The engine must keep running as long as any of the following is true:

- There is at least one job in the **`main` queue**.
- There is at least one job in the **`failed` queue** (waiting for its cooldown).
- There is at least one job in the **`retryQueue`** (ready to be retried).
- At least one **worker is busy** (currently processing a job).

In code terms, `JobRegistry.hasJob()` must return `true` when any of the three queues is non-empty.

---

## Implementation Hints

### `Job` model (`source/lib/models/Job.js`)

- Add a `readyBy` property (a timestamp in milliseconds, e.g. `Date.now() + 5000`).
- Add an `isReady()` helper that returns `true` when `Date.now() >= this.readyBy`.

### `JobRegistry` (`source/lib/registry/JobRegistry.js`)

- Add a `retryQueue` (array or queue structure, same as `failed`).
- Update `hasJob()` to also check `retryQueue` and `failed`.
- Add a `promoteReadyJobs()` method that moves jobs from `failed` to `retryQueue` when `job.isReady()`.
- Update `pick()` (or create a dedicated `pickRetry()`) so workers can consume from `retryQueue`.

### `Engine` (`source/lib/services/Engine.js`)

- Call `jobRegistry.promoteReadyJobs()` at the start (or end) of each allocation cycle.

### `Worker` (`source/lib/models/Worker.js`) / `WorkersAllocator` (`source/lib/services/WorkersAllocator.js`)

- Ensure workers try to pick from `retryQueue` when `main` is empty (or in parallel, depending on priority design).

---

## Acceptance Criteria

- [ ] A failed job receives a `readyBy` timestamp set to 5 seconds after failure.
- [ ] Failed jobs are **not** picked up by workers until `readyBy` has elapsed.
- [ ] The engine promotes jobs from `failed` → `retryQueue` on every cycle once their `readyBy` time passes.
- [ ] Workers pick jobs from both `main` and `retryQueue`.
- [ ] The engine continues running while any of `main`, `failed`, or `retryQueue` is non-empty, or any worker is busy.
- [ ] All existing tests continue to pass.
- [ ] New unit tests cover: `readyBy` assignment on failure, `promoteReadyJobs()` promotion logic, and the updated `hasJob()` check.
