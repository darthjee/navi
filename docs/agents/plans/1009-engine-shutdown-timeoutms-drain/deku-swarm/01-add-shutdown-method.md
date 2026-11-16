# Add drain state and the shutdown() method
Add private fields to `Engine`:
- `#draining = false`
- `#drainStartedAt = null`
- `#drainTimeoutMs = 0`
- `#drainTimedOut = false`
- `#running = false`, set at loop entry and cleared at loop exit
- `#drainPromise = null` and its `#resolveDrain` callback

Add `shutdown({ timeoutMs = 0 } = {})` → `Promise<boolean>`:
- **Already draining:** return the existing `#drainPromise`. A second call joins the first and does not reset the timeout.
- **Loop not running** (before `start()`, after it exited, or `#stopped` already set): resolve immediately with `!workersRegistry.hasBusyWorker()`. Never throw, and never start the loop.
- **`timeoutMs` is `0` or omitted:** resolve immediately with `!hasBusyWorker()`. Also set `#draining` with an already-elapsed timeout, so the loop exits at the next tick.
- **Otherwise:**
  - set `#draining = true` and `#drainStartedAt = Date.now()`;
  - store `timeoutMs`;
  - create `#drainPromise`, which is settled by step 02 when the loop exits.

Write JSDoc that documents:
- the boolean result;
- tick-granular timeout precision: the overshoot is at most one `sleepMs`;
- that `start()` may resolve with `perform()` still in flight on timeout;
- that `stop()` remains a hard exit.

## Files to Change
- `deku-swarm/lib/services/Engine.js`: new fields and the `shutdown()` method.
