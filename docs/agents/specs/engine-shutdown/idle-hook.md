# Idle hook

[Engine Graceful Shutdown](../engine-shutdown.md)

An optional refinement, owned by #1010 and shippable independently of [#1009](semantics.md). It cuts drain latency for short drains below `sleepMs`: with `sleepMs: 500` and polling only, a drain finishing in 50 ms is observed on the next tick.

## Design

- `Worker` gets a fourth constructor attribute, `onWorkerIdle`, next to `jobRegistry`, `workersRegistry` and `loggerFactory`.
- `WorkerFactory#build()` forwards it.
- `Worker#perform()` invokes it in its `finally`, right after `workersRegistry.setIdle(this.id)`.
- The callback carries **no payload**: it is a wake-up, not a state transfer.
- `Engine` re-checks `hasBusyWorker()` on wake-up.
- It must be a safe no-op when unset, including in `WorkersRegistryInstance`'s default factory, which is built without a `loggerFactory`.
