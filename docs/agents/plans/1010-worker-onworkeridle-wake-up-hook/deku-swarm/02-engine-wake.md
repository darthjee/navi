# Engine#wake() and interruptible sleep

Make the loop's sleep interruptible and expose a public `wake()`.

- **New private state:**
  - `#wakeSleep`: the resolver of the current sleep, or `null`;
  - `#sleepTimer`: the pending `setTimeout` handle;
  - `#wakePending = false`: the latch.
- **`#sleep()`:**
  - With `sleepMs < 0`, keep returning `Promise.resolve()`.
  - If `#wakePending` is set, clear it and return `Promise.resolve()`.
  - Otherwise return a promise that resolves on whichever comes first, the timeout or a wake. Store its resolver in `#wakeSleep` and the timer in `#sleepTimer`.
  - On either outcome, clear both fields (and `clearTimeout` on the wake path).
- **`wake()`:**
  - Not `#running`: return.
  - `#wakeSleep` set: call it (which clears the timer and fields).
  - Otherwise: set `#wakePending = true`.
- **`start()`:**
  - Reset `#wakePending = false` at the beginning.
  - In `finally`, make sure no timer or resolver is left behind.
- Update the class JSDoc to describe `wake()` and the `onWorkerIdle` wiring.

## Files to Change
- `deku-swarm/lib/services/Engine.js`: interruptible `#sleep()`, `wake()`, latch reset in `start()`, JSDoc.
