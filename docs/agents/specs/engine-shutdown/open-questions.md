# Open questions

[Engine Graceful Shutdown](../engine-shutdown.md)

Items left for the implementation sub-issues to settle. Each sub-issue updates this file as it resolves its items.

- ~~**Drain-observation granularity** (#1009)~~: resolved. Tick granularity is accepted; the timeout overshoots by at most one `sleepMs`, and #1010's hook tightens the drained case.
- **Hook wiring** (#1010): how `Engine` wires `onWorkerIdle` into `WorkerFactory` and wakes the loop on it.
- **Docs placement** (#1011): where the new API and its caveats (`start()` resolving with work in flight, frozen retry promotion) belong in the README and guides.
