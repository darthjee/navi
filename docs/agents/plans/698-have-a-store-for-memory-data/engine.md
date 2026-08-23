# Engine Plan: Have a store for memory data

Main plan: [plan.md](plan.md)

## Overview

`MemoryStatusHandler` currently reads `process.memoryUsage().rss` on every request and discards it. This plan adds a dedicated, size-limited ring buffer for memory readings, following the exact shape of the existing logging pipeline (`LogBuffer` → `Log` → `LogFactory`), so a later issue can plug in the periodic recording loop and a read endpoint without touching the store itself.

Nothing in this plan starts recording or exposes the data — only the storage classes and their config are added.

## Steps

- [01 — Add the MemoryData entry class](engine/01-add-memory-data-entry.md)
- [02 — Add the MemoryDataFactory](engine/02-add-memory-data-factory.md)
- [03 — Add the MemoryDataStore ring buffer](engine/03-add-memory-data-store.md)
- [04 — Extend MemoryConfig with data_store.size](engine/04-extend-memory-config.md)
- [05 — Document web.memory.data_store.size](engine/05-update-web-server-docs.md)

## CI Checks

- `source`: `npm run coverage` (CI job: `jasmine`) — 100% diff coverage required, same as PR #689.

## Notes

- `WebConfig.js` already passes the entire raw `web.memory` object into `new MemoryConfig(memory)` — it does not need a code change to forward `data_store`; only its `@param` JSDoc for `config.memory` should be extended to mention `data_store`. Do not add a redundant `data_store` parameter to `WebConfig`'s constructor destructuring.
- The issue's own analysis suggested validating `data_store.size` as a positive integer, but the existing precedent (`LogConfig`'s `size`) has no such validation — just a bare default via object spread. Prefer matching that precedent (`{ size: 100, ...data_store }`, no new exception class) unless a concrete reason to diverge shows up during implementation.
- Do not create the RSS-polling loop, do not add a `GET /memory/data.json` (or similar) endpoint, and do not integrate with `MemoryStatusHandler` — explicitly out of scope per the issue.
- Reuse `IncrementalIdGenerator` (`source/lib/utils/generators/IncrementalIdGenerator.js`) for `MemoryDataFactory`, injected the same way `LogFactory` does it.
