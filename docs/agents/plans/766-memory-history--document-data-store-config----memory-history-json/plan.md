# Plan: Memory history: document data_store config + /memory/history.json

Issue: [766-memory-history--document-data-store-config----memory-history-json.md](../../issues/766-memory-history--document-data-store-config----memory-history-json.md)

## Overview

`#762`–`#765` shipped the `web.memory.data_store` config, the `MemoryRegistry`/`MemorySampler`
buffer, and the `GET /memory/history.json` endpoint, but the docs never caught up: the
agent-facing reference (`docs/agents/web-server.md`) still describes the endpoint as future
work, and the user-facing guide (`docs/guides/navi/reference.md`) never mentions `web.memory`
at all. This plan brings both up to date, at the level of detail each doc already uses for its
sibling config/endpoints.

## Agents involved

- [engine](engine.md)
- [docs](docs.md)

## Shared contracts

Both files must state the same facts about `web.memory`, without contradicting the other:

- `web.memory.maximum` — bytes; falls back to cgroup v2 → cgroup v1 → OS total memory when unset.
- `web.memory.thresholds` — `low`/`medium`/`high`/`over` percentage bands (defaults `25.0`/`50.0`/`75.0`/`100.0`).
- `web.memory.data_store.size` — default `100`; max readings retained in the in-memory ring buffer.
- `web.memory.data_store.interval` — default `5`; seconds between RSS samples; validated `> 0`.
- `web.memory.data_store.page_size` — default `20`; max entries `GET /memory/history.json` returns per request.
- Retained window ≈ `size × interval` seconds (~8 min at defaults).
- The buffer is in-memory only (lost on restart), and the sampler only runs when a `web:` section is present.
- The `/#/memory/status` screen (URL) is what this buffer/endpoint powers.

`docs/agents/web-server.md` (engine) additionally owns the exact `GET /memory/history.json`
request/response shape (query param, JSON field names/types) — `docs/guides/navi/reference.md`
(docs) does not restate that shape, consistent with how it already omits raw JSON shapes for
every other monitoring endpoint.
