# Plan: Refactor ApplicationInstance

Issue: [731-refactor-applicationinstance.md](../../issues/731-refactor-applicationinstance.md)

## Overview

Slim `ApplicationInstance` by removing two couplings: `#configPath` (+ `#bufferedLogger`) collapses into a single `#configStore` holding a new `ConfigStore` class returned by `ApplicationConfigurator.load()`, and the test-only `#workers` constructor param is dropped. To support that, `deku-swarm` gains idempotent `WorkersRegistry.ensureBuild` / `JobRegistry.ensureBuild` primitives, an idempotent `WorkersRegistry.initWorkers()`, and registry defaults in the `Engine` constructor (so `buildEngine()` stops hand-plumbing the singletons). `deku-swarm` bumps to `1.8.0` and its guides are updated for the now-optional `Engine` registry args and the new `ensureBuild` methods.

## Agents involved

- [engine](engine.md) — `source/`: `ConfigStore`, `ApplicationConfigurator`, `ApplicationInstance`, `RegistriesBuilder`, and their specs.
- [worker](worker.md) — `worker/` (deku-swarm): `Engine` ctor defaults, `WorkersRegistry.ensureBuild` + idempotent `initWorkers`, `JobRegistry.ensureBuild`, JSDoc, `worker/package.json` `1.8.0`, `worker/README.md`, worker specs.
- [docs](docs.md) — `docs/guides/deku-swarm/*.md`: reflect the optional `Engine` registry args and the new `ensureBuild` / idempotency semantics.

## Shared contracts

### deku-swarm API changes — produced by `worker`, consumed by `engine` and `docs`

**`WorkersRegistry.ensureBuild(options = {})`** (static, new)
- Behavior: `if (!#instance) return build(options); return #instance;`
- On an **already-built** singleton it is a **pure no-op**: does not reconstruct, does not re-run `initWorkers`, and **ignores `options`** entirely. The first build wins.
- Returns the singleton instance either way.
- `build()` keeps its existing "throws if already built" behavior — unchanged.

**`JobRegistry.ensureBuild(options = {})`** (static, new)
- Identical contract to `WorkersRegistry.ensureBuild`.

**`WorkersRegistry.initWorkers()`** — becomes idempotent
- Guard at the top: if the pool already has workers (`#workers.hasAny()` on the instance, exposed as needed), return immediately without building more.
- A second call is a no-op — it must **not** double the pool.
- It must **not** short-circuit on `quantity`: `quantity: 0` still runs its (0-iteration) loop and leaves `hasAny()` false (edge case E5).

**`Engine` constructor** — `jobRegistry` / `workersRegistry` become optional
- Default `jobRegistry` to the `JobRegistry` class and `workersRegistry` to the `WorkersRegistry` class, both imported from `../background/`.
- Destructuring defaults fire **only on `undefined`** — any injected value (a facade class or a plain instance) always wins. Passing `null` is unsupported (bypasses the default → breaks `WorkersAllocator`).
- No `EngineFactory`, no `Engine.build` static — the default lives in the constructor itself.
- The existing `allocator = allocator || new WorkersAllocator({ jobRegistry, workersRegistry })` line is unchanged; it now receives defined values.
- No circular-import risk: `worker/lib/background/` does not import from `worker/lib/services/`.

**`worker/package.json` version**: `1.7.0` → `1.8.0` (minor — purely additive).

### How `engine` consumes the above

- `RegistriesBuilder.build({ config })` (no `workers` param) calls:
  - `WorkersRegistry.ensureBuild({ factory: new WorkerFactory({...}), ...config.workersConfig })` instead of `.build(...)`.
  - `JobRegistry.ensureBuild({ cooldown: config.workersConfig.retryCooldown, maxRetries: config.workersConfig.maxRetries })` instead of `.build(...)`.
  - keeps the separate `WorkersRegistry.initWorkers()` call (now idempotent).
- `ApplicationInstance.buildEngine()` constructs `new Engine({ sleepMs, keepAlive, idleTimeoutMs, onIdleTimeout })` with **no** `jobRegistry` / `workersRegistry`; its import narrows to `import { Engine } from 'deku-swarm'`.
- `source/package.json` is **not** touched — it depends on `"deku-swarm": "file:../worker"` with no version range, so it moves in lockstep.

### `ConfigStore` shape — internal to `engine`

New class `source/lib/services/application/ConfigStore.js`:
- Constructed by `ApplicationConfigurator.load()` with `{ config, bufferedLogger, entryFilePath }`.
- Exposes three named getters: `config`, `bufferedLogger`, `entryFilePath`.
- `entryFilePath` holds the **raw `configPath` argument verbatim** — never resolved/absolutized (edge case E1).
- No passthrough getters (`workersConfig` etc. are reached via `.config`).

## CI Checks

- `source/`: `cd source && npm test` (CI job: `jasmine`), `cd source && npm run lint` (CI job: `checks`)
- `worker/`: `cd worker && npm test` (CI job: `jasmine-worker`), `cd worker && npm run lint` (CI job: `checks-worker`). On a version-tagged build, `check-and-publish-worker` detects the `worker/` diff and publishes `deku-swarm@1.8.0`.

## Notes

- Order of merge does not matter for correctness (`file:` dep, lockstep), but the `worker` changes are the contract source — review those first.
- `JobFactory` re-registration inside `RegistriesBuilder` still overwrites a spec's dummy factory; job-factory mocking stays in the "register the dummy *after* `loadConfig`" order (issue: out of scope).
- E4 audit: the existing `worker/spec/services/Engine_spec.js` cases all inject `jobRegistry: JobRegistry, workersRegistry: WorkersRegistry` explicitly, so the default change should not break them — confirm during implementation, don't assume.
