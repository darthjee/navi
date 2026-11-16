# Open questions

[Engine Graceful Shutdown](../engine-shutdown.md)

Items left for the implementation sub-issues to settle. Each sub-issue updates this file as it resolves its items.

- **Drain-observation granularity** (#1009): with `sleepMs` polling, a short drain is only observed on the next tick. Is that acceptable without the hook?
- **Hook wiring** (#1010): how `Engine` wires `onWorkerIdle` into `WorkerFactory` and wakes the loop on it.
- **Docs placement** (#1011): where the new API and its caveats (`start()` resolving with work in flight, frozen retry promotion) belong in the README and guides.
