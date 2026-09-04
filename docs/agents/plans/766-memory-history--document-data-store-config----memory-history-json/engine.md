# Engine Plan: Memory history: document data_store config + /memory/history.json

Main plan: [plan.md](plan.md)

## Shared contracts

- `web.memory.data_store.size` (default `100`), `.interval` (default `5`, validated `> 0`),
  `.page_size` (default `20`) — must match the values `docs.md` states for the same keys.
- Retained window ≈ `size × interval` seconds (~8 min at defaults) — same wording basis as `docs.md`.
- Own exclusively: the `GET /memory/history.json` request/response shape (query param `last_id`,
  JSON array of `{ id, value, percentage, timestamp }`).

## Implementation Steps

### Step 1 — Add `GET /memory/history.json` to the routes table and give it its own section

In `docs/agents/web-server.md`:

- Add a row to the `## Routes` table (next to `/memory/status.json`, currently around line 67):
  `| GET | /memory/history.json | Paginated, oldest-first buffer of recent RSS memory readings (cursor pagination via last_id, same as /logs.json). |`
- Add a `### GET /memory/history.json` section, placed next to `### GET /memory/status.json` and
  `### GET /emissions.json`, documenting:
  - Query param `last_id` — return only entries newer than this id (cursor pagination, same
    semantics as `/logs.json` / `/emissions.json`).
  - Response: a JSON array, oldest-first, of `{ id, value, percentage, timestamp }`, capped at
    `web.memory.data_store.page_size` — `value` is process RSS in bytes, `percentage` is relative
    to the resolved `web.memory.maximum`, `timestamp` is an ISO 8601 string.
  - A short example JSON array, matching the style of the `/memory/status.json` / `/emissions.json`
    examples already in the file.

### Step 2 — Fix the stale "not implemented yet" wording

In the same file's `## Configuration` section (around lines 293-326):

- The `page_size` sentence currently reads "...bounds how many entries a future
  `/memory/history.json` endpoint returns per request; nothing reads it yet, exactly as `size`
  was landed ahead of its consumer." — rewrite to state the endpoint exists and is what reads
  `page_size`.
- The `MemorySampler` paragraph currently ends "The **read endpoint** (`/memory/history.json`)
  that will serve this buffer over HTTP does not exist yet — that's a later sub-issue." — rewrite
  to state the endpoint exists, linking forward to the new `### GET /memory/history.json` section
  from Step 1.
- Leave the rest of that section (`size`/`interval`/`page_size` defaults, the `size × interval`
  window math, the in-memory-only/lost-on-restart caveat, the `web:`-only caveat, the `interval`
  validation note, the "boot-time only, no live reload" note) unchanged — it's already accurate.

## Files to Change

- `docs/agents/web-server.md` — add the `/memory/history.json` route row + section (Step 1); fix
  the two stale sentences in `## Configuration` (Step 2).

## Notes

- Purely a documentation change — no `source/` code is touched, so no CI check applies (the
  CircleCI `checks*`/`jasmine*` jobs run lint/tests over JS, not markdown).
