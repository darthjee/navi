# Issue: Use namespace map as global

## Problem

`NamespaceMap` (`source/lib/registry/NamespaceMap.js`) is already meant to be the single, live source of truth for resource/client resolution: `NamespaceMap.include()` lets `POST /api/config` merge new resources/clients into a namespace at runtime, and most consumers (`ResourceEnqueuer`, jobs, `Config#namespaceMap` itself) resolve against it live, on every call, via `NamespaceMap.getNamespace()` / `getResource()` / `getClient()`.

There is one place that breaks this: `Config#resourceRegistry` (`source/lib/models/configs/Config.js:23-27`) caches a **direct reference** to the boot-time default namespace's `resourceRegistry`:

```js
this.namespaceMap = NamespaceMap.build(namespaceMap);

const defaultNamespace = namespaceMap[DEFAULT_NAMESPACE];
this.resourceRegistry = defaultNamespace ? defaultNamespace.resourceRegistry : new ResourceRegistry({});
```

`NamespaceMap.include()` (used by `POST /api/config`) rebuilds **every** namespace as a brand-new `Namespace` instance (`NamespaceMapBuilder#buildNamespaces`, `source/lib/services/NamespaceMapBuilder.js:74-84`) and swaps them into the singleton via `replaceItems()`. The singleton (`this.namespaceMap`) stays live because its identity never changes — only its internal `items` map is swapped. But `Config#resourceRegistry` isn't the singleton; it's a raw reference to the *old* default namespace's registry object, so once the API touches the default namespace, that reference is orphaned and permanently stuck showing only what existed at boot.

### Effect

`ApplicationInstance#enqueueFirstJobs()` (`source/lib/services/ApplicationInstance.js:126-129`) — used at boot and by `start()`/`restart()` whenever no explicit resource names are given — enqueues from `this.config.resourceRegistry`. Because that reference is stale, restarting the engine (or starting it with no names) silently drops any resource added via `POST /api/config` after boot: it only re-enqueues the original, boot-time resource set.

This is the root cause behind the "restart clears API-created config" problem originally reported in #645. Contrast this with `ResourceEnqueuer#enqueueAll()` (`source/lib/utils/ResourceEnqueuer.js:65-76`), which implements the exact same "enqueue every parameter-free resource" logic correctly — it looks up the namespace live via `NamespaceMap.getNamespace()` on every call instead of caching a reference.

## Solution

Make `NamespaceMap` the sole source of truth for resource/client lookups; stop caching registry references anywhere else.

- `Config#resourceRegistry` is asserted directly in an existing test (`source/spec/lib/models/configs/Config_fromFile_spec.js:36`), so it's real public API, not just internal plumbing — keep it, but make it live: replace the cached field (`Config.js:27`) with a `get resourceRegistry()` that resolves `NamespaceMap.getNamespace('default')` on every access, falling back to an empty `ResourceRegistry` when there's no default namespace (same fallback the current code has).
- Change `ApplicationInstance#enqueueFirstJobs()` to delegate to `new ResourceEnqueuer().enqueueAll()` (default namespace) instead of `new ResourceRequestCollector(this.config.resourceRegistry)...` — reusing the already-correct, already-live implementation rather than duplicating it. `ResourceEnqueuer` already no-ops safely when the default namespace is missing, so this preserves today's behavior for that edge case too.
- Audit other consumers for the same pattern (a one-time-captured `resourceRegistry`/`clientRegistry` reference instead of a live `NamespaceMap` lookup); as of this writing, `Config#resourceRegistry` is the only offender — everything else (`Config#namespaceMap`, `ResourceEnqueuer`, `HtmlParseJob`, `AssetDownloadJob`, `AssetRequestEnqueuer`, `LinksHandler`) already resolves through the live `NamespaceMap` singleton.

`#645` (Reload/Restart endpoint split) depends on this fix — otherwise the new "Restart" endpoint would inherit the same stale-reference bug.
