# Memory history: backend sampling buffer (MemoryRegistry + sampler)

Part of #761 (temporal memory-usage graph on `/#/memory/status`).

## Context

Navi has an unwired ring-buffer implementation in `source/lib/utils/memory/` —
`MemoryDataStore.js` (retention-capped, `add()` / `getEntries()` / `toJSON()`),
`MemoryData.js` (`{ id, value, percentage, timestamp }`), `MemoryDataFactory.js`.
Nothing instantiates or fills it today; `/memory/status.json` reads process RSS on
demand via `ProcessRssReader`.

This sub-issue makes the app sample process RSS on an interval into a retained,
process-wide buffer so a later endpoint can serve the history. It follows the same
static-facade + instance registry pattern as `LogRegistry` / `EmissionRegistry`.

## What needs to be done

**Config**
- Add `interval` to the `data_store` block in
  `source/lib/models/configs/MemoryConfig.js` — seconds between RSS samples, default
  `5`. Use the existing `{ default, ...block }.key` merge idiom already used for
  `size` (retention, default 100). Expose it as `memoryConfig.dataStoreInterval`.
- Add `page_size` to the same `data_store` block — max entries returned by the future
  `/memory/history.json` endpoint, default `20` (matching `web.logs_page_size`). Same
  merge idiom. Expose it as `memoryConfig.dataStorePageSize`. This key is pulled forward
  from #761's Config chunk so #762 owns the whole `data_store` block; nothing reads it
  until the endpoint sub-issue, exactly as `size` was landed ahead of its consumer.
- Validate `interval` in the constructor (see _Validation_) — throw a new
  `source/lib/exceptions/config/InvalidMemoryDataStore.js` (`extends AppError`, mirror
  `InvalidMemoryThresholds`) when it is not a finite number `> 0`. `size` and
  `page_size` are taken raw, unvalidated, matching `LogConfig` / `EmitConfig`.
- Spec: extend `describe('data_store')` in
  `source/spec/lib/models/configs/MemoryConfig_spec.js` — see _Testing strategy_.
- Docs: update `docs/agents/web-server.md` (the `web.memory.data_store` section around
  L304–318) — document `interval` and `page_size`, and rewrite the "nothing populates
  this store yet — there is no periodic RSS-polling loop" paragraph to describe the
  sampler now filling the buffer. Note the retained window ≈ `size × interval` (~8 min
  at defaults) here and in the `MemoryConfig` JSDoc.

**Registry**
- New `source/lib/registry/MemoryRegistry.js` + `MemoryRegistryInstance.js`, following
  the `source/lib/registry/EmissionRegistry.js` / `EmissionRegistryInstance.js` pattern
  (see _Facade surface_ below — do not copy its unused read helpers):
  - `static build({ retention })` throws if already built; `static reset()` for tests;
    `static #getInstance()` throws `'... has not been built'`.
  - The instance wraps `new MemoryDataStore(retention)` and exposes `get store()`.
  - Read helper `getEntries({ lastId } = {})` — throws if the registry is not built;
    filters via `LogFilter` (`source/lib/utils/logging/LogFilter.js`), exactly as
    `EmissionRegistryInstance.getRecords` / `LogRegistryInstance.getLogs` do. Do NOT
    add `lastId` filtering to `MemoryDataStore`.
    - **Name is `getEntries`, not `getRecords`, on purpose.** The sibling registries name
      their read method after their own domain noun — `LogRegistry.getLogs` (`Log`),
      `EmissionRegistry` / `ExtractionRegistry.getRecords` (`*Record`). `MemoryData` lives
      in `MemoryDataStore`, whose read method is already `getEntries()`, so `getEntries`
      *follows* that convention and matches the wrapped store method 1:1. The `{ lastId }`
      camelCase param matches the siblings; the handler maps `?last_id=` → `lastId`.
    - Returns entries **oldest-first**. `MemoryDataStore.getEntries()` already yields
      oldest-first, `LogFilter`'s `slice(index + 1)` depends on that ordering to mean
      "newer than `lastId`", and the endpoint + chart consume it chronologically. Do not
      reverse it in the instance.
    - `LogFilter` is already injection-safe for an attacker-controlled `lastId`
      (`parseInt` → `NaN`/number, unknown/negative/huge id → `[]`, never throws), so
      `getEntries` needs no extra `lastId` sanitising of its own.
    - **Contract quirk for consumers:** `getEntries({ lastId })` returns `[]` both when
      the caller is caught up *and* when its `lastId` has aged out of the ring buffer
      (older than `size × interval` ≈ 8 min at defaults) — the two are indistinguishable
      from the return value. #761's frontend controller must treat a persistent empty
      response after a gap as "reseed from full history". Document this on the JSDoc.
  - Write helper `add(value, percentage)` — **positional** args (consistent with
    `MemoryDataStore.add` / `MemoryDataFactory.build`; only ever called from the
    sampler). Silently no-ops when the registry is not built (same asymmetry
    `EmissionRegistry` documents), so the sampler can call it unconditionally. The
    instance's `add` returns the created `MemoryData` (like `MemoryDataStore.add` /
    `EmissionRegistryInstance.recordEmission`); the static facade's `add` returns `void`.
- Specs: `source/spec/lib/registry/MemoryRegistry_spec.js` +
  `MemoryRegistryInstance_spec.js` — see _Testing strategy_.

_MemoryRegistry API — follow the `EmissionRegistry` pattern, minimal surface_

The `EmissionRegistry` chain is `build({ retention }) → new EmissionRegistryInstance({ retention }) → new EmissionStore(retention)` (positional, own default `100`). `MemoryDataStore(retention = 100)` has the identical constructor shape to `EmissionStore(retention = 100)`, so this is a straight copy — "destructure the named option, pass it positionally to the store":

- `MemoryRegistry.build` takes **only** `{ retention }` — a single key. `interval` stays on `memoryConfig` and is read by the sampler; the registry owns retention only, like every sibling registry.
- The naming chain `data_store.size` → `memoryConfig.dataStoreSize` → `MemoryRegistry.build({ retention })` → `MemoryDataStore(retention)` is deliberate house style, mirroring `emit.size` → `emitConfig.size` → `build({ retention })` → `EmissionStore(retention)`. Do not collapse or rename it.
- The double default (`100` in both `MemoryConfig.dataStoreSize` and `MemoryDataStore`) is fine: `ApplicationConfigurator` always passes `config.webConfig.memory.dataStoreSize` (never `undefined`), so `MemoryDataStore`'s own default is just a safety net, exactly as `EmissionStore`'s is.

_Facade surface — exactly four static methods_

`build` / `reset` / `add` / `getEntries`, and nothing else. Do **not** wholesale-copy `EmissionRegistry`'s extra read helpers:

- The only consumers that will ever exist (per #761's decomposition) are the sampler (`add`) and the `/memory/history.json` handler (`getEntries({ lastId })` + `.slice(0, pageSize)`). Memory readings have one query dimension — recency via `lastId`.
- No `getEntryById` on the facade — `EmissionRegistry.getRecordById` currently has **zero call sites**, it is dead pattern-copy; don't reproduce that. `MemoryDataStore` keeps its own `getEntryById` / `clear` / `size` for a future consumer to surface if one ever appears (e.g. a "deep-link to reading X" feature).
- No `clear` on the facade — nothing wipes this buffer between runs the way `EngineController` clears emissions; a history that survives a config reload is desirable. `reset()` (drop the whole instance) covers test teardown.
- No `counts` / aggregates — `MemoryDataStore` has no counters, and `/memory/status.json` reads live RSS directly without touching the buffer.

`MemoryRegistryInstance` keeps `get store()` for parity with `EmissionRegistryInstance` (cheap, and keeps the two readable side by side). Static `add` returns `void` (matches `EmissionRegistry.recordEmission`'s no-op path); the instance `add` may return the created `MemoryData`.

**Wiring**

The registry and the sampler are wired in *different* bootstrap phases, deliberately —
this mirrors the codebase's existing two-phase startup, it is not an accidental split:

- **Phase 1 — `ApplicationInstance.loadConfig()` → `ApplicationConfigurator.load()`:**
  builds `Config` plus the retained-buffer registries. Add
  `MemoryRegistry.build({ retention: config.webConfig.memory.dataStoreSize })` after the
  existing `LogRegistry.build` / `EmissionRegistry.build` / `ExtractionRegistry.build`
  calls, **guarded by `config.webConfig`** — it is `null` when there is no `web:`
  section (`source/lib/models/configs/Config.js`), unlike the other three registries
  whose config sections always exist.
- **Phase 2 — `ApplicationInstance.run()` → `ServerController.build()` +
  `startupCoordinator.startAll([serverController, …])`:** constructs the runtime
  lifecycle controllers and starts them. `MemorySampler` is constructed inside
  `ServerController` (guarded on `webConfig`) and started by `ServerController.start()`.
  Shutdown rides the existing `EngineController.shutdown() → serverController?.shutdown()`
  path — no new plumbing.
- Do **not** try to consolidate: `load()` has no lifecycle hook (the sampler must not
  tick until `run()` and needs a stop path), and moving `MemoryRegistry.build()` into
  `ServerController` would break "all retained-buffer registries built together" and put
  a bootstrap side-effect in a sync `build()` factory.
- **Ordering is guaranteed:** `run()` reads `this.config`, which only `loadConfig()`
  populates, so `MemoryRegistry.build()` always precedes the sampler's first `add()`
  (including the immediate sample in `start()`). The `add()` unbuilt no-op is a test
  safety net, not load-bearing in production.
- **`reload()` caveat:** `EngineController.reload()` only re-merges namespace config into
  the live `NamespaceMap` — it does not rebuild registries or restart `ServerController`.
  So `data_store.interval` / `size` / `page_size` are **boot-time only**, same as
  `log.size` / `emit.size`; a live config reload does not re-cadence the sampler.
  Note this in the `web-server.md` doc update.

**Sampler**
- New `MemorySampler` at `source/lib/services/memory/MemorySampler.js` — a **new
  `services/memory/` folder**. `services/engine/` reads as "the queue engine's
  lifecycle"; a memory sampler does not belong there even though `ServerController`
  (which drives it) currently sits in `engine/`. Small single-purpose folders are
  already normal here (`services/config/`, `services/builders/`), and #761's chain /
  future memory work (a pressure alerter, a GC-observer layer) would join it.
- Every `memoryConfig.dataStoreInterval` seconds it reads
  `new ProcessRssReader().read()`, computes
  `percentage = value / memoryConfig.maximum * 100` (same math as
  `MemoryStatusHandler.handle()`), and calls `MemoryRegistry.add(value, percentage)`.
  Expose `start()` / `stop()` managing a single `setInterval` handle; `stop()` is
  idempotent.
- `start()` behaviour:
  - Take **one immediate synchronous sample**, then arm the `setInterval` — so a page
    opened in the first `interval` seconds seeds a non-empty graph instead of waiting a
    full tick.
  - No-op when a handle already exists (a second `start()` while running must not leak a
    second interval).
  - Call `.unref()` on the interval handle — defensive, so a missed `stop()` can never
    wedge process exit. It changes nothing during a normal run (the web server already
    holds the event loop open). No other code in the repo uses `.unref()`; this is
    deliberate here.
- Tick body is wrapped in `try/catch` and **swallows on error** (skips that sample) —
  `read()`/`add()` are both synchronous so there is no overlap/re-entrancy to guard, but
  an uncaught throw inside a `setInterval` callback is an `uncaughtException` that kills
  the process. No logging dependency; matches the best-effort spirit of
  `MemoryRegistry.add`'s unbuilt no-op.
- Start it from `ServerController.start()` and stop it from
  `ServerController.shutdown()` (`source/lib/services/engine/ServerController.js`);
  `EngineController.shutdown()` already calls `serverController?.shutdown()`.
  - **`ServerController` is always constructed** — `ApplicationInstance.run()` calls
    `ServerController.build({ webConfig })` unconditionally; when there is no `web:`
    section `WebServer.build` returns `null` and `#webServer` is just `null`. So the
    sampler must be **guarded on `webConfig` presence** (equivalently: on `#webServer`
    being non-null) inside `ServerController` — construct the `MemorySampler` only then,
    and have `start()` / `shutdown()` call `this.#sampler?.start()` / `?.stop()`. This
    is what keeps "no `web:` section → no sampler" true.
  - `ServerController.build({ webConfig })` signature is **unchanged** — `webConfig.memory`
    is already a `MemoryConfig` instance; the sampler reads it internally, no new build
    params.
  - In `shutdown()`, stop the sampler (synchronous `clearInterval`) **before**
    `this.#webServer?.shutdown()`, so sampling stops even if the web server shutdown
    rejects.
- Production ordering is always `ApplicationConfigurator.load()` (builds the registry) →
  `ServerController.start()` (starts the sampler); the `MemoryRegistry.add` no-op only
  needs to cover tests that start the sampler without a built registry.
- `memoryConfig.maximum === 0` (→ `percentage = Infinity`) is **not** handled here —
  `MemoryStatusHandler.handle()` already does the identical unguarded math, so this
  inherits existing behaviour rather than introducing a regression. A guard would be a
  separate cross-cutting issue touching the handler too.
- To keep the sampler testable, its constructor takes injectable
  `{ setInterval, clearInterval }` (default: the globals) and
  `rssReader = new ProcessRssReader()` (matches `MemoryStatusHandler`). See _Testing
  strategy_ for how the specs drive it — **do not** reach for `jasmine.clock()` (the
  suite has no precedent for it; injection matches the codebase's DI style).

**Backward compatibility & spec hygiene**
- `MemoryConfig`'s constructor change is purely additive: configs with no `interval` /
  `page_size` (or no `data_store` block at all) keep working on the defaults (`5` / `20`).
  No existing behaviour or config shape breaks.
- `MemoryDataStore` / `MemoryData` / `MemoryDataFactory` are **not modified** — only
  newly instantiated. Nothing consumes them today, so there is nothing to break.
- Add `MemoryRegistry.reset()` to the `resetApplicationState()` method of
  `source/spec/support/utils/RegistryCleanupUtils.js` (alongside the existing
  `LogRegistry.reset()` / `EmissionRegistry.reset()` / `ExtractionRegistry.reset()`).
  It is imported per spec file (not a global hook); `Application_spec.js` /
  `Application_webServer_spec.js` / `RegistriesBuilder_spec.js` already call it. Without
  it, the new `MemoryRegistry.build()` in `ApplicationConfigurator.load()` causes
  "already built" failures across those specs.
- Existing `ServerController_spec.js` and server integration specs: `start()` now wires
  a sampler. Those specs must inject a fake sampler (via the `buildSampler` seam — see
  _Testing strategy_) or drive `shutdown()` / `stop()` in teardown; `.unref()` keeps a
  leaked interval from holding the process open but a live interval still fires
  mid-suite.

**Performance & security**
- Nothing here needs optimising at default config. Sampling is one synchronous
  `process.memoryUsage()` native call (~tens of µs) per `interval` (5 s) — a ~0.001 %
  duty cycle. `getEntries()` per request is `[...entries].reverse()` + `LogFilter`
  (`findIndex` + `slice`), all O(`size`) with `size ≤ 100` by default — trivial even
  under many polling browser tabs.
- Buffer footprint: a `MemoryData` is ~200 B (4 fields + `Date`/object overhead), so
  `size:100` ≈ ~20 KB and `size:10000` ≈ ~2 MB — negligible against the hundreds of MB
  of RSS being monitored.
- `MemoryDataStore.add()` uses `unshift` (**O(`size`)**) + `pop` per sample (existing
  code, not rewritten here). That plus the footprint is the footgun `size` carries — but
  see _Validation_ for why it is still taken raw (no bound), documented rather than
  enforced.
- #762 adds **no HTTP surface**: the sampler takes no external input and reads only
  `process`. Auth / rate-limiting for the future `/memory/history.json` belong to the
  endpoint sub-issue. The data (RSS bytes, percentage, timestamps) is nothing
  `/memory/status.json` doesn't already expose on the same surface.

## Validation

The config layer does almost no numeric validation today — `LogConfig` / `EmitConfig` /
`ExtractionConfig` take `size` raw, `WebConfig` takes `logs_page_size` / `idle_timeout`
raw. The only existing config validator is `MemoryConfig`'s threshold-ordering check
(`InvalidMemoryThresholds extends AppError`). #762 keeps that minimalism **except for
`interval`**:

- **`interval` is validated** — a finite number `> 0` (floats allowed: `0.5` → 500 ms).
  On violation, the `MemoryConfig` constructor throws a new
  `InvalidMemoryDataStore` (`source/lib/exceptions/config/`, `extends AppError`,
  structured like `InvalidMemoryThresholds`). Rationale: `interval` of `0`, negative, or
  non-numeric makes `setInterval` fire at ~1 ms and the sampler busy-loops the event
  loop — a self-inflicted DoS, categorically worse than a merely odd `size`. Failing
  fast at config load (like a bad thresholds block) is the right response; validation
  lives in `MemoryConfig`, not `MemorySampler`.
- **`size` and `page_size` are not validated** — taken raw, matching the sibling
  configs. An upper bound would be an arbitrary number nobody can pick correctly, and
  the failure mode (memory pressure from a huge buffer) is graceful degradation, not a
  hang. The guardrail is the `size × interval` window + footprint note in
  `web-server.md`. The endpoint sub-issue handles a bad `page_size` defensively where it
  slices.

## Testing strategy

- **Timer control — inject the scheduler, never `jasmine.clock()`** (the suite has no
  precedent for it; DI matches `ServerController` / `EngineController`). `MemorySampler`
  takes `{ setInterval, clearInterval }` (default globals) and `rssReader`. The spec
  captures the callback handed to the fake `setInterval` and invokes it synchronously
  per "tick"; the fake handle carries an `unref` spy. Synchronous assertions:
  - interval armed with `dataStoreInterval * 1000` ms (seconds → ms conversion);
  - one `MemoryRegistry.add` per manual tick; one immediate `add` on `start()` before
    any tick;
  - a throwing `rssReader` → the callback swallows, the handle is not cleared, the next
    tick still records;
  - a second `start()` → `setInterval` called once;
  - `stop()` → `clearInterval(handle)`; a second `stop()` no-ops;
  - `start()` called `.unref()` on the handle.
- **`source/spec/lib/registry/MemoryRegistry_spec.js` + `MemoryRegistryInstance_spec.js`**
  — structural copy of `EmissionRegistry_spec.js`: `afterEach` reset; `.build` returns
  the instance / `.store.retention` forwarded / throws `/already been called/` on double
  build; `.reset` allows rebuild; `.add` no-ops (no throw) when unbuilt and pushes once
  built; `.getEntries` throws `/not been built/` when unbuilt, returns **oldest-first**,
  filters by `lastId`, and returns `[]` when `lastId` has aged out (retention exceeded).
- **`source/spec/lib/models/configs/MemoryConfig_spec.js`** — extend
  `describe('data_store')`: defaults (`interval` 5, `size` 100, `page_size` 20);
  overrides; fractional `interval` (`0.5`) accepted; `throws InvalidMemoryDataStore` for
  `interval` of `0`, negative, and `NaN` / non-numeric; `size: -1` and `page_size: 0`
  pass through **without** throwing (a test name should record that this asymmetry is
  deliberate).
- **`source/spec/lib/services/application/ApplicationConfigurator_spec.js`** — extend:
  `MemoryRegistry.build({ retention: dataStoreSize })` is called when `webConfig` is
  present, and **not** called when there is no `web:` section. Reset `MemoryRegistry` in
  teardown.
- **`source/spec/lib/services/engine/ServerController_spec.js`** — the current spec
  passes a raw `{ port: 1234 }` (no `.memory`). Add a `buildSampler({ webConfig })` seam
  on `ServerController` parallel to the existing overridable `buildWebServer`, so the
  spec `spyOn`s it and injects a fake sampler with `start` / `stop` spies. Assert:
  `start()` → `sampler.start()`; `shutdown()` → `sampler.stop()` **before**
  `webServer.shutdown()`; no sampler constructed when `webConfig` is undefined.
- **`source/spec/lib/services/application/Application_webServer_spec.js`** — one light
  end-to-end check: with a `web:` config, after `Application.run()` sampling happens
  (spy on `MemoryRegistry.add` or the reader); `Application.shutdown()` stops it with no
  leaked interval. Detail stays in the unit specs.

## Acceptance criteria

- [ ] `web.memory.data_store.interval` parses (default 5) as
      `memoryConfig.dataStoreInterval`, and `web.memory.data_store.page_size` parses
      (default 20) as `memoryConfig.dataStorePageSize`.
- [ ] A non-finite or `≤ 0` `data_store.interval` throws `InvalidMemoryDataStore` at
      config load; `size` / `page_size` are taken raw (no validation), matching the
      sibling configs.
- [ ] `docs/agents/web-server.md` documents `interval` and `page_size`, drops the
      "nothing populates this store yet" claim, notes the `size × interval`
      retained-window relationship, and states that `data_store.*` is boot-time only
      (not re-applied by `reload()`).
- [ ] `MemoryRegistry` / `MemoryRegistryInstance` exist and follow the
      `EmissionRegistry` pattern with a **four-method facade** (`build` / `reset` /
      `add` / `getEntries`, no other helpers); `add()` no-ops when unbuilt,
      `getEntries({ lastId })` throws when unbuilt and otherwise filters via `LogFilter`.
- [ ] `MemoryRegistry.build(...)` runs in `ApplicationConfigurator.load()` only when
      `config.webConfig` is present.
- [ ] A sampler samples process RSS into `MemoryRegistry` every `interval` seconds
      while the web server runs, takes one immediate sample on `start()`, and stops
      cleanly on shutdown (no leaked interval).
- [ ] The sampler survives a failing RSS read (tick `try/catch`, sample skipped, no
      process crash), no-ops on a double `start()`, and `.unref()`s its interval handle.
- [ ] Without a `web:` section, no registry is built and no sampler runs (the sampler
      is guarded on `webConfig` presence inside the always-constructed `ServerController`).
- [ ] `RegistryCleanupUtils.resetApplicationState()` resets `MemoryRegistry`, and the
      full existing suite still passes (no leaked intervals, no "already built" failures).
- [ ] Specs per _Testing strategy_: `MemoryConfig` (`data_store` defaults / overrides /
      validation), `MemoryRegistry` + instance, `MemorySampler` (scheduler injected, no
      `jasmine.clock()`), `ApplicationConfigurator` (build guard), `ServerController`
      (`buildSampler` seam), and the light `Application_webServer` end-to-end check.

## Alternatives considered

A fixed-cadence `setInterval` sampler feeding a process-wide ring buffer (#761
objective 1) was chosen over:

- **Sample-on-request** (read RSS only when `/memory/history.json` is hit). Zero cost
  when idle, but the history then only has points for moments someone was polling —
  close the dashboard for an hour, reopen, and there is a one-hour hole over exactly the
  leak/spike window. #761's premise ("trends are invisible") needs sampling independent
  of observation; concurrent pollers also produce irregular spacing.
- **Piggyback on the engine poll loop.** Couples memory sampling to engine activity; the
  web server can run with the engine stopped (`autostart: false`) → no samples. Wrong
  lifecycle.
- **Sample on job completion.** Frequency becomes a function of throughput — bursty
  under load, nothing when quiet. Bad for an even time-series.
- **GC `PerformanceObserver`.** Samples at sawtooth edges — irregular, and high-frequency
  under load (floods the buffer, evicts the long-term trend). A possible future layer,
  not the baseline.
- **External metrics (Prometheus exporter, container stats).** Much larger scope; #761
  wants this fed the same way logs/emissions are — in-process buffer + polling endpoint.

The fixed-cadence sampler gives an even time-series, a predictable retained window
(`size × interval`), independence from both observation and engine state, negligible
cost (see _Performance & security_), and a single process-wide writer (RSS is
process-global; all clients see the same history).

**The sampler is the sole writer.** Do not also append a point when `/memory/status.json`
is polled — it would make spacing irregular, couple the handler to the registry, and add
near-zero value (the status poll is already every 5 s = the default interval).

## Out of scope

- The `/memory/history.json` endpoint and its serializer (separate sub-issue) — that
  sub-issue *consumes* `memoryConfig.dataStorePageSize` and `getEntries({ lastId })`,
  both delivered here.
- Any page-size capping / `.slice()` of `getEntries` results — `getEntries` returns the
  full `lastId`-filtered list; the endpoint handler does the capping.
- Any frontend work.
- Persisting the buffer across restarts.

## Dependencies

None — this is the first sub-issue in the chain. It owns the `MemoryRegistry` API and
the whole `web.memory.data_store` config block (`interval` and `page_size`, alongside
the pre-existing `size`).
