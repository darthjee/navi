# EmissionRegistry static facade + bootstrap

Create `EmissionRegistry` / `EmissionRegistryInstance`, mirroring
`source/lib/registry/LogRegistry.js` / `LogRegistryInstance.js`, and build it once at
bootstrap.

`EmissionRegistryInstance` — `constructor({ retention } = {})` → `this.#store = new EmissionStore(retention)`.
Delegating methods: `incExtracted(n)`, `recordEmission(details)`, `getRecords({ lastId } = {})`
(filter via `new LogFilter(this.#store.getRecords()).filter({ lastId })` — `LogFilter` keys
on `.id`, which `EmissionRecord` has, so it is reusable as-is), `getRecordById(id)`,
`clear()`, `get counts()`, `get store()` (parallels `LogRegistryInstance.get bufferedLogger()`).

`EmissionRegistry` — static `#instance`, `build(options = {})` (throws if already built,
same message style as `LogRegistry`), `reset()`, and static pass-throughs. Split strictness:

- `build` and the **read** helpers (`getRecords`, `getRecordById`, `counts`, `clear`) use a
  strict `#getInstance()` that throws `'EmissionRegistry has not been built. Call EmissionRegistry.build() first.'`.
- The **write** helpers `incExtracted(n)` and `recordEmission(details)` must **no-op when
  `#instance` is null** (guard at the top, `return` silently) so that jobs can call them
  unconditionally without every job spec having to build the registry. Document this
  asymmetry in the JSDoc.

Bootstrap: in `source/lib/services/application/ApplicationConfigurator.js`, right after
`LogRegistry.build({ retention: config.logConfig.size })`, add
`EmissionRegistry.build({ retention: config.emitConfig.size })` (see step 04 for
`config.emitConfig`). No need to expose it on `ConfigStore`.

Specs: `EmissionRegistryInstance_spec.js` (delegation to a store, `getRecords` lastId
filtering, `counts`) and `EmissionRegistry_spec.js` mirroring
`source/spec/lib/registry/LogRegistry_spec.js` — `build` twice throws, read helpers throw
before `build`, **write helpers silently no-op before `build`**, `reset()` clears, static
methods delegate after `build`. Add an `ApplicationConfigurator` spec assertion that
`EmissionRegistry` is built with the configured retention (and `EmissionRegistry.reset()`
in `afterEach`). 100% diff coverage.

## Files to Change

- `source/lib/registry/EmissionRegistryInstance.js` — new; wraps one `EmissionStore`.
- `source/lib/registry/EmissionRegistry.js` — new static facade; write helpers no-op when unbuilt.
- `source/lib/services/application/ApplicationConfigurator.js` — build `EmissionRegistry` from `config.emitConfig.size`.
- `source/spec/lib/registry/EmissionRegistryInstance_spec.js` — new spec.
- `source/spec/lib/registry/EmissionRegistry_spec.js` — new spec.
- `source/spec/lib/services/application/ApplicationConfigurator_spec.js` — assert `EmissionRegistry` bootstrap (reset in teardown).
