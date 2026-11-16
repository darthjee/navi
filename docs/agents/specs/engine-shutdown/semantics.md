# Semantics

[Engine Graceful Shutdown](../engine-shutdown.md)

```js
const drained = await engine.shutdown({ timeoutMs: 10000 }); // true | false
```

`shutdown({ timeoutMs })` returns `Promise<boolean>`: `true` when the pool drained within the timeout, `false` when the timeout elapsed with work still in flight.

## Behaviour

1. `Engine` enters a `#draining` state. `keepAlive` is **not** modified; it stays an immutable constructor option.
2. The loop keeps running (it does not exit early). During drain it skips `promoteReadyJobs()`, skips `allocator.allocate()` and freezes the idle-timeout tracking.
3. It waits until no worker is busy, or until `timeoutMs` elapses.
4. `start()` resolves, on drain and on timeout, and the drain outcome is returned to the caller.
5. On timeout, in-flight `perform()` calls are left untouched: no cancellation, no interruption. The caller decides whether to kill the process. `shutdown()` never silently drops running work.

## Idle detection

Idle detection will poll `workersRegistry.hasBusyWorker()` at each loop tick, reusing `sleepMs`, with no change to `Worker` or `WorkerFactory`. A faster wake-up is possible through the optional [idle hook](idle-hook.md).

## Queues

`#enqueued`, `#retryQueue` and `#failed` are untouched and not lost by the call. Jobs in `#failed` whose cooldown elapses during the drain are **not** promoted to `#retryQueue` and stay in `#failed` until a later run. This is intended, not a bug.

## Expected guarantees

- After `shutdown()` resolves `true`, no job is mid-`perform()`.
- After it resolves `false`, at most the jobs already running remain in flight, and the return value says so.
- Jobs pending in `#enqueued`, `#retryQueue` and `#failed` are untouched and not lost.
- The process is free to exit after `start()` resolves, without a further `stop()` call.

## Design decisions

| Decision | Choice | Rationale |
|---|---|---|
| Where it lives | `Engine` only, no `WorkersRegistry.whenIdle()` | `keepAlive` and `#shouldContinue()` live in `Engine`; a registry primitive could not end the loop. |
| Return value | Boolean | Answers the caller's only real question: did it drain? `stats()` remains available for diagnostics. |
| `keepAlive` mutability | Stays immutable; `shutdown()` does not touch it | Clearing it would not end the loop when jobs are queued (`hasJob()` stays true). An explicit `#draining` branch is required anyway. |
| Loop exit during drain | Explicit `#draining` branch in `#shouldContinue()`: continue only while a worker is busy and the timeout has not elapsed | Keeps all exit logic inside the loop; queued jobs cannot block the shutdown. |
| `start()` on timeout | Resolves, even with jobs still in flight | The caller asked for a bounded wait; the `false` return value signals leftover work. |
| Retry promotion during drain | Frozen with allocation | Keeps the pool fully static; cooling-down jobs stay in `#failed` until a later run. |
| Timeout with work in flight | Jobs keep running; no cancellation | Cooperative cancellation would need a signature change to `Job.perform()` and is [out of scope](out-of-scope.md). |
