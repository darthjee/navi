# Plan: Allow later config addition

Issue: [613-allow-later-config-addition.md](../../issues/613-allow-later-config-addition.md)

## Overview

Today the `include:` chain is resolved exactly once, at boot, inside `Config`'s constructor, and two parallel global registries exist (`NamespaceMap`, plus a legacy flat `ResourceRegistry`/`ClientRegistry` pair kept only for two call sites that predate namespace support). This plan collapses to `NamespaceMap` as the single mutable global, and gives it a `.include(files)` capability that reuses the exact same merge/validation logic boot uses — so the identical code path can be invoked again later (e.g. eventually from an HTTP handler, out of scope here) to add or update a namespace's resources/clients while the process is running. A name collision (resource/client name already registered) now *replaces* rather than raises, uniformly at boot and for later calls, which is what makes "update an existing resource/client" possible with no separate API.

## Context

- `ConfigIncluder` walks the `include:` chain from disk into a flat list of `{namespace, resources, clients, filePath}` entries.
- `NamespaceMapBuilder.build(files)` groups those entries by namespace, builds one `Namespace` per group (each holding its own plain `ResourceRegistry`/`ClientRegistry` instance), and eagerly validates every resource's client reference and action/paginated_action targets against the full resulting map — raising `NamespaceNotFound`/`ResourceNotFound`/`ClientNotFound` on the first unresolvable reference, and today raises `DuplicateNamespaceItem` when two files in the same namespace declare the same resource/client name.
- `NamespaceMap` (`source/lib/registry/NamespaceMap.js`) is already a static-singleton facade over that built map, and is already what `Config.getResource`/`getClient` delegate to.
- `Config`'s constructor (`source/lib/models/configs/Config.js:24-35`) *also* builds a second, legacy pair — `ResourceRegistry.build(...)`/`ClientRegistry.build(...)` — populated only with the `default` namespace's items, solely so two call sites that predate namespace-splitting (#606) keep working: `ResourceEnqueuer` (`ResourceRegistry.has`/`getItem`) and `LinksHandler` (`ClientRegistry.all()`).
- `Config.resourceRegistry` (the instance property, not the class) has one real consumer: `ApplicationInstance` passes it into `ResourceRequestCollector` for boot-time enqueueing of parameter-free requests. `Config.clientRegistry` (instance property) has no production consumer at all — only a spec asserts it's defined.
- `NamedRegistry#size()` (base class of `ResourceRegistry`/`ClientRegistry`/`NamespaceMap`) memoizes its count on first call. Any approach that mutates `.items` in place after `size()` has already been read would return a permanently stale count.

## Implementation Steps

### Step 1 — Let `NamedRegistry` replace its items safely

Add a way to swap `items` on an existing `NamedRegistry` instance without leaving a memoized `#size` stale (e.g. a protected/internal method the subclass constructor already funnels through, or turn the size cache invalidation into something reassignment goes through). This is the shared primitive both `Namespace`'s per-registry rebuild and `NamespaceMap`'s own item-swap need in Step 3.

### Step 2 — Make `NamespaceMapBuilder` merge into existing namespaces, replacing on collision

- Change `NamespaceMapBuilder`'s constructor/`.build` to accept an optional second argument — the existing `Record<namespace, Namespace>` map to merge into (default `{}`, preserving today's boot behavior exactly).
- Seed `#buildNamespaces`'s `groups` accumulator from each existing namespace's current `resourceRegistry.items`/`clientRegistry.items` before folding in the new `files`.
- Change `#mergeInto` to replace on collision (`target[name] = item`) instead of throwing `DuplicateNamespaceItem` — applies identically whether the collision is between two new files (today's boot-time multi-file case) or between a new file and an already-registered item (the new later-call case).
- Leave `#validateReferences` as-is: it already re-validates every resource's client/action/paginated_action references against the *complete* resulting namespace map, so it automatically covers cross-references introduced or affected by a later merge — no separate validation path needed.
- Every group (touched or not) is rebuilt into a fresh `Namespace` with fresh `ResourceRegistry`/`ClientRegistry` instances, which is what keeps `NamedRegistry#size()` correct without any special-casing.

### Step 3 — Add `NamespaceMap#include` (and a static passthrough)

- Add an instance method on `NamespaceMap`, `include(files)`, that calls `NamespaceMapBuilder.build(files, this.items)` and swaps the result in via Step 1's safe-replace primitive.
- Add `NamespaceMap.include(files)` as a static passthrough to the singleton instance (mirroring `.getResource`/`.getClient`), so a future out-of-process caller (e.g. an HTTP handler) can call it without holding a direct reference.
- This is the method boot-time loading and later additions both end up calling into (see Step 5) — one code path, one set of guarantees (fail-fast on invalid shape, fail-fast on unresolved references, replace-on-collision).

### Step 4 — Remove the legacy singleton facade from `ResourceRegistry`/`ClientRegistry`

- Delete the static `build`/`reset`/`getItem`/`has`/`filter`/`size`/`getClient`/`all` singleton machinery (the `#instance`/`#getInstance` private static state) from both `ResourceRegistry` and `ClientRegistry`. They remain plain `NamedRegistry` subclasses, used only as per-namespace instances inside `Namespace`.

### Step 5 — Update `Config` to stop building the legacy globals

- Remove the `ResourceRegistry.build(...)`/`ClientRegistry.build(...)` calls from `Config`'s constructor.
- Keep `Config.resourceRegistry` as a plain instance property (`defaultNamespace ? defaultNamespace.resourceRegistry : new ResourceRegistry({})`) since `ApplicationInstance`/`ResourceRequestCollector` still depend on it via dependency injection.
- Drop `Config.clientRegistry` entirely — it has no production consumer once `LinksHandler` is migrated in Step 7 (see Files to Change for the one spec that currently asserts its presence).

### Step 6 — Migrate `ResourceEnqueuer` off the legacy singleton

Replace `ResourceRegistry.has(name)`/`ResourceRegistry.getItem(name)` with a lookup through `NamespaceMap.getResource('default', name)`, catching `ResourceNotFound` (and `NamespaceNotFound`, if the `default` namespace itself is ever missing) to preserve the existing `not_found` skip behavior instead of a separate `has` check.

### Step 7 — Migrate `LinksHandler` off the legacy singleton

Replace `ClientRegistry.all()` with the `default` namespace's clients only — e.g. add a small static passthrough (`NamespaceMap.getNamespace(name)`, mirroring the existing `getResource`/`getClient` statics) and call `.clientRegistry.filter(() => true)` on the `default` namespace. This intentionally narrows scope to the `default` namespace (matching `ResourceEnqueuer`'s existing implicit default-only behavior), so a namespace added later via the future API doesn't silently leak its clients into the public `/links.json` response.

### Step 8 — Delete the now-unused `DuplicateNamespaceItem` exception

Once Step 2 lands, nothing throws `DuplicateNamespaceItem` anymore. Delete `source/lib/exceptions/registry/DuplicateNamespaceItem.js` and its spec.

### Step 9 — Update existing specs for the new behavior

See Files to Change below for the full list; in summary:
- `NamespaceMapBuilder_spec.js`: replace the "raises `DuplicateNamespaceItem`" case with an assertion that the later file's item wins; add cases for merging into a pre-populated existing-namespaces map (new namespace, extending an existing one, replacing a colliding resource/client, and a merge that fails validation because an added resource references something unresolvable).
- `Config_fromFile_spec.js` / `ConfigLoader_spec.js`: update or remove any assertion that relies on `DuplicateNamespaceItem` being thrown for duplicate names across included files.
- `ResourceRegistry_spec.js` / `ClientRegistry_spec.js`: remove the deleted singleton-facade specs; keep the plain instance-level behavior specs.
- `ResourceEnqueuer_spec.js`: replace `ResourceRegistry.build(...)`/`.reset()` fixture setup with `NamespaceMap.build({ default: new Namespace({...}) })` / `NamespaceMap.reset()`.
- `LinksHandler_spec.js`: replace `ClientRegistry.build(...)`/`.reset()` fixture setup similarly with `NamespaceMap`.
- `Application_spec.js`: update or remove the `'uses clientRegistry instead of exposing config.clients'` spec now that `Config.clientRegistry` no longer exists.
- Add new specs for `NamespaceMap#include`/`.include` covering: adding a brand-new namespace, appending to an already-existing namespace, replace-on-collision for both a resource and a client, cross-reference validation still failing fast for an added resource with an unresolvable reference, and that a pre-existing `Config`/`NamespaceMap` reference observes the change immediately (no re-fetch needed) since it's the same singleton object.
- Add a spec for the `NamedRegistry` items-replacement addition from Step 1, confirming `size()` reflects the new item count after replacement even when `size()` had already been called once before.

## Files to Change

- `source/lib/registry/NamedRegistry.js` — add the safe items-replacement primitive (Step 1).
- `source/lib/services/NamespaceMapBuilder.js` — accept existing namespaces to merge into; replace-on-collision instead of throwing (Step 2).
- `source/lib/registry/NamespaceMap.js` — add instance `include(files)` + static `NamespaceMap.include(files)` and `NamespaceMap.getNamespace(name)` passthroughs (Steps 3, 7).
- `source/lib/registry/ResourceRegistry.js` — remove singleton facade (Step 4).
- `source/lib/registry/ClientRegistry.js` — remove singleton facade (Step 4).
- `source/lib/models/configs/Config.js` — stop building the legacy globals; drop `clientRegistry`, keep `resourceRegistry` as a plain instance (Step 5).
- `source/lib/utils/ResourceEnqueuer.js` — migrate to `NamespaceMap.getResource` (Step 6).
- `source/lib/server/handlers/LinksHandler.js` — migrate to `NamespaceMap.getNamespace('default').clientRegistry` (Step 7).
- `source/lib/exceptions/registry/DuplicateNamespaceItem.js` — delete (Step 8).
- `source/spec/lib/exceptions/registry/DuplicateNamespaceItem_spec.js` — delete (Step 8).
- `source/spec/lib/services/NamespaceMapBuilder_spec.js` — update/add cases (Step 9).
- `source/spec/lib/models/configs/Config_fromFile_spec.js` — update assertions (Step 9).
- `source/spec/lib/services/ConfigLoader_spec.js` — update assertions (Step 9).
- `source/spec/lib/registry/ResourceRegistry_spec.js` — remove singleton-facade specs (Step 9).
- `source/spec/lib/registry/ClientRegistry_spec.js` — remove singleton-facade specs (Step 9).
- `source/spec/lib/utils/ResourceEnqueuer_spec.js` — migrate fixture setup (Step 9).
- `source/spec/lib/server/handlers/LinksHandler_spec.js` — migrate fixture setup (Step 9).
- `source/spec/lib/services/Application_spec.js` — update/remove the `clientRegistry` presence spec (Step 9).
- `source/spec/lib/registry/NamespaceMap_spec.js` — add specs for `#include`/`.include`/`.getNamespace` (Step 9).
- `source/spec/lib/registry/NamedRegistry_spec.js` — add spec for the items-replacement primitive (Step 9).

## CI Checks

- `source/`: `docker compose run --rm navi_tests bash -c "yarn coverage && yarn lint && yarn report"` (CI jobs: `jasmine`, `checks`)

## Notes

- The new method's name (`NamespaceMap#include`/`.include`) is a concrete suggestion, chosen to match the issue's own "include configuration" language; renaming it during implementation (e.g. to `merge`) is a fine judgment call as long as boot and later calls share the one method.
- `Config.clientRegistry` is dropped as dead weight (Step 5) since its only remaining reference after `LinksHandler`'s migration is a spec assertion of its own existence — flagged explicitly in case there's an external consumer this plan didn't find (none were found in `source/lib`).
- This plan does not touch `ConfigLoader`/`ConfigIncluder`/`Config.fromFile` — boot continues to call `NamespaceMapBuilder.build(files)` with no second argument (defaulting to `{}`), then `NamespaceMap.build(namespaceMap)`, exactly as today.
- Building the future HTTP handler that calls `NamespaceMap.include(...)` — including how it authenticates, what payload shape it accepts, and how it turns a thrown exception into an HTTP 4xx — is explicitly out of scope for this issue.
