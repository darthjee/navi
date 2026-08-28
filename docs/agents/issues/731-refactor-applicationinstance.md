# Issue: Refactor ApplicationInstance

## Description

`ApplicationInstance` (`source/lib/services/application/ApplicationInstance.js`) has grown too large. This refactor removes two couplings that inflate the class, and pulls the supporting behavior into a small dedicated collaborator plus a couple of idempotent `deku-swarm` primitives.

It is one more step in the ongoing `ApplicationInstance` decomposition (recent commits extracted `ResourceQueueFacade`, `EngineStopService`, etc.).

**Objective — eliminate two couplings:**

1. **`#configPath`** — a field kept only to feed `ConfigIncluder` on reload. Becomes a `ConfigStore` object returned by `ApplicationConfigurator.load()`.
2. **`#workers`** — a collection threaded through the constructor into `RegistriesBuilder`. Removed in favour of an idempotent `WorkersRegistry.ensureBuild`.

## Problem

- **`#configPath`** is dead weight on the instance: its sole consumer is the `EngineController` reload callback (`ConfigIncluder.resolve(this.#configPath)`). Config-load state is currently spread across three places on `ApplicationInstance` — `#configPath`, `#bufferedLogger`, and the public `this.config` field.
- **`#workers`** is a constructor param that exists only as a test seam. In production it is always `undefined`; `WorkersRegistryInstance` already defaults `workers = new IdentifyableCollection()`. Its one real use is a single `RegistriesBuilder_spec` assertion that observes `workers.size()` after build.
- The current test seam is fragile: `Application_spec.prepareRunScenario` does `loadApplication` → `WorkersRegistry.reset()` → `build` with a dummy factory → `initWorkers()` — an inverted, order-sensitive dance, because `WorkersRegistry.build()` throws on a second call.
- `ApplicationInstance.buildEngine()` re-imports `JobRegistry`/`WorkersRegistry` only to hand them straight to `Engine`, redundant plumbing once the registries are managed as true singletons elsewhere.

## Expected Behavior

Acceptance criteria:

- [ ] `ApplicationInstance` no longer holds `#configPath` or `#workers`. `#configPath` + `#bufferedLogger` collapse into a single `#configStore`; `this.config` / `bufferedLogger` become getters with optional chaining → `#configStore?.config` / `#configStore?.bufferedLogger` (E2).
- [ ] `ConfigStore.entryFilePath` stores the `configPath` argument verbatim, unresolved (E1).
- [ ] `ApplicationConfigurator.load()` returns a `ConfigStore` (class with getters `config` / `bufferedLogger` / `entryFilePath`).
- [ ] `RegistriesBuilder.build({ config })` (no `workers`) uses `WorkersRegistry.ensureBuild` and `JobRegistry.ensureBuild`.
- [ ] `WorkersRegistry.ensureBuild` / `JobRegistry.ensureBuild` are pure no-ops on an already-built singleton; `WorkersRegistry.initWorkers()` is idempotent. Both documented in JSDoc.
- [ ] `reloadConfig` still works after `#configPath` removal (uses `#configStore.entryFilePath`).
- [ ] `Engine` defaults `jobRegistry`/`workersRegistry` to the singleton classes **only when `undefined`**; `deku-swarm` `Engine` specs still inject custom instances.
- [ ] `ConfigIncluder` stays pure (takes a path string).
- [ ] `worker/package.json` bumped to `1.8.0`.
- [ ] `yarn test` and `yarn lint` green in both packages (`source/` and `worker/`).

## Solution

### Scope

**In scope:**

- `ConfigStore` (new), `ApplicationConfigurator.load()` returning it.
- `ApplicationInstance`: `#configPath` + `#bufferedLogger` → `#configStore`; `this.config` becomes a getter; `#workers` removed from the constructor; `buildEngine()` stops passing registries; `reloadConfig` uses `#configStore.entryFilePath`.
- `RegistriesBuilder`: `workers` param removed; `ensureBuild` on both registries.
- `deku-swarm`: `WorkersRegistry.ensureBuild` + `JobRegistry.ensureBuild`; idempotent `WorkersRegistry.initWorkers()`; registry defaults in the `Engine` constructor; JSDoc for all.
- Specs: `Application_spec` (mock-first ordering), `RegistriesBuilder_spec` (`stats().idle`), `Engine` specs, `ApplicationConfigurator` spec, new `ConfigStore` spec.
- **Bump `worker/package.json` `1.7.0` → `1.8.0`** (minor — purely additive). No new `CHANGELOG.md` (no such convention in the repo); the API delta is described in the PR body. `source/package.json` unchanged (`"deku-swarm": "file:../worker"`, no range).

**Out of scope (do not touch):**

- Internals of `EngineController` / `EngineState` / `RunReporter` / `ResourceQueueFacade`.
- `reload()` semantics — still just re-reads YAML + merges into `NamespaceMap`; **no** registry rebuild on reload.
- The static `Application` facade's public API — unchanged.
- `WebServer` / `buildWebServer`.
- Further `ApplicationInstance` extraction (e.g. an `EngineBuilder`) — a later issue.
- `ConfigIncluder` — stays pure, untouched.
- `JobFactory` re-registration overwrite behavior.
- `Config` / `WorkersConfig` model shape.
- Introducing a `CHANGELOG.md` convention.

### Changes by file

#### 1. `ApplicationConfigurator` (`source/lib/services/application/ApplicationConfigurator.js`)

- `load(configPath)` returns a **`ConfigStore` object** instead of `{ config, bufferedLogger }`.
- `LogRegistry` construction stays here; `ConfigStore` is just a data holder.

#### 2. `ConfigStore` (new)

- **Class with named getters**, not an object literal: `config`, `bufferedLogger`, `entryFilePath`.
- Encapsulates the config-load state currently scattered across `ApplicationInstance` (`#configPath`, `#bufferedLogger`, `this.config`).
- `entryFilePath` holds the raw `configPath` argument verbatim (see E1).

#### 3. `ApplicationInstance`

- **Remove `workers` from the constructor** (and the `#workers` field).
- **Replace `#configPath` + `#bufferedLogger` with a single `#configStore`** (a `ConfigStore`).
- `loadConfig`: `this.#configStore = this.#configurator.load(configPath)`; then `this.#registriesBuilder.build({ config: this.config })`.
- **`this.config` becomes a getter** delegating to `this.#configStore?.config`. Existing call sites (`run()` / `buildEngine()` reading `this.config.workersConfig` / `.webConfig` / `.failureConfig`) stay unchanged, and `ConfigStore` grows no passthrough getters.
- `bufferedLogger`: getter delegates to `this.#configStore?.bufferedLogger`.
- `buildEngine`: **stop passing `jobRegistry: JobRegistry` and `workersRegistry: WorkersRegistry`** to `Engine` (import narrows to `import { Engine } from 'deku-swarm'`).
- **`reloadConfig` (mandatory):** the `EngineController` callback currently uses `ConfigIncluder.resolve(this.#configPath)`. Change to `ConfigIncluder.resolve(this.#configStore.entryFilePath)`. Without this, reload breaks.

#### 4. `RegistriesBuilder` (`source/lib/services/builders/RegistriesBuilder.js`)

- `build({ config, workers })` → `build({ config })` — **no longer receives `workers`**. `WorkersRegistryInstance` already defaults `workers = new IdentifyableCollection()`, so nothing else changes there.
- Swap `WorkersRegistry.build(...)` for **`WorkersRegistry.ensureBuild(...)`** and `JobRegistry.build(...)` for **`JobRegistry.ensureBuild(...)`** (see 4b).
- The separate `WorkersRegistry.initWorkers()` call stays, but becomes idempotent (see 4b).

#### 4b. `WorkersRegistry` / `JobRegistry` — `ensureBuild` + idempotent `initWorkers` (`worker/lib/background/`)

**Motivation (test seam):** today `Application_spec.prepareRunScenario` does `loadApplication` → `WorkersRegistry.reset()` → `build` with a dummy factory → `initWorkers()` — an inverted, fragile order. With `ensureBuild`, specs **set up mocks first, then run**, and the app bootstrap won't clobber them:

```js
WorkersRegistry.build({ quantity: 1, factory: workerFactory });
WorkersRegistry.initWorkers();
app.loadConfig(...)   // RegistriesBuilder → WorkersRegistry.ensureBuild(...) = no-op
```

- **`ensureBuild(opts)`** (`WorkersRegistry` and `JobRegistry`): `if (!#instance) build(opts); return #instance`. On an already-built singleton it is a **pure no-op** — does not reconstruct, does not re-initialize, **does not apply the new `opts`**. First build wins. Document explicitly.
- **`WorkersRegistry.initWorkers()` becomes idempotent:** `if (#workers.hasAny()) return`. So the second call coming from `RegistriesBuilder` (after a spec already built + initialized) **does not double the pool**. `ensureBuild` stays build-only — it does not absorb `initWorkers` (keeps the names honest and lets a spec build without initializing).
- **`JobRegistry.ensureBuild`** is added for symmetry: `RegistriesBuilder` also calls `JobRegistry.build(...)` and would have the same double-call exposure under the "mocks before run" pattern. Same one-liner, same contract.
- **Out of scope:** `JobFactory` re-registration inside `RegistriesBuilder` still overwrites a spec's dummy factory. Job-factory mocking keeps the "register the dummy *after* `loadConfig`" pattern. Not worth solving here.

#### 5. `Engine` (`worker/lib/services/Engine.js`)

**Decision: default in `Engine` itself, no `EngineFactory`.**

- The `Engine` constructor **defaults `jobRegistry`/`workersRegistry` to the singleton classes** `JobRegistry`/`WorkersRegistry` when not passed. `Engine.js` imports both from `../background/`.
- The arguments **remain as a test seam** — `deku-swarm` specs keep injecting custom instances. Destructuring defaults only fire on `undefined`, so an injected value always wins.
- The existing `allocator = allocator || new WorkersAllocator({ jobRegistry, workersRegistry })` line now receives defined values.
- **No circular-import risk:** `worker/lib/background/` does not import from `worker/lib/services/`.
- **No `EngineFactory` and no `Engine.build`.** `ApplicationInstance.buildEngine()` stops passing `jobRegistry`/`workersRegistry` and its import narrows to `import { Engine } from 'deku-swarm'`.
- This is a public-API change to `deku-swarm` — see Compatibility.

#### 6. `ConfigIncluder` (`source/lib/services/config/ConfigIncluder.js`)

**Decision: keep `ConfigIncluder` pure.** It takes `entryFilePath` (a string) in `resolve` and the constructor, as today. The caller (`reloadConfig`) does `ConfigIncluder.resolve(this.#configStore.entryFilePath)`.

- Avoids coupling a generic file-reading utility to the domain's config model.
- **The "exception" (pass `ConfigStore` so `ConfigIncluder` can reuse a cached `entryRaw` instead of re-reading disk) is rejected:** `reload()` exists precisely to re-read disk and pick up changes; reusing a cached parse would serve stale config.
- Both call sites keep their signatures: `ConfigLoader.load()` (`new ConfigIncluder(this.filePath)` + `.entryRaw`, initial load) and the `ApplicationInstance` reload callback.

### Decision summary

| # | Point | Decision |
|---|-------|----------|
| 1 | `run()` / `reloadConfig` | Covered by the refactor — swap `#configPath` for `this.#configStore.entryFilePath` |
| 2 | `ConfigStore` | Class with named getters (`config`, `bufferedLogger`, `entryFilePath`), no passthrough getters; `ApplicationInstance` holds `#configStore` and exposes `this.config` as a getter → `#configStore.config` |
| 3 | `ensureBuild` | `if (!#instance) build(opts)` — pure no-op on an already-built singleton (no reconstruct, no re-init, ignores new `opts`) + documented. On `WorkersRegistry` **and** `JobRegistry` (symmetry). `WorkersRegistry.initWorkers()` becomes idempotent (`hasAny → return`); `ensureBuild` does not absorb the init |
| 4 | `Engine` default singleton | **Default in `Engine` itself** (singleton classes); args kept as a test seam; no `EngineFactory` |
| 5 | `ConfigIncluder` taking `ConfigStore` | **Keep it pure** (takes a path) barring a real reason |
| 6 | `#workers` test seam | Specs build mocks (`WorkersRegistry.build` + `initWorkers`) **before** running the app; `RegistriesBuilder` calls `ensureBuild` which no-ops. Count observed via `WorkersRegistry.stats().idle` instead of `workers.size()` |

### Compatibility, testing and performance

- **Backward compatibility:** purely additive change to `deku-swarm` (`ensureBuild` methods are new; `Engine` defaults only fire on `undefined`; idempotent `initWorkers` is a no-op for current callers). `source/` consumes it via `"deku-swarm": "file:../worker"` (no range), so it moves in lockstep — nothing to adjust on the `source` side. The static `Application` facade keeps its public API.
- **Testing strategy:** see Scope (affected spec list) + Edge cases (E2/E4 are the sensitive points). No new kinds of tests — just setup adjustments and one new `ConfigStore` spec. Final gate: `yarn test` + `yarn lint` green in `source/` and `worker/`.
- **Performance & security:** N/A — internal structural refactor, no change to I/O, network surface or load.

### Edge cases

| # | Scenario | Handling |
|---|----------|----------|
| E1 | Path resolution on reload | `ConfigStore.entryFilePath` stores the **`configPath` argument verbatim** — not a resolved/absolutized version. `ConfigIncluder` does its own `path.resolve()` and resolves relative `include:` paths against the entry file's dir; changing the string would break that semantics. → acceptance criterion. |
| E2 | `config` / `bufferedLogger` read before `loadConfig()` (or after a `loadConfig` that threw) | Today they return `undefined` silently. The getters **must use optional chaining**: `this.#configStore?.config` / `this.#configStore?.bufferedLogger`. After `ConfigurationFileNotProvided` / `ConfigurationFileNotFound`, `#configStore` stays `undefined`. |
| E3 | `ensureBuild` called with `opts` different from the already-built instance (spec pre-built with a dummy factory / smaller `quantity`) | Silent no-op — the spec's instance wins. This is the intended behavior. **Document in JSDoc**; no warning log (no reload path where it would be useful). |
| E4 | `Engine` specs that do `new Engine({})` or pass partial registries | Before: `WorkersAllocator` held `undefined`/`undefined` (harmless at construction). After: it holds the **real singletons** → a later `.allocate()` throws "registry has not been built" if the spec never built them. Audit `worker/spec/**` (Engine / `WorkersAllocator`) and add `JobRegistry.build()` / `WorkersRegistry.build()` to setup, or keep injecting stubs. Defaults fire on `undefined` only — never pass `null`. |
| E5 | `initWorkers()` with `quantity: 0` | `#workers` stays empty → `hasAny()` false → a second call still runs its loop, but with 0 iterations. Harmless. The idempotency guard **must not** be "improved" to also short-circuit on `quantity`. |
| E6 | Config file moved/deleted after boot, before a `reload()` | Unchanged: `ConfigIncluder` throws `ConfigurationFileNotFound`, which propagates out of `EngineController.reload()` between `stop()` and `start()`, leaving the engine stopped and returning the error to the `/api` handler. Holds as long as E1 holds. |

## Benefits

- `ApplicationInstance` sheds two fields (`#configPath`, `#bufferedLogger` → one `#configStore`) and a constructor param (`#workers`), continuing its decomposition.
- Config-load state lives in one small, testable, self-documenting `ConfigStore` instead of being spread across the instance.
- The `#configPath`-for-reload smell is gone; the reload path reads a named `entryFilePath` getter.
- The test seam becomes intuitive: build your mocks, then run — the app bootstrap no longer fights the setup.
- `Engine` gets sensible registry defaults, so callers (and `ApplicationInstance`) stop hand-plumbing singletons, while specs keep full injection control.
- `ensureBuild` makes registry bootstrap safe to call more than once, removing the `reset()`-first dance.
