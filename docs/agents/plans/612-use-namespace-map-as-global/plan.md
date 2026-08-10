# Plan: Use namespace map as global

Issue: [612-use-namespace-map-as-global.md](../../issues/612-use-namespace-map-as-global.md)

## Overview

`Config#resourceRegistry` caches a direct reference to the boot-time default namespace's `resourceRegistry`, captured once in the constructor. `NamespaceMap.include()` (used by `POST /api/config`) replaces every namespace with a brand-new `Namespace` instance, so that cached reference goes stale the moment the API touches the default namespace. `ApplicationInstance#enqueueFirstJobs()` reads from that stale reference, so restarting the engine (or starting it with no names) silently drops any resource added via `POST /api/config` after boot. This plan makes `Config#resourceRegistry` a live getter and reroutes `enqueueFirstJobs()` through the already-live `ResourceEnqueuer`, so both always reflect the current state of the `NamespaceMap` singleton.

## Context

- `NamespaceMap` (`source/lib/registry/NamespaceMap.js`) is a static singleton (`NamespaceMap.build()` stores the instance; `NamespaceMap.include()` mutates its `items` via `replaceItems()`, never replacing the singleton object itself). Consumers that go through `NamespaceMap.getNamespace()` / `getResource()` / `getClient()` on every call stay live automatically.
- `Config` (`source/lib/models/configs/Config.js`) already does this correctly for `namespaceMap` (`this.namespaceMap = NamespaceMap.build(namespaceMap)` — a reference to the singleton itself), and for `getResource`/`getClient` (both delegate to `this.namespaceMap.getResource`/`getClient` on every call).
- The one exception is `resourceRegistry`, set once in the constructor to `defaultNamespace.resourceRegistry` — a reference to the *original* `Namespace` object's registry, not the singleton. Once `NamespaceMap.include()` rebuilds the `default` namespace, this reference is orphaned.
- `ApplicationInstance#enqueueFirstJobs()` (`source/lib/services/ApplicationInstance.js:126-129`) is the sole consumer of `config.resourceRegistry`, used at boot (`run()`) and by `start()`/`restart()` whenever no explicit resource names are given.
- `ResourceEnqueuer#enqueueAll()` (`source/lib/utils/ResourceEnqueuer.js:65-76`) already implements the identical "enqueue every parameter-free resource in a namespace" logic correctly, resolving the namespace live via `NamespaceMap.getNamespace()` and no-oping safely when the namespace doesn't exist.
- `Config#resourceRegistry` is asserted directly in `source/spec/lib/models/configs/Config_fromFile_spec.js:36`, so it must remain a working public property, not be deleted outright.

## Implementation Steps

### Step 1 — Make `Config#resourceRegistry` a live getter

In `source/lib/models/configs/Config.js`:
- Remove the constructor-time assignment `this.resourceRegistry = defaultNamespace ? defaultNamespace.resourceRegistry : new ResourceRegistry({});` and the now-unused `defaultNamespace` local (the `namespaceMap` constructor parameter itself is also no longer needed for this, since resolution moves to the live singleton).
- Add a `get resourceRegistry()` accessor that resolves the current default namespace from the live singleton and falls back to an empty `ResourceRegistry` when it doesn't exist (same behavior as today):

  ```js
  get resourceRegistry() {
    try {
      return this.namespaceMap.getItem(DEFAULT_NAMESPACE).resourceRegistry;
    } catch (error) {
      if (error instanceof NamespaceNotFound) return new ResourceRegistry({});
      throw error;
    }
  }
  ```
- Import `NamespaceNotFound` from `../../exceptions/registry/NamespaceNotFound.js` (keep the existing `ResourceRegistry` import for the fallback).
- Update the class-level JSDoc if it references `resourceRegistry` as a stored field.

### Step 2 — Route `enqueueFirstJobs` through `ResourceEnqueuer`

In `source/lib/services/ApplicationInstance.js`:
- Change `enqueueFirstJobs()` to delegate to `new ResourceEnqueuer().enqueueAll()` (default namespace, matching today's behavior) instead of building a `ResourceRequestCollector(this.config.resourceRegistry)` directly:

  ```js
  enqueueFirstJobs() {
    new ResourceEnqueuer().enqueueAll();
  }
  ```
- `ResourceEnqueuer` is already imported in this file (used by `enqueueResources`), so no new import is needed. Check whether `ResourceRequestCollector` is still used elsewhere in the file after this change — if not, drop the now-unused import.
- Update the method's JSDoc to describe delegating to `ResourceEnqueuer` instead of building a `ResourceRequestCollector` directly.

### Step 3 — Update/add tests

- `source/spec/lib/models/configs/Config_fromFile_spec.js:36` — the existing assertion (`expect(config.resourceRegistry).toEqual(expectedResourceRegistry)`) should keep passing unchanged against the new getter; run it to confirm, no edit expected unless the getter's return shape differs.
- Add `source/spec/lib/models/configs/Config_resourceRegistry_spec.js` (new file, following the existing per-method spec convention seen in `Config_getResource_spec.js`/`Config_getClient_spec.js`) covering:
  - Returns the current default namespace's `resourceRegistry` right after `Config.fromFile`.
  - Reflects resources added via `NamespaceMap.include()` *after* construction (the regression case for this issue) — build a `Config`, call `NamespaceMap.include([...])` to add/update a resource in the `default` namespace, then assert `config.resourceRegistry.getItem(...)` now returns it.
  - Falls back to an empty `ResourceRegistry` when there's no `default` namespace.
  - Remember `NamespaceMap.reset()` in an `afterEach` (existing convention in `Config_fromFile_spec.js`).
- `source/spec/lib/services/ApplicationInstance_spec.js` — there is currently no `describe('#enqueueFirstJobs', ...)` block (it's only ever stubbed via `spyOn(instance, 'enqueueFirstJobs').and.stub()` in `#start`/`#enqueueResources`/`#run` specs). Add one, following the same delegation-assertion style already used for `#enqueueResources`' `'delegates named resources to ResourceEnqueuer'` case (`ApplicationInstance_spec.js:190-196`):
  - Spy on `ResourceEnqueuer.prototype.enqueueAll` and assert `enqueueFirstJobs()` calls it.

## Files to Change

- `source/lib/models/configs/Config.js` — replace the cached `resourceRegistry` field with a live getter resolving through `this.namespaceMap`.
- `source/lib/services/ApplicationInstance.js` — `enqueueFirstJobs()` delegates to `new ResourceEnqueuer().enqueueAll()`; drop the `ResourceRequestCollector` import if it becomes unused.
- `source/spec/lib/models/configs/Config_resourceRegistry_spec.js` — new spec file covering the live-getter behavior, including the regression case for resources added via `NamespaceMap.include()` after boot.
- `source/spec/lib/services/ApplicationInstance_spec.js` — add a `#enqueueFirstJobs` describe block asserting delegation to `ResourceEnqueuer#enqueueAll`.

## CI Checks

- `source`: `yarn install && npm run coverage` (CI job: `jasmine`) — runs the full Jasmine suite with coverage.
- `source`: `npm run lint` (CI job: `checks`) — ESLint.
- `source`: `npm run report` (CI job: `checks`) — JSCPD duplication report.

## Notes

- No other consumer needs changing: `Config#namespaceMap`, `ResourceEnqueuer`, `HtmlParseJob`, `AssetDownloadJob`, `AssetRequestEnqueuer`, and `LinksHandler` already resolve through the live `NamespaceMap` singleton (`config.namespaceMap` or `NamespaceMap.getNamespace()` directly) rather than caching a registry reference — confirmed by grepping every `resourceRegistry`/`clientRegistry`/`namespaceMap` usage in `source/lib`.
- This is a prerequisite for #645 (Reload/Restart endpoint split) — its new "Restart" endpoint relies on `enqueueFirstJobs`/`ResourceEnqueuer` correctly reflecting live, API-added resources.
- Keep the constructor's `namespaceMap` parameter handling otherwise unchanged; only the `resourceRegistry` assignment moves out of the constructor.
