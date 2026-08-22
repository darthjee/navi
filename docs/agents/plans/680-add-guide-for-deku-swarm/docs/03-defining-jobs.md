# Defining jobs sub-page

Create `docs/guides/deku-swarm/defining-jobs.md` covering how to subclass `Job` (`worker/lib/background/Job.js`):

- `constructor({ id })` — `id` is the job's unique identifier; subclasses call `super({ id })` and add their own attributes (mirror the `GreetJob` example from `worker/README.md`).
- `async perform(logContext)` — the method to override with the job's actual work. Throwing marks the job failed; resolving marks it finished. Explain `logContext`/the logger contract (`debug/info/warn/error`, matches the `loggerFactory` passed to `Worker`).
- `get maxRetries()` — override to customize the retry ceiling per subclass; defaults to `3`.
- `applyCooldown(ms)` — marks the job not-ready-for-retry until `ms` ms from now; called internally on failure, documented here so readers understand the retry timing, not because they call it directly in normal use.
- `isReadyBy(currentTime)` — whether the job's cooldown has elapsed as of `currentTime`; internal scheduling hook, included as reference for readers who build custom registries or tooling around jobs.
- `exhausted(maxRetries)` — whether the job has used up its retries; same "internal but useful to know" framing as the two methods above.
- The private `#attempts`/`#readyBy` tracking — explain conceptually (an internal attempt counter and a cooldown timestamp) without exposing them as public API; frame this as "how retry math works under the hood" for readers who need to reason about timing.
- Job chaining: a job's `perform()` can enqueue further jobs via `JobRegistry.enqueue(name, params)` (forward-reference [Job Lifecycle](./job-lifecycle.md) for `enqueue()` details).

## Files to Change

- `docs/guides/deku-swarm/defining-jobs.md` — new sub-page.
