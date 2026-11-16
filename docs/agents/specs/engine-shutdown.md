# Feature: Engine Graceful Shutdown

`deku-swarm`'s `Engine` will gain an awaitable drain, `await engine.shutdown({ timeoutMs })`, that resolves `true` when no worker is busy any more and `false` when `timeoutMs` elapsed with work still in flight. In both cases `start()` resolves too. Today `Engine.stop()` only sets a flag and, with `keepAlive: true`, the loop never ends on its own, so hosts (e.g. darthjee/kerghan#479) hand-roll a "poll `hasBusyWorker()`, then `stop()`" sequence. See Epic [#1004](https://github.com/darthjee/navi/issues/1004) and its sub-issues #1008 (this spec), #1009 (`Engine.shutdown()`), #1010 (`onWorkerIdle` hook) and #1011 (docs fold-in).

This is a **temporary spec**: it is removed by #1011 once the work is folded into the permanent docs (see [Specs](../specs.md)).

| Topic | Description |
|---|---|
| [Semantics](engine-shutdown/semantics.md) | The `shutdown({ timeoutMs })` API, the `#draining` state, what is frozen during drain, guarantees and design decisions. |
| [Loop exit](engine-shutdown/loop-exit.md) | Why clearing `keepAlive` is not enough and the explicit drain branch in `#shouldContinue()`. |
| [Edge cases](engine-shutdown/edge-cases.md) | Pinned behaviour for early, late, repeated and zero-timeout calls. |
| [Idle hook](engine-shutdown/idle-hook.md) | The optional `onWorkerIdle` wake-up hook in `Worker` / `WorkerFactory` (#1010). |
| [Testing](engine-shutdown/testing.md) | The Jasmine cases to add under `deku-swarm/spec/`. |
| [Out of scope](engine-shutdown/out-of-scope.md) | Flush mode, drain events, Navi adoption and cooperative cancellation. |
| [Versioning](engine-shutdown/versioning.md) | The minor bump `1.12.0` to `1.13.0`. |
| [Open questions](engine-shutdown/open-questions.md) | Items left for the implementation sub-issues to settle. |
