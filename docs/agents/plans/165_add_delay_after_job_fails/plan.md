# Plan — Issue 165: Add Delay After a Job Fails

## Overview

When a job fails it is immediately re-queued, which causes aggressive retries
against a struggling server. The fix introduces a 5-second cooldown: failed jobs
are held in a `failed` queue until their `readyBy` timestamp elapses, then moved
to a new `retryQueue` from which workers pick them up.

---

## Checklist

- [ ] **Step 1 – `Job` model**: add `readyBy` property and `isReady()` helper
- [ ] **Step 2 – `JobRegistry`**: add `retryQueue`, `promoteReadyJobs()`, `hasReadyJob()`, update `fail()`, `pick()`, `hasJob()`, and `stats()`
- [ ] **Step 3 – `WorkersAllocator`**: switch `_canAllocate()` to use `hasReadyJob()`
- [ ] **Step 4 – `Engine`**: call `promoteReadyJobs()` each cycle; add async sleep when jobs exist but none are ready
- [ ] **Step 5 – tests**: cover every new / changed behaviour

---

## Step 1 — `Job` model (`source/lib/models/Job.js`)

### Changes

Add a public `readyBy` property (millisecond timestamp, default `0` so new jobs
are always immediately ready) and a public `isReady()` helper.

```js
// constructor — add initialisation
this.readyBy = 0;

// new public method (add before private methods)
/**
 * Checks whether the job's cooldown period has elapsed.
 * @returns {boolean} True if the job can be retried now.
 */
isReady() {
  return Date.now() >= this.readyBy;
}
```

`readyBy` is set by `JobRegistry#fail()` (see Step 2), not inside `Job` itself,
so the model stays free of registry concerns.

---

## Step 2 — `JobRegistry` (`source/lib/registry/JobRegistry.js`)

### 2a — Constructor

Add a `retryQueue` parameter (injectable for testing) alongside the existing ones:

```js
// new private field
#retryQueue;

// constructor parameter + initialisation
constructor({ queue, failed, retryQueue, finished, dead, processing, clients, factory }) {
  // …existing lines…
  this.#retryQueue = retryQueue || new Queue();
  // …
}
```

### 2b — `fail()` — set cooldown on the job

```js
fail(job) {
  if (!job) return;
  this.#processing.remove(job.id);
  if (job.exhausted()) {
    this.#dead.push(job);
  } else {
    job.readyBy = Date.now() + 5000;   // ← 5-second cooldown
    this.#failed.push(job);
  }
}
```

### 2c — `promoteReadyJobs()` — move ready jobs to `retryQueue`

Called by the Engine at the start of every allocation cycle.

```js
/**
 * Promotes jobs from the failed queue to the retryQueue once their
 * cooldown period has elapsed.
 * @returns {void}
 */
promoteReadyJobs() {
  const remaining = [];
  while (this.#failed.hasItem()) {
    const job = this.#failed.pick();
    if (job.isReady()) {
      this.#retryQueue.push(job);
    } else {
      remaining.push(job);
    }
  }
  remaining.forEach(job => this.#failed.push(job));
}
```

### 2d — `hasJob()` — keep engine alive while ANY work remains

```js
hasJob() {
  return this.#enqueued.hasItem()
    || this.#failed.hasItem()
    || this.#retryQueue.hasItem();
}
```

### 2e — `hasReadyJob()` — signal that a worker can be assigned right now

```js
/**
 * Returns whether there is a job ready to be picked by a worker.
 * @returns {boolean}
 */
hasReadyJob() {
  return this.#enqueued.hasItem() || this.#retryQueue.hasItem();
}
```

### 2f — `pick()` — consume from `retryQueue` as well as `enqueued`

```js
pick() {
  const job = this.#enqueued.pick() || this.#retryQueue.pick();
  if (job) {
    this.#processing.push(job);
  }
  return job;
}
```

> **Note**: workers never pick directly from `#failed`; only
> `promoteReadyJobs()` drains that queue.

### 2g — `stats()` — expose `retryQueue` count

```js
stats() {
  return {
    enqueued:   this.#enqueued.size(),
    processing: this.#processing.size(),
    failed:     this.#failed.size(),
    retryQueue: this.#retryQueue.size(),   // ← new field
    finished:   this.#finished.size(),
    dead:        this.#dead.size(),
  };
}
```

The `StatsRequestHandler` calls `jobRegistry.stats()` directly, so
`GET /stats.json` automatically includes the new field.

---

## Step 3 — `WorkersAllocator` (`source/lib/services/WorkersAllocator.js`)

Replace the `hasJob()` call in `_canAllocate()` with `hasReadyJob()`:

```js
_canAllocate() {
  return this.workersRegistry.hasIdleWorker() && this.jobRegistry.hasReadyJob();
}
```

No other changes are needed in this file.

---

## Step 4 — `Engine` (`source/lib/services/Engine.js`)

Two changes are needed:

1. Call `promoteReadyJobs()` at the top of every loop iteration.
2. When `hasJob()` is `true` but `hasReadyJob()` is `false` (all remaining jobs
   are still in their cooldown), the engine must **wait** before retrying rather
   than spinning in a tight loop.

```js
/**
 * Starts the engine by processing jobs.
 * @returns {Promise<void>}
 */
async start() {
  while (this.#continueAllocating()) {
    this.#jobRegistry.promoteReadyJobs();

    if (this.#jobRegistry.hasReadyJob()) {
      this.allocator.allocate();
    } else {
      await this.#sleep(500);   // wait 500 ms before trying again
    }
  }
}

/**
 * Waits for a given number of milliseconds.
 * @param {number} ms
 * @returns {Promise<void>}
 */
#sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

> `start()` becomes `async` — all callers must `await engine.start()`.

---

## Step 5 — Tests

### `source/spec/models/Job_spec.js` — new `#isReady` block

```js
describe('#isReady', () => {
  describe('when readyBy is 0 (default)', () => {
    it('returns true', () => {
      expect(job.isReady()).toBeTrue();
    });
  });

  describe('when readyBy is in the past', () => {
    beforeEach(() => { job.readyBy = Date.now() - 1000; });
    it('returns true', () => { expect(job.isReady()).toBeTrue(); });
  });

  describe('when readyBy is in the future', () => {
    beforeEach(() => { job.readyBy = Date.now() + 10_000; });
    it('returns false', () => { expect(job.isReady()).toBeFalse(); });
  });
});
```

### `source/spec/registry/JobRegistry_spec.js` — updated / new blocks

| Describe block | What to assert |
|----------------|----------------|
| `#fail` (existing) | `job.readyBy` is set to approximately `Date.now() + 5000` after a non-exhausted failure |
| `#hasJob` (existing) | returns `true` when only `retryQueue` has items |
| `#hasReadyJob` (new) | `false` when all queues empty; `true` when `enqueued` has items; `true` when `retryQueue` has items; `false` when only `failed` has items |
| `#pick` (existing) | picks from `retryQueue` when `enqueued` is empty |
| `#promoteReadyJobs` (new) | jobs with elapsed `readyBy` move to `retryQueue`; jobs with future `readyBy` stay in `failed` |

### `source/spec/registry/JobRegistry_stats_spec.js` — updated assertions

All existing expectations must add `retryQueue: 0` (or the appropriate count).
Add a new scenario: *when a job is in the retry queue* → `retryQueue: 1`.

### `source/spec/services/WorkersAllocator_spec.js`

Update existing tests for `_canAllocate()` to use `hasReadyJob()` rather than
`hasJob()` (if they reference the method name directly).

### `source/spec/services/Engine_spec.js`

Add tests for:
- `promoteReadyJobs()` is called each cycle.
- When `hasJob()` is `true` but `hasReadyJob()` is `false`, `#sleep` is awaited
  and `allocator.allocate()` is NOT called in that iteration.
- `start()` resolves (no infinite loop) once all jobs are exhausted or finished.

---

## File Change Summary

| File | Change type |
|------|-------------|
| `source/lib/models/Job.js` | Add `readyBy`, `isReady()` |
| `source/lib/registry/JobRegistry.js` | Add `#retryQueue`, update constructor, `fail()`, `pick()`, `hasJob()`, add `hasReadyJob()`, `promoteReadyJobs()`, update `stats()` |
| `source/lib/services/WorkersAllocator.js` | `_canAllocate()` → `hasReadyJob()` |
| `source/lib/services/Engine.js` | `start()` async, call `promoteReadyJobs()`, add `#sleep()` |
| `source/spec/models/Job_spec.js` | New `#isReady` tests |
| `source/spec/registry/JobRegistry_spec.js` | Updated `#fail`, `#hasJob`, `#pick`; new `#hasReadyJob`, `#promoteReadyJobs` |
| `source/spec/registry/JobRegistry_stats_spec.js` | Add `retryQueue` field to all expectations; new retryQueue scenario |
| `source/spec/services/WorkersAllocator_spec.js` | Update `_canAllocate` tests |
| `source/spec/services/Engine_spec.js` | Tests for sleep path and `promoteReadyJobs` call |
