# Issue: Add guide for deku-swarm

## Description

We extracted our workers code to a standalone package, `deku-swarm` (`worker/package.json`), but have not added a user-facing guide for it in `docs/guides`.

`deku-swarm` is a zero-dependency queue-based worker pool for Node.js — you subclass `Job` with your own `perform()` logic, and it handles queuing, worker allocation, cooldown-based retry, and dead-lettering. It has no domain knowledge of HTTP or caching. This guide is intended for developers and AI agents who want to integrate `deku-swarm` into their own Node.js projects as an npm dependency, independent of Navi.

## Solution

Following the same pattern as `HOW_TO_USE_NAVI.md` and `HOW_TO_USE_NAVI-CLIENT.md`:

1. Create a hub file: `docs/guides/HOW_TO_USE_DEKU_SWARM.md` — title + description paragraph + `## Table of Contents` with relative links, same structure as the existing hub files.
2. Create sub-pages under: `docs/guides/deku-swarm/`.
3. All links in the hub must be **relative** (`./deku-swarm/xxx.md`) — users will copy these guides into other projects to instruct AI agents on how to use `deku-swarm`.

### Proposed sub-pages

- `installation.md` — installing `deku-swarm` from npm, ES Module requirements (`import`/`export` with `.js` extensions), Node.js version constraints.
- `defining-jobs.md` — subclassing `Job`, implementing `perform(logContext)`, `maxRetries` override, `applyCooldown(ms)`, `isReadyBy(currentTime)`, `exhausted(maxRetries)`, the `#attempts` and `#readyBy` internal tracking.
- `setup.md` — registering `JobFactory.build(name, options)` with `klass`/`attributesGenerator`/`attributes`, building `JobRegistry` and `WorkersRegistry` singletons (`build()` once at startup, `reset()` between tests), `WorkerFactory` wiring with injected registries, `WorkersRegistry.initWorkers()`.
- `running-the-engine.md` — `Engine` constructor options (`sleepMs`, `keepAlive`, `idleTimeoutMs`, `onIdleTimeout`), `start()`/`stop()`/`pause()`/`resume()`, one-shot vs. keepAlive mode, `#shouldContinue()` logic.
- `job-lifecycle.md` — the 6 job statuses (enqueued → processing → failed → retryQueue → finished/dead), `enqueue()`, `pick()`, `promoteReadyJobs()`, `finish()`/`fail()`, `retryJob(id)`, `stats()` return shape.
- `collections.md` — `Queue` (FIFO), `IdentifyableCollection` (O(1) keyed lookup), `SortedCollection` (lazy-sorted, `upTo`/`after`), `IdGenerator` vs `UUidGenerator` — when and how to use them standalone.
- `reference.md` — full public API surface from `lib/index.js` exports, `JobFactory`/`WorkerFactory` options tables, `JobRegistry`/`WorkersRegistry` static facade methods.

### Sources to reference

- `worker/README.md` — existing npm-facing readme with API tables and quick-start example.
- `docs/agents/worker.md` — class-by-class internal reference (architecture, not user guide).

### Ownership

This guide is owned by the `docs` agent, not `worker` — per repo convention, `docs` owns all `docs/guides/**` content even when the subject package is owned by another specialist (see `docs/guides/HOW_TO_USE_NAVI-CLIENT.md`, authored by `docs` despite `clients/node/` being owned by `navi-client`). As part of this issue, `.claude/agents/docs.md`'s scope list should be extended to add:

- `docs/guides/HOW_TO_USE_DEKU_SWARM.md`
- `docs/guides/deku-swarm/*.md`

`docs` should coordinate with `worker` to confirm exact API semantics before writing (per `docs.md`'s existing convention), but `worker` does not write the guide directly.

### Acceptance criteria

- [ ] Hub file `HOW_TO_USE_DEKU_SWARM.md` follows the same structure as existing guides (title + description paragraph + `## Table of Contents` with relative links).
- [ ] All sub-pages created under `docs/guides/deku-swarm/`.
- [ ] All links are relative (no absolute GitHub URLs between guide pages).
- [ ] Guide covers the full public API exported from `lib/index.js`: `Worker`, `WorkerFactory`, `WorkersRegistry`, `Job`, `JobFactory`, `JobRegistry`, `Engine`, `WorkersAllocator`, `IdentifyableCollection`, `Queue`, `SortedCollection`.
- [ ] Guide is self-contained — a developer or AI agent with no prior knowledge of Navi can read it and integrate `deku-swarm` into their own project.
- [ ] Content does not duplicate `worker/README.md` verbatim — the guide is instructional (how to use), the README is reference (what the API is).
- [ ] All code examples use ES Modules (`import`/`export` with `.js` extensions).
- [ ] `.claude/agents/docs.md`'s scope list is updated to include `docs/guides/HOW_TO_USE_DEKU_SWARM.md` and `docs/guides/deku-swarm/*.md`.

## Benefits

- Developers and AI agents can integrate `deku-swarm` as a standalone npm dependency without needing to read its source or Navi's internals.
- Matches the existing guide pattern (`HOW_TO_USE_NAVI.md`, `HOW_TO_USE_NAVI-CLIENT.md`), keeping documentation structure consistent across Navi's extracted packages.
