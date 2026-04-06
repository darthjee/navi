# Plan — Issue 165: Add Delay After a Job Fails

## Overview

When a job fails it is immediately re-queued, which causes aggressive retries
against a struggling server. The fix introduces a 5-second cooldown: failed jobs
are held in a `failed` queue until their `readyBy` timestamp elapses, then moved
to a new `retryQueue` from which workers pick them up.

> **Note on existing behaviour**: `pick()` currently falls back to `#failed`
> (`this.#enqueued.pick() || this.#failed.pick()`). This PR replaces that
> fallback with `#retryQueue` — failed jobs are no longer picked directly.

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

### 2f — `pick()` — consume from `retryQueue` instead of `failed`

```js
pick() {
  const job = this.#enqueued.pick() || this.#retryQueue.pick();
  if (job) {
    this.#processing.push(job);
  }
  return job;
}
```

> **Breaking change**: workers no longer fall back to `#failed`. Only
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

Add after the `#exhausted` block. The job is already built in `beforeEach` via
`new Job({ id: 'id', resourceRequest, clients, parameters })`.

```js
describe('#isReady', () => {
  describe('when readyBy is 0 (default)', () => {
    it('returns true', () => {
      expect(job.isReady()).toBeTrue();
    });
  });

  describe('when readyBy is in the past', () => {
    beforeEach(() => {
      job.readyBy = Date.now() - 1000;
    });

    it('returns true', () => {
      expect(job.isReady()).toBeTrue();
    });
  });

  describe('when readyBy is in the future', () => {
    beforeEach(() => {
      job.readyBy = Date.now() + 10_000;
    });

    it('returns false', () => {
      expect(job.isReady()).toBeFalse();
    });
  });
});
```

---

### `source/spec/registry/JobRegistry_spec.js` — updated and new blocks

The existing `beforeEach` builds the registry as:
```js
registry = new JobRegistry({ jobs, failedJobs, finished, processing, clients });
```
Note: the constructor parameters are `queue` and `failed`, so `jobs`/`failedJobs`
are ignored and internal queues are created. Add a `retryQueue` variable and pass
it under the correct key:

```js
let retryQueue;

beforeEach(() => {
  // …existing declarations…
  retryQueue = new Queue();
  registry = new JobRegistry({ queue: jobs, failed: failedJobs, retryQueue, finished, processing, clients });
  // …
});
```

#### `#hasJob` — add retryQueue scenario

```js
describe('when only the retryQueue has items', () => {
  beforeEach(() => {
    const job = registry.enqueue({ parameters: { value: 1 } });
    registry.pick();          // moves to processing
    job.readyBy = 0;          // already ready
    registry.fail(job);       // moves to failed
    registry.promoteReadyJobs(); // moves to retryQueue
  });

  it('returns true', () => {
    expect(registry.hasJob()).toBeTrue();
  });
});
```

#### `#hasReadyJob` — new describe block

```js
describe('#hasReadyJob', () => {
  describe('when all queues are empty', () => {
    it('returns false', () => {
      expect(registry.hasReadyJob()).toBeFalse();
    });
  });

  describe('when enqueued has items', () => {
    beforeEach(() => {
      registry.enqueue({ parameters: { value: 1 } });
    });

    it('returns true', () => {
      expect(registry.hasReadyJob()).toBeTrue();
    });
  });

  describe('when only failed has items (cooldown not elapsed)', () => {
    beforeEach(() => {
      const job = registry.enqueue({ parameters: { value: 1 } });
      registry.pick();
      registry.fail(job);   // sets readyBy = now + 5000
    });

    it('returns false', () => {
      expect(registry.hasReadyJob()).toBeFalse();
    });
  });

  describe('when retryQueue has items', () => {
    beforeEach(() => {
      const job = registry.enqueue({ parameters: { value: 1 } });
      registry.pick();
      job.readyBy = 0;        // force ready immediately
      registry.fail(job);
      registry.promoteReadyJobs();
    });

    it('returns true', () => {
      expect(registry.hasReadyJob()).toBeTrue();
    });
  });
});
```

#### `#fail` — assert `readyBy` is set

Add to the existing `#fail` describe block:

```js
describe('when the job is not exhausted', () => {
  let job;

  beforeEach(() => {
    job = registry.enqueue({ parameters: { value: 1 } });
    registry.pick();
  });

  it('sets readyBy approximately 5 seconds in the future', () => {
    const before = Date.now() + 4900;
    registry.fail(job);
    const after = Date.now() + 5100;

    expect(job.readyBy).toBeGreaterThanOrEqualTo(before);
    expect(job.readyBy).toBeLessThanOrEqualTo(after);
  });

  it('moves the job to the failed queue, not retryQueue', () => {
    registry.fail(job);

    expect(registry.hasReadyJob()).toBeFalse(); // retryQueue still empty
    expect(registry.hasJob()).toBeTrue();       // but failed queue has it
  });
});
```

#### `#pick` — add retryQueue scenario

Add after the existing "when the queue has failed and not failed jobs" block:

```js
describe('when enqueued is empty and retryQueue has items', () => {
  let failedJob;

  beforeEach(() => {
    failedJob = registry.enqueue({ parameters: { value: 1 } });
    registry.pick();
    failedJob.readyBy = 0;       // already past cooldown
    registry.fail(failedJob);
    registry.promoteReadyJobs(); // moves failedJob → retryQueue
  });

  it('returns the job from retryQueue', () => {
    expect(registry.pick()).toEqual(failedJob);
  });

  it('adds the job to processing', () => {
    registry.pick();
    expect(processing.has(failedJob.id)).toBeTrue();
  });

  it('empties retryQueue afterwards', () => {
    registry.pick();
    expect(registry.hasReadyJob()).toBeFalse();
  });
});
```

#### `#promoteReadyJobs` — new describe block

```js
describe('#promoteReadyJobs', () => {
  let readyJob, waitingJob;

  beforeEach(() => {
    readyJob   = registry.enqueue({ parameters: { value: 1 } });
    waitingJob = registry.enqueue({ parameters: { value: 2 } });

    registry.pick(); // readyJob → processing
    registry.pick(); // waitingJob → processing

    readyJob.readyBy   = Date.now() - 1000; // already elapsed
    waitingJob.readyBy = Date.now() + 10_000; // still in cooldown

    registry.fail(readyJob);   // → failed queue
    registry.fail(waitingJob); // → failed queue
  });

  it('moves the ready job to retryQueue', () => {
    registry.promoteReadyJobs();

    expect(registry.hasReadyJob()).toBeTrue(); // retryQueue has readyJob
  });

  it('keeps the waiting job in failed queue', () => {
    registry.promoteReadyJobs();

    // hasJob() true because waitingJob still in failed
    expect(registry.hasJob()).toBeTrue();
    // but hasReadyJob() ignores failed queue
    // pick() only returns readyJob, not waitingJob
    expect(registry.pick()).toEqual(readyJob);
    expect(registry.pick()).toBeUndefined(); // waitingJob still locked
  });

  describe('when called repeatedly', () => {
    it('is idempotent when no new jobs become ready', () => {
      registry.promoteReadyJobs();
      registry.promoteReadyJobs(); // second call must not duplicate

      registry.pick(); // readyJob
      expect(registry.pick()).toBeUndefined();
    });
  });
});
```

---

### `source/spec/registry/JobRegistry_stats_spec.js` — add `retryQueue` field

All existing `toEqual` expectations gain `retryQueue: 0`. Then add a new scenario:

```js
// In the beforeEach, add retryQueue to the constructor call:
let retryQueue;

beforeEach(() => {
  // …existing vars…
  retryQueue = new Queue();
  registry = new JobRegistry({
    queue,
    failed: failedQueue,
    retryQueue,
    finished: finishedCollection,
    dead: deadCollection,
    processing: processingCollection,
    clients,
  });
});

// Update ALL existing toEqual calls, e.g.:
expect(registry.stats()).toEqual({
  enqueued: 0,
  processing: 0,
  failed: 0,
  retryQueue: 0,   // ← add this field everywhere
  finished: 0,
  dead: 0,
});

// New scenario — when a job is in the retryQueue:
describe('when a job has been promoted to retryQueue', () => {
  beforeEach(() => {
    registry.enqueue({ parameters: { value: 1 } });
    const job = registry.pick();
    job.readyBy = 0;          // already ready
    registry.fail(job);
    registry.promoteReadyJobs();
  });

  it('returns retryQueue count of 1 and failed count of 0', () => {
    expect(registry.stats()).toEqual({
      enqueued:   0,
      processing: 0,
      failed:     0,
      retryQueue: 1,
      finished:   0,
      dead:       0,
    });
  });
});
```

---

### `source/spec/services/WorkersAllocator_spec.js`

The `_canAllocate()` method now checks `hasReadyJob()` instead of `hasJob()`.
The existing tests still pass because `hasReadyJob()` returns `true` when
`enqueued` has items. Add one new scenario to pin the new contract:

```js
describe('when there is an idle worker and only a failed (cooling-down) job', () => {
  beforeEach(() => {
    job = jobRegistry.enqueue({});
    const picked = jobRegistry.pick();
    picked.readyBy = Date.now() + 10_000; // still in cooldown
    jobRegistry.fail(picked);
    // failed queue has the job; retryQueue is empty
  });

  it('does not allocate any worker', () => {
    expect(workersRegistry.hasIdleWorker()).toBeTrue();
    expect(jobRegistry.hasJob()).toBeTrue();       // engine keeps running
    expect(jobRegistry.hasReadyJob()).toBeFalse(); // but allocator must skip

    allocator.allocate();

    expect(worker.job).toBeUndefined();
    expect(worker.perform).not.toHaveBeenCalled();
  });
});
```

---

### `source/spec/services/Engine_spec.js` — async and cooldown tests

All existing `engine.start()` calls must become `await engine.start()` and each
`it` callback becomes `async`.

New scenarios to add:

```js
describe('when jobs fail but eventually expire cooldown', () => {
  beforeEach(() => {
    // Use a real DummyJob that always fails so we can control retryQueue promotion
    DummyJob.setSuccessRate(0);
    jobRegistry.enqueue({ resourceRequest: {}, parameters: {} });

    // Override promoteReadyJobs to immediately promote (bypass 5-second wait)
    spyOn(jobRegistry, 'promoteReadyJobs').and.callFake(() => {
      // Call original but first make all failed jobs ready
      jobRegistry['_forceReadyAllFailed']?.();
      jobRegistry.promoteReadyJobs.and.callThrough();
    });
  });

  // NOTE: because DummyJob exhausts after 3 failures the job ends in dead queue
  it('eventually moves exhausted jobs to dead queue', async () => {
    await engine.start();
    expect(jobRegistry.hasJob()).toBeFalse();
    expect(dead.size()).toBe(1);
  });
});

describe('when all remaining jobs are in cooldown', () => {
  let sleepSpy;

  beforeEach(() => {
    // Spy on the private #sleep via the allocator side-effect
    // We force promoteReadyJobs to do nothing for the first call, then promote on the second
    let callCount = 0;

    DummyJob.setSuccessRate(0);
    jobRegistry.enqueue({ resourceRequest: {}, parameters: {} });

    spyOn(jobRegistry, 'promoteReadyJobs').and.callFake(() => {
      callCount++;
      if (callCount > 1) {
        // make the job immediately ready so the engine can exit
        jobRegistry.promoteReadyJobs.and.callThrough();
      }
    });
  });

  it('calls allocate only when hasReadyJob returns true', async () => {
    spyOn(engine.allocator, 'allocate').and.callThrough();
    await engine.start();
    // On the first cycle promoteReadyJobs does nothing → allocate is NOT called
    // On subsequent cycles jobs become ready → allocate IS called
    expect(engine.allocator.allocate).toHaveBeenCalled();
  });
});

describe('promoteReadyJobs is called every cycle', () => {
  beforeEach(() => {
    jobRegistry.enqueue({ resourceRequest: {}, parameters: {} });
    jobRegistry.enqueue({ resourceRequest: {}, parameters: {} });
    spyOn(jobRegistry, 'promoteReadyJobs').and.callThrough();
  });

  it('calls promoteReadyJobs at least once per job processed', async () => {
    await engine.start();
    expect(jobRegistry.promoteReadyJobs).toHaveBeenCalled();
  });
});
```

---

## File Change Summary

| File | Change type |
|------|-------------|
| `source/lib/models/Job.js` | Add `readyBy`, `isReady()` |
| `source/lib/registry/JobRegistry.js` | Add `#retryQueue`, update constructor, `fail()`, `pick()`, `hasJob()`, add `hasReadyJob()`, `promoteReadyJobs()`, update `stats()` |
| `source/lib/services/WorkersAllocator.js` | `_canAllocate()` → `hasReadyJob()` |
| `source/lib/services/Engine.js` | `start()` async, call `promoteReadyJobs()`, add `#sleep()` |
| `source/spec/models/Job_spec.js` | New `#isReady` tests |
| `source/spec/registry/JobRegistry_spec.js` | Pass `retryQueue` to constructor; updated `#fail`, `#hasJob`, `#pick`; new `#hasReadyJob`, `#promoteReadyJobs` |
| `source/spec/registry/JobRegistry_stats_spec.js` | Pass `retryQueue` to constructor; add `retryQueue` field to all expectations; new retryQueue scenario |
| `source/spec/services/WorkersAllocator_spec.js` | New `_canAllocate` scenario with cooling-down job |
| `source/spec/services/Engine_spec.js` | Make all `it` callbacks async; tests for sleep path, `promoteReadyJobs` calls, and cooldown cycle |
