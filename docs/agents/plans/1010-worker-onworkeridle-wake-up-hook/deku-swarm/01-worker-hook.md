# onWorkerIdle on Worker and WorkerFactory

Add the optional wake-up hook to workers and forward it from the factory.

- `Worker` constructor:
  - accepts `onWorkerIdle`, defaulting to `() => {}`;
  - stores it in a private `#onWorkerIdle`;
  - documents it in the JSDoc.
- `Worker#perform()`: in the `finally`, after `this.#workersRegistry.setIdle(this.id)`, call a private helper that invokes `this.#onWorkerIdle()` with no arguments inside `try/catch`.
  - On error, log `logContext.warn(...)` naming the worker id and the error.
  - `logContext` is already built at the top of `perform()`, so it is available in `finally`.
  - Never rethrow.
- `WorkerFactory` constructor:
  - accepts `onWorkerIdle` and includes it in `#registries`, so `build()` forwards it;
  - documents it in the JSDoc.
  - When it is `undefined`, the `Worker` default applies, since destructuring defaults treat `undefined` as missing.

## Files to Change
- `deku-swarm/lib/background/Worker.js`: new attribute, hook call in `finally`, isolated error handling.
- `deku-swarm/lib/background/WorkerFactory.js`: accept and forward `onWorkerIdle`.
