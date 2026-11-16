# Issue: Worker: onWorkerIdle wake-up hook

## Description

Let a `deku-swarm` host cut engine latency below `sleepMs` by waking the `Engine` loop as soon as a worker finishes a job. This needs an optional, payload-less `onWorkerIdle` hook on `Worker` and a public `Engine#wake()` that the host wires to it.

## Problem

`Engine.shutdown({ timeoutMs })` checks `workersRegistry.hasBusyWorker()` only once per loop tick. A drain that finishes in 50 ms is therefore only noticed at the next tick, up to `sleepMs` later (e.g. 500 ms). The same delay applies when a freed worker could take the next ready job.

The only code that knows a `perform()` has ended is the `finally` in `Worker#perform()`, which calls `workersRegistry.setIdle(this.id)`. Nothing outside `WorkersRegistry` is notified.

Workers are built by the host before the `Engine` exists; for example, navi's `RegistriesBuilder` builds its own `WorkerFactory`. So `Engine` cannot inject a callback into the workers itself.

## Expected Behavior

- A host that passes `onWorkerIdle: () => engine?.wake()` to its `WorkerFactory` has `shutdown()` resolve as soon as the last busy worker becomes idle, not at the next tick.
- While running, a freed worker gets the next ready job without waiting `sleepMs`.
- A host that doesn't wire the hook behaves exactly as today (pure polling).

## Solution

Scope: the `deku-swarm` package (code, specs, versions) plus its guide docs. Wiring the hook in navi's own `source/` is tracked in #1017. This follows `docs/agents/specs/engine-shutdown/idle-hook.md`, with one addition: a public `Engine#wake()`.

### Worker / WorkerFactory: `deku-swarm/lib/background/Worker.js`, `WorkerFactory.js`

- `Worker` takes `onWorkerIdle` as a fourth constructor attribute, next to `jobRegistry`, `workersRegistry` and `loggerFactory`. When unset, it defaults to a no-op.
- `WorkerFactory` accepts `onWorkerIdle` and `build()` forwards it.
- `Worker#perform()` calls it in its `finally`, right after `workersRegistry.setIdle(this.id)`, on both the success and the failure path.
- The callback carries **no payload**. It is a wake-up signal, not a state transfer.
- **A throwing callback is isolated.**
  - It runs inside its own `try/catch`.
  - A failure is logged at `warn` through the job's `logContext`.
  - It never rejects `perform()` and never skips `setIdle`.
- `WorkersRegistryInstance`'s default factory (built without `loggerFactory` or `onWorkerIdle`) is unaffected. `WorkersRegistryInstance` does **not** gain an `onWorkerIdle` option; hosts that want the hook pass their own `WorkerFactory`.

### Engine#wake(): `deku-swarm/lib/services/Engine.js`

- `wake()` ends the loop's current sleep early, so the next tick runs immediately. The `setTimeout` sleep becomes interruptible.
- It applies in every mode, not only while draining:
  - **Draining:** the loop re-checks `hasBusyWorker()` right away and can exit before `sleepMs` elapses.
  - **Running:** the next tick promotes ready jobs and allocates without waiting.
- **A wake is latched.**
  - A `wake()` that arrives mid-tick (not sleeping) sets a pending flag.
  - The next sleep is then skipped once, so a completion that lands mid-tick isn't held up for a full `sleepMs`.
- **It is a no-op when the loop is not running.**
  - `wake()` does nothing before `start()`, after the loop has exited, or with `sleepMs < 0`.
  - It never throws and never starts the loop.
  - Any pending latch is cleared when `start()` begins.
- Each `perform()` produces at most one wake-up, so this cannot become a busy loop. A wake with nothing to do just goes back to sleep.

### Host wiring

Nothing is subscribed automatically. The host connects the hook to `wake()` after the fact, through a closure:

```js
let engine;
const factory = new WorkerFactory({
  jobRegistry, workersRegistry, loggerFactory,
  onWorkerIdle: () => engine?.wake()
});
WorkersRegistry.build({ quantity, factory });
engine = new Engine({ /* ... */ });
```

### Alternatives considered

- **A `WorkersRegistryInstance#onIdle(fn)` subscription that `Engine` subscribes to automatically.** Rejected: it needs listener management (unsubscribing, and several engines sharing the singleton registry) and departs from the spec.
- **Waking only while draining.** Rejected: the hook would do nothing in normal running.

### Specs

- **`Worker`:**
  - `onWorkerIdle` fires after `setIdle` on the success and the failure path.
  - An unset callback is a no-op.
  - A throwing callback is logged and does not reject `perform()`.
- **`WorkerFactory`:** the callback is forwarded to built workers.
- **`Engine`:**
  - A drain completes faster than `sleepMs` when `wake()` is called. The spec uses a large `sleepMs` (e.g. `10_000`), real timers, and a fake worker that finishes after a few ms and calls `engine.wake()`. It asserts that `shutdown({ timeoutMs: 20_000 })` resolves `true` within jasmine's default spec timeout; without the wake, it would hang.
  - While running, a wake allocates the next ready job without waiting `sleepMs`.
  - A wake that arrives mid-tick is latched and skips the next sleep.
  - `wake()` is a no-op before `start()` and after the loop exits.

### Docs and versions

- This issue updates the deku-swarm guide (`docs/guides/deku-swarm/`, e.g. `reference.md`) so it documents `onWorkerIdle`, `Engine#wake()` and the wiring example. The feature ships documented; #1011 only folds in the spec.
- The change only adds things (a new optional attribute and a new public method). It ships as a deku-swarm minor bump plus an app patch bump. #1006 also bumps both packages, so whichever lands second re-bumps.

Part of Epic #1004. It depends on #1009 (`Engine.shutdown()`, merged). Responsible agents: deku-swarm (code and specs) and docs (guide).

## Benefits

- Short drains are observed right away instead of up to `sleepMs` later, so host shutdowns (e.g. darthjee/kerghan#479) finish faster.
- Freed workers pick up queued work immediately, which improves throughput when the hook is wired.
- The change is opt-in and additive; existing hosts are unchanged.
