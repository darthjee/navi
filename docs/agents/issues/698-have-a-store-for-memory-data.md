
## Problem

The issue requests creating an in-memory storage mechanism for process memory usage data, following the same pattern already used for logs. Today, the `GET /memory/status.json` endpoint (added in PR #689 / issue #684) returns an instantaneous snapshot — `{ current, maximum, percentage, status }` — but there is no history. The goal is to be able to push memory readings into a size-limited buffer (default 100), to later expose paginated queries, exactly like what already exists with logs.

**Scoped down:** the issue explicitly states this is **not about starting the recording** nor about retrieving/exposing the data — it is solely about **adding the store mechanism**.

---

## Files Affected

| File | Current Responsibility |
| --- | --- |
| `source/lib/common/utils/logging/LogBuffer.js` | Ring buffer in memory with retention limit (unshift + pop). Direct model for the new store. |
| `source/lib/common/utils/logging/BufferedLogger.js` | Wrapper over LogBuffer, extends BaseLogger. Delegates add, getLogs, getLogById, etc. |
| `source/lib/common/utils/logging/Log.js` | Individual entry: id, level, message, attributes, timestamp. Has toJSON(). |
| `source/lib/common/utils/logging/LogFactory.js` | Creates Log instances with incremental IDs via IncrementalIdGenerator. |
| `source/lib/common/utils/logging/LogBufferCollection.js` | Map — one buffer per context (job/worker). |
| `source/lib/utils/memory/ProcessRssReader.js` | Reads process.memoryUsage().rss. Will be the source of value. |
| `source/lib/models/configs/MemoryConfig.js` | Holds maximum and thresholds, derives status from percentage. |
| `source/lib/models/configs/WebConfig.js` | Already parses web.memory into MemoryConfig. Will need to accept data_store.size. |
| `source/lib/server/handlers/memory/MemoryStatusHandler.js` | Endpoint handler. Currently does instant read, does not store. |

---

## Documentation Context

- **AGENTS.md** points to `docs/agents/` with a content table. Relevant pages: `web-server.md` (routes, config), `folder-structure.md` (layout), `worker.md` (how `LogContext` is injected into `Worker`).
- **`docs/agents/web-server.md`** documents the `GET /memory/status.json` endpoint and the `web.memory` config with `maximum` and `thresholds`.
- **Config YAML** already has `log.size` (default 100) for the log retention limit. The issue asks for `memory.data_store.size` (also default 100), following the same pattern.
- **DI convention:** the project uses dependency injection consistently — each memory reader is a separate testable class (`ProcessRssReader`, `CgroupV2MemoryLimitReader`, etc.), and `LogBuffer` receives an injected `LogFactory`.

---

## Current State of the Code

Today, the memory flow works as follows:

1. `MemoryStatusHandler` receives the request
2. Calls `ProcessRssReader.read()` → returns current RSS in bytes
3. Gets `maximum` from `MemoryConfig`
4. Calculates `percentage = (current / maximum) * 100`
5. Derives `status` via `MemoryConfig.statusFor(percentage)`
6. Responds with JSON and **discards** — nothing is stored

The logging system, by contrast, has a complete pipeline: `BufferedLogger._output()` → `LogBuffer.add()` → creates `Log` via `LogFactory` → `unshift` on array → `pop` if retention exceeded → `getLogs()` returns `[...buffer].reverse()` (oldest-first).

The issue wants to replicate this pipeline for memory data.

---

## High-Level Solution Directions

### Approach A — Mirror `LogBuffer` with new parallel classes

Create `MemoryDataStore`, `MemoryData` (entry), `MemoryDataFactory`, following the same shape as `LogBuffer`/`Log`/`LogFactory`. The entry would have `{ id, value, percentage, timestamp }`.

- **Pro:** total isolation, no coupling between logging and memory. Each system evolves independently.
- **Pro:** follows the project's DI convention and small testable classes.
- **Con:** structural duplication — `LogBuffer` and `MemoryDataStore` would do nearly the same thing (ring buffer with retention).

### Approach B — Generalize `LogBuffer` into a generic `RingBuffer`

Extract the circular buffer logic into a generic base class (`BoundedBuffer` or similar), with `LogBuffer` and `MemoryDataStore` as specializations.

- **Pro:** eliminates duplication, DRY.
- **Con:** larger refactor, touches working logging code. May exceed the "just add the mechanism" scope.

### Approach C — Reuse `LogBuffer` directly with adapted `Log` entries

Use `LogBuffer` itself to store memory entries as `Log` objects with `level: 'info'`, `message: 'memory'`, and `attributes: { value, percentage }`.

- **Pro:** zero new buffer code.
- **Con:** incorrect semantics — logs have `level`, `message`, `attributes`, not `value`/`percentage`/`timestamp` as proper fields. The issue clearly states "each entry shall store the value, percentage and timestamp", suggesting a dedicated data model.

**Recommendation:** **Approach A** — create new parallel classes. The project values isolation and testability (each cgroup reader is a separate class, `LogBuffer` and `LogBufferCollection` are distinct). The duplication is minimal and controllable. The issue says "like we do with logs" — it is inspiration, not literal reuse.

---

## Resolved Questions

| Question | Resolution |
| --- | --- |
| Store location | `source/lib/utils/memory/` — alongside ProcessRssReader, MemoryMaximumResolver, etc. |
| Config path | `web.memory.data_store.size` (default 100) — under `web.memory`, only when `web.port` is active, like the rest of memory config |
| Incremental IDs | Yes, reuse `IncrementalIdGenerator` — each memory entry will have `id`, like logs |
| MemoryData as own class | Yes, independent class with private fields + `toJSON()`, mirroring `Log.js` |

---

## Final Store Architecture

The mechanism will have **4 new classes** in `source/lib/utils/memory/`, all mirroring the logging pattern:

1. **`MemoryData.js`** — individual entry
   - Private fields: `#id`, `#value`, `#percentage`, `#timestamp`
   - `toJSON()` returns `{ id, value, percentage, timestamp: this.#timestamp.toISOString() }`
   - Does **not** have `level`, `message` or `attributes` — it is a dedicated model, not a `Log`

2. **`MemoryDataFactory.js`** — factory
   - Receives injected `IncrementalIdGenerator` (default: `new IncrementalIdGenerator()`)
   - `build(value, percentage)` → returns `new MemoryData(id, value, percentage)`
   - Mirrors `LogFactory.js`

3. **`MemoryDataStore.js`** — ring buffer with retention
   - Private fields: array `#buffer` + `#retention` + `#factory`
   - `add(value, percentage)` → factory creates `MemoryData` → `unshift` on array → `pop` if retention exceeded
   - `getEntries()` → `[...this.#buffer].reverse()` (oldest-first)
   - `getEntryById(id)` → `find()`
   - `clear()` → zeroes the array
   - `get size` → `this.#buffer.length`
   - `get retention` → `this.#retention`
   - `toJSON()` → `[...this.#buffer].reverse().map(e => e.toJSON())`
   - Mirrors `LogBuffer.js` 1:1 in mechanics

4. **Config extension** — `MemoryConfig.js` and/or `WebConfig.js`
   - `web.memory.data_store.size` (default 100)
   - `WebConfig` already instantiates `MemoryConfig` — add `data_store` to `MemoryConfig` constructor
   - Follow the same defaults-with-spread pattern: `{ size: 100, ...data_store }`

---

## Wire-up (what NOT to do in this issue)

The issue is explicit: **"This is not about actually starting recording, not about retrieving, just to add the mechanism."** Meaning:

- The `MemoryDataStore` must exist and be instantiable
- **Do not** create the loop that periodically reads RSS and calls `store.add()`
- **Do not** create read endpoints (`GET /memory/data.json` or similar)
- **Do not** integrate with `MemoryStatusHandler` yet

The store remains "ready to plug in" — the next issue will handle calling `.add()` at the right time and exposing the data.

---

## Base for Deep Planning

The next AI should start from:

1. **Create `source/lib/utils/memory/MemoryData.js`** — entry class with `{ id, value, percentage, timestamp }` + `toJSON()`
2. **Create `source/lib/utils/memory/MemoryDataFactory.js`** — factory with injected `IncrementalIdGenerator`, method `build(value, percentage)`
3. **Create `source/lib/utils/memory/MemoryDataStore.js`** — ring buffer (`unshift` + `pop`), configurable retention, methods `add/getEntries/getEntryById/clear/size/retention/toJSON`
4. **Extend `MemoryConfig.js`** — accept `data_store: { size }` in constructor, default 100, validate as positive integer
5. **Update `WebConfig.js`** — pass `memory.data_store` through to `MemoryConfig` (already passes `memory` today)
6. **Create Jasmine specs** with 100% diff coverage (pattern from PR #689) — one spec per new class
7. **Update `docs/agents/web-server.md`** — document `web.memory.data_store.size` in the config section
