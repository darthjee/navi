# Inject JobRegistry/WorkersRegistry/logger dependencies

Refactor `Engine`, `WorkersAllocator`, and `Worker` (still in `source/lib/` at this point) so they no longer reach for Navi's static registries or `LogContext` directly — a prerequisite before any of them can move into a standalone package. No behavior change: every existing test must still pass once mocks are updated to inject dependencies via constructor instead of stubbing statics.

| Class | Today (static) | After (injected) |
| --- | --- | --- |
| `WorkersAllocator` | `JobRegistry.pick()`, `JobRegistry.requeue()`, `WorkersRegistry.hasIdleWorker()`, `WorkersRegistry.getIdleWorker()` | Constructor: `{ jobRegistry, workersRegistry }` |
| `Engine` | `JobRegistry.promoteReadyJobs()`, `JobRegistry.hasReadyJob()`, `JobRegistry.hasJob()`, `WorkersRegistry.hasBusyWorker()` | Constructor: `{ allocator, jobRegistry, workersRegistry, sleepMs, keepAlive, idleTimeoutMs, onIdleTimeout }` |
| `Worker` | `import { LogContext } from '../utils/logging/LogContext.js'` + `new LogContext(...)` hardcoded | Constructor receives `loggerFactory`; `perform()` calls `this.#loggerFactory({ workerId, jobId })` |

`ApplicationInstance.buildEngine()` and `#initRegistries()` build and pass these injected dependencies. `LogContext` stays in Navi — `ApplicationInstance` wraps it as a factory (`({ workerId, jobId }) => new LogContext({ workerId, jobId })`) and passes it through to `WorkerFactory`, which injects it into each `Worker` it creates.

## Files to Change

- `source/lib/services/Engine.js` — drop static `JobRegistry`/`WorkersRegistry` imports and calls; accept them via constructor.
- `source/lib/services/WorkersAllocator.js` — same: constructor-injected `jobRegistry`/`workersRegistry` instead of static calls.
- `source/lib/background/Worker.js` — drop the direct `LogContext` import; accept and use an injected `loggerFactory`.
- `source/lib/background/WorkerFactory.js` — accept and forward `loggerFactory` into each `Worker` it builds.
- `source/lib/services/ApplicationInstance.js` — `buildEngine()`/`#initRegistries()` construct `Engine`/`WorkersAllocator` with the injected registries, and build the `loggerFactory` wrapping `LogContext` to pass to `WorkerFactory`.
- `source/spec/lib/services/Engine_spec.js`, `Engine_async_spec.js`, `source/spec/lib/services/WorkersAllocator_spec.js`, `source/spec/lib/background/Worker_spec.js` — update mocks/doubles to pass dependencies via constructor instead of stubbing static methods.
