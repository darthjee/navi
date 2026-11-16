# Loop exit

[Engine Graceful Shutdown](../engine-shutdown.md)

## Why clearing `keepAlive` is not enough

Without `keepAlive`, `#shouldContinue()` collapses to `#continueAllocating()`, that is `jobRegistry.hasJob() || workersRegistry.hasBusyWorker()`. `hasJob()` is true whenever `#enqueued`, `#failed` or `#retryQueue` are non-empty. Since the drain must leave those queues untouched (and stops allocating), the loop would never exit, and `start()` would never resolve, whenever there is a backlog at shutdown time.

## The drain branch

`#shouldContinue()` will get an explicit drain branch:

```js
#shouldContinue() {
  if (this.#draining) return this.#workersRegistry.hasBusyWorker() && !this.#drainTimedOut;
  return this.#keepAlive || this.#continueAllocating();
}
```

- While draining, only **busy workers** keep the loop alive; pending jobs in the queues do not.
- The drain timeout also ends the loop (`#drainTimedOut`), so `start()` resolves even when `shutdown()` returns `false`.
- On timeout, `start()` resolves **while in-flight `perform()` calls are still running**. This is intentional: the caller asked for a bounded wait, and the `false` return value tells it that work was left in flight. Hosts must not assume "loop ended" means "all jobs finished".
- The existing `!#stopped` guard in the `while` condition of `start()` is unchanged.

Current code: `deku-swarm/lib/services/Engine.js` (`#keepAlive`, `stop()`, the `start()` loop and `#shouldContinue()`) and `deku-swarm/lib/services/WorkersAllocator.js` (`_allocateNext()` runs `perform()` fire-and-forget).
