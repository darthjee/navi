# Plan: Allow config split

Issue: [601-allow-config-split.md](../issues/601-allow-config-split.md)

## Overview
Replace the single monolithic-config assumption with a config `include` mechanism and a `namespace` concept: each config file (entry file or included file) contributes resources/clients to a namespace (`default` when undeclared), files across namespaces are merged into a `NamespaceMap`, and resource/client references can cross namespaces explicitly or fall back to the requester's own namespace then `default`. This is entirely within `source/lib/` (the `engine` agent's scope) — no frontend/dev changes needed.

## Context
Today `Config` (`source/lib/models/configs/Config.js`) builds two process-wide singletons, `ResourceRegistry` and `ClientRegistry`, from a single parsed YAML file (`ConfigLoader` → `ConfigParser`). Cross-references between resources (`actions[].resource`, `paginated_actions[].resource`) and from resources to clients (`resources.<name>.client`) are plain name lookups against those singletons — see `ResourceRequestAction#execute` (`source/lib/models/request/ResourceRequestAction.js:48-56`), `ResourceRequestPaginatedAction#execute` (`source/lib/models/request/ResourceRequestPaginatedAction.js:49-62`), and `ResourceRequestJob#getClient` (`source/lib/jobs/ResourceRequestJob.js:88-93`). There is no namespace concept and no include mechanism anywhere in the codebase today (confirmed by exploration — this is greenfield).

Design decisions already settled during discussion (see issue body for full detail):
- `include` is a YAML list under one key (`include:\n  - a.yml\n  - b.yml`), not repeated scalar keys.
- Existing single-file configs (no `include`/`namespace`) keep working unchanged, implicitly living in the `default` namespace.
- Multiple included files may declare the same `namespace`; their resources/clients merge into it. A duplicate resource/client name within one namespace (whether from the same or different files) is an error.
- Unresolvable references (bad explicit namespace, or name not found even after falling back to `default`) are validated eagerly at config-load time, not lazily at request time.

## Implementation Steps

### Step 1 — New exceptions
Add, following the existing `AppError` hierarchy conventions (`docs/agents/architecture/source-layout.md`'s exception tree):
- `source/lib/exceptions/registry/NamespaceNotFound.js` — extends `ItemNotFound`; thrown when an explicit `namespace:` reference (or the `default` fallback) does not exist in the `NamespaceMap`.
- `source/lib/exceptions/registry/DuplicateNamespaceItem.js` — extends `AppError` directly; thrown when two files contributing to the same namespace declare a resource or client with the same name.
- `source/lib/exceptions/config/ConfigurationIncludeNotFound.js` — extends `ConfigurationFileNotFound` (or reuse `ConfigurationFileNotFound` as-is if its message is generic enough) for an `include:` path that can't be read.

### Step 2 — Namespace-aware model fields
- `source/lib/models/request/Resource.js`: `fromObject`/`fromListObject` accept and carry a `namespace` (the namespace the resource was declared in, passed down from the loader — see Step 4), stored as `this.namespace`.
- `source/lib/services/Client.js`: same — carry `this.namespace` alongside `name`/`baseUrl`/etc.
- `source/lib/models/request/ResourceRequestAction.js` and `ResourceRequestPaginatedAction.js`: parse an optional `namespace` from the raw action/paginated_action entry (the *target* namespace, nullable) in addition to the existing `resource` name, and accept an `originNamespace` (the *owning* resource's namespace, threaded in by `ResourceRequest`/`Resource` at construction time — not read from YAML). Replace the `execute()` lookup (`this.#resourceRegistry.getItem(this.resource)`) with `this.#namespaceMap.getResource(this.#originNamespace, this.resource, this.#namespace)` (see Step 3). Update the constructor defaults from `resourceRegistry = DefaultResourceRegistry` to `namespaceMap = DefaultNamespaceMap`.
- `source/lib/models/request/ResourceRequest.js`: the existing `client` value can be a bare string (shorthand, same as before) or an object `{ name, namespace }`. Parse both forms into `#clientName` and a new `#clientNamespace` (nullable), both exposed via getters. Also carry the owning `Resource`'s `namespace` (via a new constructor/`fromList` option, mirroring how `clientName` is already threaded through `Resource.fromObject` → `ResourceRequest.fromList`) so `ResourceRequestJob` can resolve with the correct origin namespace.

### Step 3 — `Namespace` and `NamespaceMap`
- `source/lib/registry/Namespace.js`: represents one namespace — `{ name, resourceRegistry, clientRegistry }`, where `resourceRegistry`/`clientRegistry` are plain **instances** of the existing `ResourceRegistry`/`ClientRegistry` classes (`new ResourceRegistry(items)` / `new ClientRegistry(items)` — their instance API already supports this; only their static singleton facade is bypassed). Resources/clients stored in these registries carry their namespace name (Step 2), so callers can tell where an item came from.
- `source/lib/registry/NamespaceMap.js`: follows the same static-singleton-facade pattern as `ResourceRegistry`/`ClientRegistry` (`build(namespaces)`, `reset()`, private `#getInstance()`), so it can be built once at app bootstrap and reset between test examples. Exposes:
  - `getResource(originNamespace, name, namespace)` — when `namespace` is `null`/undefined, try `originNamespace` first, then fall back to `'default'`; when an explicit `namespace` is given and lookup fails, do **not** silently fall back — raise `NamespaceNotFound`/`ResourceNotFound` (an explicit-but-wrong namespace is a config error, not a fallback case — only the "no namespace given" path falls back).
  - `getClient(originNamespace, name, namespace)` — same resolution rules, delegating to each `Namespace`'s `clientRegistry.getClient(name)` (reusing the existing "default client" convenience logic in `ClientRegistry#getClient`, unchanged).
  - Internally: `getResource`/`getClient` first resolve the target `Namespace` (raising `NamespaceNotFound` if neither the explicit/origin/`default` namespace exists), then delegate the name lookup to that namespace's registry (letting `ResourceNotFound`/`ClientNotFound` propagate as-is).

### Step 4 — Include resolution and namespace grouping
- `source/lib/services/ConfigIncluder.js` (new): given an entry file path, recursively resolves its `include:` list. For each file: read + YAML-parse (reusing `ConfigLoader`'s existing `readFileSync` + `EnvStringResolver` + `YAML.parse` steps — refactor those into a small shared helper rather than duplicating), resolve each `include:` entry's path relative to the *including* file's directory (`path.dirname`), or use it as-is if absolute (`path.isAbsolute`). Track resolved absolute paths already visited and skip re-reading a file already included (prevents infinite loops on circular/duplicate includes without needing a hard error). Returns a flat list of `{ namespace, resources, clients, filePath }` entries — `namespace` defaults to `'default'` per file when the file has no top-level `namespace:` key. Only the entry file's `workers`/`web`/`log`/`failure` sections are consulted (included files only ever contribute `resources`/`clients`); document this as the intended scope in the class doc comment.
- `source/lib/services/ConfigParser.js`: keep parsing a *single* raw file object into `{ resources, clients }` `Resource`/`Client` instances (its current job, mostly unchanged) — it becomes a per-file step invoked once per entry returned by `ConfigIncluder`, with the file's `namespace` passed through into `Resource.fromListObject`/`Client.fromListObject` (Step 2).
- `source/lib/services/NamespaceMapBuilder.js` (new): takes the list of per-file `{ namespace, resources, clients }` results from `ConfigIncluder`+`ConfigParser`, groups them by `namespace` name (merging maps for files sharing a namespace), raising `DuplicateNamespaceItem` on a name collision within one namespace group, builds one `Namespace` (Step 3) per group, then eagerly validates every resource/client reference collected while parsing actions/paginated_actions/client-refs (Step 2) resolves via `NamespaceMap` — raising immediately (fail-fast) instead of waiting for request time.
- `source/lib/services/ConfigLoader.js`: `load()` now delegates to `ConfigIncluder` (instead of parsing a single file directly) and returns `{ namespaceMap, workersConfig, webConfig, logConfig, failureConfig }`, sourcing the non-resource/client sections only from the entry file's parsed object.

### Step 5 — Wire `NamespaceMap` through `Config` and the job pipeline
- `source/lib/models/configs/Config.js`: constructor takes `namespaceMap` instead of separate `resources`/`clients`, calling `NamespaceMap.build(namespaceMap)` (or receiving an already-built map from `ConfigLoader` — match whichever keeps `Config` a thin container, consistent with today's style). `getResource(name, namespace)`/`getClient(name, namespace)` delegate to `this.namespaceMap.getResource('default', name, namespace)` / `getClient(...)`, treating direct `Config`-level callers as originating from `default`.
- `source/lib/services/ApplicationInstance.js:300,303-304`: replace the `clients: this.config.clientRegistry` / `clientRegistry: this.config.clientRegistry` attributes passed into `JobFactory.build('ResourceRequestJob', ...)`, `'HtmlParse'`, and `'AssetDownload'` with `this.config.namespaceMap`.
- `source/lib/jobs/ResourceRequestJob.js`: `#getClient()` changes from `this.#clients.getClient(this.#resourceRequest.clientName)` to `this.#clients.getClient(this.#resourceRequest.namespace, this.#resourceRequest.clientName, this.#resourceRequest.clientNamespace)` (param renamed/repurposed to hold the injected `NamespaceMap`).
- Asset/HTML-parse client resolution (`ResourceRequest#enqueueAssets`, `HtmlParseJob`, `AssetDownloadJob`) is out of scope for namespace-aware resolution per the issue — leave these resolving against the `default` namespace's client registry (e.g. `namespaceMap.getClient('default', name)`), noted as a Note below rather than a blocking requirement.

### Step 6 — Tests
Mirror `source/spec/` structure (`docs/agents/architecture/testing.md`) for every new/changed class:
- New specs for `Namespace`, `NamespaceMap`, `ConfigIncluder`, `NamespaceMapBuilder`, and the new exception classes.
- Update existing specs: `Config_fromFile_spec.js`, `Config_getResource_spec.js`, `Config_getClient_spec.js`, `ResourceRegistry`/`ClientRegistry` specs (instance-mode usage), `ResourceRequestAction`/`ResourceRequestPaginatedAction` specs (namespace + originNamespace resolution), `ResourceRequestJob` spec (namespace-aware client lookup).
- New fixture YAMLs under `source/spec/support/fixtures/config/` for: a multi-file config with `include:` + cross-namespace resource/client references (mirroring the issue's example), a duplicate-name-in-merged-namespace error case, an unresolvable-namespace error case, and a plain single-file config with no `namespace`/`include` (regression check for full backward compatibility).
- All existing single-file fixtures/specs must keep passing unchanged, since backward compatibility is a hard requirement.

## Files to Change
- `source/lib/exceptions/registry/NamespaceNotFound.js` — new
- `source/lib/exceptions/registry/DuplicateNamespaceItem.js` — new
- `source/lib/exceptions/config/ConfigurationIncludeNotFound.js` — new (or reuse `ConfigurationFileNotFound`)
- `source/lib/models/request/Resource.js` — carry `namespace`
- `source/lib/services/Client.js` — carry `namespace`
- `source/lib/models/request/ResourceRequestAction.js` — target `namespace` + `originNamespace`, resolve via `NamespaceMap`
- `source/lib/models/request/ResourceRequestPaginatedAction.js` — same
- `source/lib/models/request/ResourceRequest.js` — `clientNamespace` + owning `namespace`
- `source/lib/registry/Namespace.js` — new
- `source/lib/registry/NamespaceMap.js` — new
- `source/lib/services/ConfigIncluder.js` — new
- `source/lib/services/NamespaceMapBuilder.js` — new
- `source/lib/services/ConfigLoader.js` — delegate to `ConfigIncluder`
- `source/lib/services/ConfigParser.js` — per-file parsing, namespace-aware
- `source/lib/models/configs/Config.js` — hold/delegate to `NamespaceMap`
- `source/lib/services/ApplicationInstance.js` — wire `namespaceMap` into `JobFactory` attributes
- `source/lib/jobs/ResourceRequestJob.js` — namespace-aware client resolution
- Corresponding spec files under `source/spec/` for every file above, plus new fixture YAMLs under `source/spec/support/fixtures/config/`

## CI Checks
- `source`: `npm run coverage` (CI job: `jasmine`)
- `source`: `npm run lint` (CI job: `checks`)

## Notes
- `ResourceRegistry`/`ClientRegistry` keep their existing static singleton facade (used elsewhere/in simpler tests); `NamespaceMap` uses them only in instance mode (`new ResourceRegistry(items)`), so no existing single-namespace call site breaks.
- Asset/HTML-parse client resolution is left resolving against the `default` namespace only — revisit if a future issue asks for namespace-aware asset clients.
- Duplicate/circular `include`s are handled by silently skipping an already-visited resolved file path rather than raising an error — simplest safe behavior; revisit if the issue owner wants a hard error instead.
- `Config#getResource`/`getClient` (the non-request-time, direct-lookup path) treat the caller as originating from `default` — there is no "requester" concept at that layer, so this is a reasonable default rather than a strict requirement from the issue.
