# Specs

Cover the new behaviour with jasmine specs, keeping to the existing spec style and helpers.

- **`Worker_spec.js`:**
  - `onWorkerIdle` is called once, after `setIdle`, when the job succeeds and when it fails. Check the ordering with a spy whose fake asserts that `setIdle` was already called.
  - It is called with no arguments.
  - An unset hook doesn't throw.
  - A throwing hook: `perform()` resolves, `setIdle` was called, and `logContext.warn` was called.
- **`WorkerFactory_spec.js`:** built workers call the given `onWorkerIdle` after `perform()`, and a factory without it builds working workers.
- **New `Engine_wake_spec.js`** (in `deku-swarm/spec/services/`):
  - **Drain via wake:**
    - Setup: `sleepMs: 10_000`, `keepAlive: true`, real timers, and a stub/fake `workersRegistry` whose busy flag clears after a few ms, followed by `engine.wake()`.
    - Assert that `shutdown({ timeoutMs: 20_000 })` resolves `true` and `start()` resolves, both within jasmine's default spec timeout.
  - **Running wake:** a ready job enqueued while sleeping is allocated right after `wake()`, without waiting `sleepMs`. Assert that the allocator was called again.
  - **Latch:** a `wake()` issued mid-tick (e.g. from inside a stubbed `allocator.allocate`) makes the following sleep return immediately.
  - **No-op:** `wake()` before `start()` and after `start()` resolved doesn't throw and doesn't start the loop. A latch set before `start()` doesn't carry over.
- Make sure every spec stops the engine (`stop()` and `wake()`) so no 10 s timer leaks.

## Files to Change
- `deku-swarm/spec/background/Worker_spec.js`: hook specs.
- `deku-swarm/spec/background/WorkerFactory_spec.js`: forwarding specs.
- `deku-swarm/spec/services/Engine_wake_spec.js`: new file for the wake, latch and drain specs.
