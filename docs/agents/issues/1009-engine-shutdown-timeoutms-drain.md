# Issue: Engine: shutdown({ timeoutMs }) drain

## Description
Add a graceful drain to the `deku-swarm` `Engine`: `await engine.shutdown({ timeoutMs })` → `Promise<boolean>`. It stops taking new work, waits for the in-flight `Worker.perform()` calls to finish (bounded by `timeoutMs`), and makes `start()` resolve. The design source of truth is the spec `docs/agents/specs/engine-shutdown.md` and its topic files, merged by #1008. Part of Epic #1004. Responsible agent: deku-swarm.

## Problem
`Engine.stop()` only sets a flag that is checked at the next loop iteration. `start()` holds no reference to in-flight `perform()` promises: `WorkersAllocator._allocateNext()` calls `assign()` and `perform()` fire-and-forget. With `keepAlive: true`, `#shouldContinue()` is always `true` and `stop()` is the only exit. Hosts that want a graceful shutdown (e.g. darthjee/kerghan#479) have to hand-roll "poll `WorkersRegistry.hasBusyWorker()`, then `stop()`".

## Expected Behavior
- `shutdown({ timeoutMs })` enters a `#draining` state. `keepAlive` is **not** modified.
- During a drain the loop keeps ticking, but skips `promoteReadyJobs()`, `allocator.allocate()` and the idle-timeout tracking.
- The promise resolves `true` once no worker is busy, and `false` if `timeoutMs` elapses first. `start()` resolves in both cases. On timeout, running `perform()` calls are left untouched.
- Jobs in `#enqueued`, `#retryQueue` and `#failed` are untouched. Cooling-down jobs are not promoted during the drain.

### Pinned edge cases
- **Before `start()`, or after the loop exited:** resolves immediately with `!hasBusyWorker()`. It never throws and never starts the loop.
- **Called twice:** the second call joins the first, with the same result. The timeout is not reset.
- **`timeoutMs` omitted or `0`:** no wait. Resolves with the current pool state.
- **`stop()` stays the hard exit:**
  - `shutdown()` while `#stopped` is already set behaves like the "loop already exited" case: it resolves immediately with `!hasBusyWorker()` and never restarts the loop.
  - `stop()` during a drain ends the loop at the next tick. The pending `shutdown()` then resolves with `!hasBusyWorker()` at that moment (it may be `false`).
- **Never hangs:** the `shutdown()` promise settles whenever the loop exits, for any reason (drained, timed out, or stopped).

## Solution
In `deku-swarm/lib/services/Engine.js`:
- Add `#draining`, `#drainStartedAt`, `#drainTimeoutMs` and `#drainTimedOut`, plus a shared pending drain promise so that a second call can join the first.
- Keep the `while (!this.#stopped && this.#shouldContinue())` guard unchanged, and add the drain branch:
  ```js
  #shouldContinue() {
    if (this.#draining) return this.#workersRegistry.hasBusyWorker() && !this.#drainTimedOut;
    return this.#keepAlive || this.#continueAllocating();
  }
  ```
- Each tick during a drain:
  - update `#drainTimedOut = Date.now() - #drainStartedAt >= timeoutMs`;
  - skip promotion, allocation and `#checkIdleTimeout()`;
  - poll `hasBusyWorker()` (reusing `sleepMs`).
- When `start()`'s loop exits, settle the pending drain promise with `!hasBusyWorker()`.

### Timeout precision
- The timeout is tick-granular and may overshoot by up to one `sleepMs` (500 ms by default). This is documented in the JSDoc.
- No dedicated `setTimeout` is used, so there is no timer to clear and no handle keeping the process alive. #1010's `onWorkerIdle` hook will later wake the loop early when the pool empties.
- `sleepMs < 0` is a test-only setting that yields only microtasks, which is unchanged behavior. During a drain, `perform()` can then only settle through microtasks, so specs use worker stubs that settle synchronously or a small positive `sleepMs`.

### Spec updates (source of truth)
- `docs/agents/specs/engine-shutdown/edge-cases.md`: replace the "While `#stopped` is already set — drains…; `stop()` does not abort an in-progress drain" row with the hard-exit rule above, and add the "`stop()` during a drain" row.
- `docs/agents/specs/engine-shutdown/open-questions.md`: resolve **Drain-observation granularity (#1009)**. Tick granularity is accepted, the overshoot is at most one `sleepMs`, and #1010 tightens it.

### Specs (Jasmine, `deku-swarm/spec/services/`)
- Drain with `keepAlive: true` → `true`.
- Timeout with a job still in `perform()` → `false`.
- An already-idle pool → `true` immediately.
- Queues are left untouched, and nothing is promoted during the drain.
- A second call is idempotent.
- A call before `start()` resolves.
- `start()` resolves while the queues still hold jobs.
- `start()` resolves on timeout with a job still in flight.
- `shutdown()` while stopped resolves immediately with `!hasBusyWorker()`.
- `stop()` during a drain resolves the pending `shutdown()` with the pool state at that moment.

### Versioning
- This is an additive API, so it gets a minor bump: `deku-swarm` 1.12.0 → 1.13.0 via `bump_version.sh` (see `docs/agents/release.md`).

## Benefits
- Hosts get a one-call, bounded graceful shutdown instead of hand-rolled polling.
- `start()` always resolves after a drain, so callers can `await` both.
- No change to existing behavior when `shutdown()` is never called.
