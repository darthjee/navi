# RegistriesBuilder: accept and forward onWorkerIdle

Make `RegistriesBuilder#build` take an optional `onWorkerIdle` callback and pass it to the `WorkerFactory` it builds, so every worker calls it when it goes idle. When it is omitted, behavior is unchanged: `WorkerFactory` and `Worker` default it to a no-op.

1. Change the signature to `build({ config, onWorkerIdle })` and update the JSDoc with `@param {Function} [params.onWorkerIdle] - Called with no arguments whenever a worker becomes idle after a job (wired to Engine#wake()).`
2. Build the factory with `new WorkerFactory({ jobRegistry: JobRegistry, workersRegistry: WorkersRegistry, loggerFactory, onWorkerIdle })`.
3. Specs in `RegistriesBuilder_spec.js`, in a new `describe('onWorkerIdle')`. Use the real deku-swarm classes:
   - **Hook passed, job succeeds:** build with `onWorkerIdle: jasmine.createSpy('onWorkerIdle')`. Take a worker from `WorkersRegistry` (e.g. via `WorkersRegistry.getIdleWorker()` or the registry's equivalent accessor; check `deku-swarm/lib/registry/WorkersRegistryInstance.js`), give it a stub job that resolves, `await worker.perform()`, and expect the spy to have been called once.
   - **Hook passed, job fails:** same, with a job whose `perform` rejects (or throws). The spy is still called.
   - **Hook omitted:** `build({ config })` still initializes 5 idle workers. The existing spec covers this; add a `perform()` smoke test asserting no throw.
   - If assigning a job directly is awkward, assert instead that the built worker's behavior calls the hook, by spying through `WorkerFactory.prototype.build` and checking the passed attributes include `onWorkerIdle`. Prefer the behavioral test.

## Files to Change
- `source/lib/services/builders/RegistriesBuilder.js`: accept `onWorkerIdle` and pass it to `WorkerFactory`; update the JSDoc.
- `source/spec/lib/services/builders/RegistriesBuilder_spec.js`: specs for the hook being invoked after success and after failure, and for the default.
