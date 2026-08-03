# Issue: Allow later config addition

## Description

Navi's config supports `include:` to pull in external files, but the whole chain is resolved exactly once, synchronously, from disk, at boot. This issue makes that inclusion mechanism invocable via a method call **after boot** too — not just at startup — laying the groundwork for a future HTTP endpoint that can add configuration on the fly (building that endpoint itself is out of scope here; only the underlying method is in scope).

## Problem

`ConfigIncluder`/`ConfigLoader` only resolve the `include:` chain once, synchronously, from disk, inside `Config`'s constructor. There is no way to add resources/clients into the running configuration afterward.

This area also currently maintains two parallel, redundant registries:
- The namespace-aware `NamespaceMap` singleton (already used by `Config.getResource`/`getClient`).
- A legacy flat singleton pair, `ResourceRegistry`/`ClientRegistry`, populated only with the `default` namespace's items and kept solely for two call sites that predate namespace support (#606): `ResourceEnqueuer` (resource lookup by name, for worker cache-warming) and `LinksHandler` (`ClientRegistry.all()`, to list client links).

## Expected Behavior

- A method exists that adds a namespace's resources/clients into the running configuration, callable both at boot and at any later point (e.g. eventually from an HTTP handler — that handler itself is out of scope here).
- The method supports both creating a brand-new namespace and extending an already-existing one.
- A name collision (a resource or client name already registered in the target namespace) replaces the existing item rather than raising — uniformly at boot and at later call time. This is how an update to an already-registered resource/client is performed (including when two included files at boot declare the same name — the later one wins).
- All existing readers (`Config.getResource`/`getClient`, `ResourceEnqueuer`, `LinksHandler`) see additions immediately, with no extra wiring, cache invalidation, or restart.
- A later addition also runs the same cross-reference validation boot already does — a resource's client reference and its actions'/paginated_actions' target resources (possibly in other namespaces) must resolve against the full, post-addition namespace map, or the addition is rejected the same way an unresolvable reference aborts boot today.

## Solution

- Collapse to a single global: remove the singleton `build`/`reset`/static-getter machinery from `ResourceRegistry`/`ClientRegistry` — they remain as plain per-namespace instances inside `Namespace`, but `NamespaceMap` becomes the sole mutable global truth.
- Migrate `ResourceEnqueuer` and `LinksHandler` onto `NamespaceMap`'s static facade instead of the standalone `ResourceRegistry`/`ClientRegistry` singletons. `LinksHandler`'s "all clients" behavior narrows to the `default` namespace only (matching `ResourceEnqueuer`'s existing implicit default-only scope, and avoiding the public `/links.json` endpoint silently exposing clients added later to other namespaces).
- Add the new "include" method to `NamespaceMap`, reusing `NamespaceMapBuilder`'s existing merge and cross-reference validation logic (client references, action/paginated_action targets) so one code path serves both boot-time loading and later additions — including the fail-fast behavior on invalid shape and unresolvable references.
- Replace `NamespaceMapBuilder`'s current raise-on-duplicate-name behavior (`DuplicateNamespaceItem`) with replace-on-collision (last one registered wins), uniformly for boot-time loading and later additions — this is what makes updating an already-registered resource/client possible.
- When appending into an already-existing namespace, rebuild that namespace's `ResourceRegistry`/`ClientRegistry` from the merged items rather than mutating `.items` in place, to avoid `NamedRegistry#size()`'s memoized count going stale.

## Benefits

- Removes duplicate global state — two competing "resource/client registry" concepts collapse into one.
- Unlocks a real path toward the eventual goal (adding config via a web API) without committing to that surface yet.
- Shape and cross-reference validation is shared identically between boot-time and future runtime additions, so there is only one code path to trust.
- Replace-on-collision means the same method that adds config also serves updates, with no separate "update" API needed.
