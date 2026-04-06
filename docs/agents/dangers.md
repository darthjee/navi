# Dangers and Pitfalls

## The Application Is Fully Asynchronous

The source application (`source/`) is **100% asynchronous**. Every piece of planning and implementation must account for this fact from the start, or it will introduce subtle, hard-to-catch bugs — especially in tests.

### How Asynchronicity Manifests

`Worker.perform()` is an `async` method. When `WorkersAllocator._allocateWorkerToJob()` calls `worker.perform()`, it does **not** `await` the result. This is intentional:

- The worker begins processing its job in the background via the JavaScript event loop.
- The `Engine` main loop continues immediately, assigning new jobs to other workers.
- Workers complete concurrently, and each calls `workerRegistry.setIdle(workerId)` when done — asynchronously.

This is the correct production behaviour: multiple workers running HTTP requests at the same time.

---

## Tests Use Synchronous Dummies by Design

Tests substitute the real async workers with synchronous dummies (`DummyWorker`, `DummyJob`). This is a **deliberate design choice** that keeps the test suite fast, deterministic, and free of async boilerplate (`async`/`await`, `done` callbacks, `Promise`-based matchers).

| Class | Real behaviour | Dummy behaviour |
|-------|---------------|-----------------|
| `Worker` | `async perform()` — awaits the job, uses the event loop | `perform()` — synchronous, resolves immediately |
| `Job` (real HTTP) | `async perform()` — fires an HTTP request via Axios | `DummyJob.perform()` — synchronous, simulates success/failure via a configurable rate |

Because the dummies are synchronous, the `Engine.start()` while-loop can run to completion within a single call-stack tick, and test assertions can be written without `await` or `done`.

---

## Dangers When Planning Cooldowns, Sleeps, or Waits

### Do not introduce real time-based waits in the Engine loop

`Engine.start()` is synchronous. If you add a real `setTimeout`-based or `Promise`-based sleep inside the Engine loop, the loop will **not** wait for it — a `Promise` returned from an `await sleep(n)` will be scheduled on the microtask queue and the while-condition will be re-evaluated immediately.

To make `Engine.start()` honour a wait, the method itself must become `async` and the sleep must be `await`-ed. This has cascading effects:

1. `Engine.start()` becomes `async`, returning a `Promise`.
2. The call site in `Application` must `await engine.start()`.
3. Entrypoint `navi.js` must also `await` the call.
4. All integration tests that call `engine.start()` synchronously will break.

Plan this refactor explicitly before beginning implementation.

### Synchronous dummies will not simulate a real wait

If you add a cooldown inside `Worker.perform()` (e.g., `await sleep(ms)` between requests), the `DummyWorker.perform()` will not automatically replicate this timing. The Engine tests will continue to run synchronously via `DummyWorker` — which is the desired behaviour for unit tests.

However, if a feature depends on the passage of real time (e.g., "do not retry a job more than once per second"), synchronous dummies will silently skip that timing constraint, and the feature will appear to work in tests but not in production. Always verify timing-sensitive behaviour with an integration or end-to-end test.

### Retry/failed-queue promotion depends on order of execution

The failed queue is only promoted to the main queue **after the main queue is empty** (see `JobRegistry`). In production, this promotion can happen while workers are still processing jobs asynchronously. If you add a cooldown before promotion, ensure it does not race with active workers finishing their current jobs.

---

## Implementation Checklist for Any Async/Timing Feature

Before implementing any feature that involves delays, sleeps, retries, or cooldowns:

1. **Decide where the wait lives**: inside `Worker.perform()`, inside `Engine.start()`, or inside `JobRegistry` promotion logic. Each location has different async implications.
2. **Check if `Engine.start()` needs to become `async`**: if the wait is inside the Engine loop, the answer is yes. Update the loop, the call site, and all tests accordingly.
3. **Update the dummy classes**: decide whether `DummyWorker` and `DummyJob` should simulate the wait (usually no — keep them synchronous for unit tests) and document why.
4. **Write a separate integration/end-to-end test** for any timing-sensitive behaviour that cannot be validated by synchronous dummies.
5. **Do not add real `setTimeout` calls to synchronous dummies**: this will make unit tests slow and non-deterministic.
