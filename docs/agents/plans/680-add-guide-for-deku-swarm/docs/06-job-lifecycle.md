# Job lifecycle sub-page

Create `docs/guides/deku-swarm/job-lifecycle.md` covering the job state machine managed by `JobRegistry` (`worker/lib/background/JobRegistry.js`):

- The 6 statuses and the transitions between them: `enqueued` → `processing` → (`finished` | `failed`) → (`retryQueue` → `processing` again, or `dead` once retries are exhausted). Draw this as a short state diagram or ordered list, not just a table.
- `JobRegistry.enqueue(factoryKey, params)` — builds a job via the named `JobFactory` and pushes it onto the enqueued queue.
- `JobRegistry.pick()` — removes and returns the next ready job, moving it to processing (used internally by `WorkersAllocator`; documented so readers understand what drives allocation, covered further in [Running the Engine](./running-the-engine.md)).
- `JobRegistry.requeue(job)` — moves a job from processing back to enqueued (e.g. no idle worker was available).
- `JobRegistry.finish(job)` / `JobRegistry.fail(job)` — report a job's outcome; a failed job is either re-queued with cooldown applied or moved to dead once `exhausted()`.
- `JobRegistry.promoteReadyJobs()` — moves jobs whose cooldown has elapsed from failed into the retry queue; called each `Engine` tick.
- `JobRegistry.retryJob(id)` — manually moves a failed or dead job straight into the retry queue, bypassing cooldown (for operator-triggered "retry now" flows).
- `JobRegistry.clearQueues()` — clears enqueued/retry/failed/finished/dead, leaving processing untouched.
- `JobRegistry.hasJob()` / `JobRegistry.hasReadyJob()` — existence/pickability checks.
- `JobRegistry.jobsByStatus(status)` / `JobRegistry.jobById(id)` — introspection helpers, e.g. for building a monitoring UI.
- `JobRegistry.stats()` — return shape: `{ enqueued, processing, failed, retryQueue, finished, dead, total }`.

## Files to Change

- `docs/guides/deku-swarm/job-lifecycle.md` — new sub-page.
