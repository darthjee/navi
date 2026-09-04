# Issue: Memory history: document data_store config + /memory/history.json

## Description

#762–#765 landed the memory-history feature: a `web.memory.data_store` config block, a
`MemoryRegistry`/`MemorySampler` backend buffer, the `GET /memory/history.json` endpoint,
and a frontend chart on `/#/memory/status`. `docs/agents/web-server.md` — the existing
reference for `web:` config and endpoints — already sketches `data_store` and its keys, but
was written before the endpoint landed and describes it in future tense. This issue brings
that doc up to date.

## Problem

`docs/agents/web-server.md` already documents the `web.memory.data_store` block
(`size: 100`, `interval: 5`, `page_size: 20`) in its `## Configuration` section
(around lines 293-326), but with stale "not implemented yet" language now that
`GET /memory/history.json` actually exists:

- `page_size (default 20, ...) bounds how many entries a future /memory/history.json
  endpoint returns per request; nothing reads it yet` (stale)
- `The read endpoint (/memory/history.json) that will serve this buffer over HTTP
  does not exist yet — that's a later sub-issue.` (stale)

`GET /memory/history.json` itself is also missing from the routes table (`## Routes`)
and has no dedicated `### GET /memory/history.json` section, unlike its siblings
`/memory/status.json`, `/emissions.json`, `/logs.json`.

Separately: `docs/guides/navi/reference.md` (the user-facing guide's "Headless vs.
web UI mode" section) never mentions `web.memory` at all — not the config, not
`/memory/status.json`, nor any HTTP endpoint (consistent with the guide's existing
pattern: it lists *screens*, e.g. Dashboard/Jobs list/Job detail, never raw JSON
endpoints, which stay in `docs/agents/web-server.md`). It's also missing a "Memory
status" row for the `/#/memory/status` screen, which already shipped before this
issue and now includes the historical usage graph these sub-issues power.

## Solution

**`docs/agents/web-server.md`** (the detailed `web:` config/endpoint reference):

- Add `GET /memory/history.json` to the `## Routes` table, next to
  `/memory/status.json`: "Paginated, oldest-first buffer of recent RSS memory
  readings (cursor pagination via `last_id`, same as `/logs.json`)."
- Add a `### GET /memory/history.json` section (next to `### GET /memory/status.json`
  and `### GET /emissions.json`) documenting:
  - Query param `last_id` — return only entries newer than this id (cursor
    pagination, same semantics as `/logs.json` / `/emissions.json`).
  - Response: a JSON array, oldest-first, of
    `{ id, value, percentage, timestamp }`, capped at `web.memory.data_store.page_size`
    — `value` is process RSS in bytes, `percentage` is relative to the resolved
    `web.memory.maximum`, `timestamp` is an ISO 8601 string.
- Fix the two stale sentences called out in Problem (the `page_size` sentence and
  the `MemorySampler` paragraph) so they state the endpoint exists and serves the
  buffer, instead of describing it as pending/future work. Keep the accurate parts
  as-is: the `size` (default 100), `interval` (default 5, validated `> 0`),
  `page_size` (default 20) keys; the `size × interval` retained-window math (~8 min
  at defaults); the in-memory-only / lost-on-restart caveat; and the "only runs when
  `web:` is present" caveat.

**`docs/guides/navi/reference.md`** (the user-facing "Headless vs. web UI mode"
section), at the same high-level, non-exhaustive style the guide already uses for
the other screens/config (i.e. no raw JSON shapes here — those stay in
`docs/agents/web-server.md`):

- Add a "Memory status" row to the screens table: `/#/memory/status` — real-time
  RSS usage against the configured maximum, plus the historical usage graph.
- Add a short `web.memory` config blurb alongside the screens table covering
  `maximum`, `thresholds`, and `data_store` (`size`/`interval`/`page_size`) with
  their defaults, the retained-window note (`size × interval`, ~8 min at defaults),
  and that the buffer is in-memory only (lost on restart). Link to
  `docs/agents/web-server.md` for the full HTTP API reference, the same way this
  guide doesn't restate every other endpoint's JSON shape either.

## Benefits

- `docs/agents/web-server.md` stops telling readers a shipped endpoint "does not
  exist yet," and `GET /memory/history.json` gets the same documentation treatment
  as its sibling endpoints.
- `docs/guides/navi/reference.md` readers learn `web.memory` and the Memory status
  screen exist at all, without duplicating the full HTTP API reference that already
  lives in `docs/agents/web-server.md`.
