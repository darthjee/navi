# Wire the drain into the start() loop
- Keep the `while (!this.#stopped && this.#shouldContinue())` guard unchanged. `stop()` must still end the loop at the next tick, even mid-drain.
- Add the drain branch to `#shouldContinue()`:
  ```js
  if (this.#draining) return this.#workersRegistry.hasBusyWorker() && !this.#drainTimedOut;
  return this.#keepAlive || this.#continueAllocating();
  ```
- Make sure `#drainTimedOut` is up to date before the guard is evaluated: set `#drainTimedOut = Date.now() - #drainStartedAt >= #drainTimeoutMs`. Either do this inside the drain branch or in a small `#updateDrainTimeout()` helper called from it.
- In the loop body, while `#draining`, skip `promoteReadyJobs()`, `allocator.allocate()` and `#checkIdleTimeout()`, then `await this.#sleep()` as usual.
- Wrap the loop so that, after it exits for any reason (drained, timed out, or `stop()`), `start()` clears `#running` and settles any pending `#drainPromise` with `!hasBusyWorker()`. Use `try/finally`, so a rejected iteration never leaves `shutdown()` hanging.
- Update the class-level JSDoc and the `start()`/`stop()` JSDoc to mention the drain.

## Files to Change
- `deku-swarm/lib/services/Engine.js`: `start()`, `#shouldContinue()`, and a new timeout helper.
