# Issue: Add a new restart type

## Problem

Right now, in the frontend we have a "Restart" button that triggers `PATCH /engine/restart`. Today, this endpoint just cycles the engine (stop then start) against the config already loaded in memory — it does **not** actually re-read the config file from disk, despite the name suggesting a reload.

Now that we have an API-based application (`POST /api/config` merges resources/clients into the running namespace at runtime), there's no way to pick up changes made to the on-disk config file(s) without restarting the whole process — and no distinct action for "just cycle the engine as-is" versus "re-read the config file(s) and pick up any changes."

## Dependency

This issue **depends on #612** (making `NamespaceMap` the single, live source of truth for resource/client resolution). Until #612 lands, `ApplicationInstance#enqueueFirstJobs()` resolves resources through a stale, boot-time-cached registry (`Config#resourceRegistry`), so any resources added via `POST /api/config` are silently dropped from re-enqueue on restart. The solution below assumes that bug is already fixed — i.e. that cycling the engine always re-enqueues whatever is currently live in the default namespace, API additions included.

## Solution

Add a new `PATCH /engine/reload` endpoint and frontend "Reload" button. **`PATCH /engine/restart` and its existing button are left untouched** — post-#612, its current stop+start-against-live-namespace behavior already is what "Restart" should do, so there's nothing to move or rename.

"Reload" re-reads the config file(s) from disk and merges them into the live namespace, then cycles the engine exactly like Restart does today:

- Same precondition as Restart: only valid while the engine is running (`ConflictError` otherwise).
- Sequence: stop the engine, re-read and merge the on-disk config into the live `NamespaceMap`, then start the engine again (re-enqueuing parameter-free resources from the now-refreshed namespace).
- The merge preserves anything added via `POST /api/config` — it reuses `NamespaceMap.include()`'s existing merge semantics (seeded from current state, file contents merged/replacing on name collision), the same machinery `POST /api/config` already relies on. It does not reset/wipe live state.

### Implementation notes

Re-reading the config file at runtime isn't a trivial reuse of existing boot-time code, because of two gaps found while scoping this:

1. `ApplicationInstance` doesn't retain the config file path after boot (`loadConfig(configPath)` only ever receives it as a transient parameter) — it needs to be cached on the instance so a later reload can reuse it.
2. `Config.fromFile()` can't just be called again: it goes through `NamespaceMap.build()`, which throws on a second call unless preceded by `NamespaceMap.reset()` — and `reset()` would wipe all live API-added state, which reload must not do. `ConfigLoader.load()` already resolves the config file down to the raw per-file `{namespace, resources, clients, filePath}` entries (via `ConfigIncluder.resolve()`) before grouping them into `Namespace` instances for the one-time boot build; those raw entries need to be exposed so reload can feed them through `NamespaceMap.include()` instead — the same merge path `ApiConfigHandler` already uses for `POST /api/config`.

## Related

`#612` (live `NamespaceMap` resolution) is a prerequisite for this issue — otherwise the new "Reload"/"Restart" re-enqueue step would inherit the same stale-reference bug.
