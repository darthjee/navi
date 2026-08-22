# Setup sub-page

Create `docs/guides/deku-swarm/setup.md` covering how to wire everything together at application startup, walking through (and expanding on) the `worker/README.md` quick-start example:

- Registering a `JobFactory`: `JobFactory.build(name, options)` where `options` is `{ klass, attributesGenerator, attributes }` — `klass` is the `Job` subclass to build, `attributesGenerator` a function producing per-build attributes, `attributes` values merged into every built job (e.g. shared dependencies). Also cover `JobFactory.get(name)` and `JobFactory.reset()` (test teardown).
- Building the `JobRegistry` singleton: `JobRegistry.build({ cooldown, maxRetries })` — `cooldown` (ms, default `5000`) and `maxRetries` (default `3`) — and `JobRegistry.reset()` between test examples.
- Building the `WorkersRegistry` singleton: `WorkersRegistry.build({ quantity, factory })` — `quantity` sets pool size, `factory` optionally injects a custom `WorkerFactory`; then `WorkersRegistry.initWorkers()` to build and idle the pool. Also cover `WorkersRegistry.reset()`.
- `WorkerFactory` wiring: `new WorkerFactory({ klass, attributesGenerator, jobRegistry, workersRegistry, loggerFactory })` — injecting the registries and a `loggerFactory` (`({ workerId, jobId }) => logger`) into every built worker; note that `Engine`/`WorkerFactory` accept either the static facade classes or plain instances exposing the same method names, for readers who want dependency injection instead of singletons.
- A complete runnable setup snippet in ES Module syntax, end to end from `JobFactory.build` through `WorkersRegistry.initWorkers()`, ready to hand off into [Running the Engine](./running-the-engine.md).

## Files to Change

- `docs/guides/deku-swarm/setup.md` — new sub-page.
