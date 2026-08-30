# Documentation

Update the `docs/agents/` architecture docs that describe the web server and the crawler.
(User-facing README / DOCKERHUB coverage of the crawler is #699 Step 7, a separate `docs`
issue — do not touch those here.)

## `docs/agents/web-server.md`

- `## Routes` table — add a row:
  `| GET | /emissions.json | Crawler emission tracking: aggregate counters plus a paginated ring buffer of per-emission records. |`
- Add a `### GET /emissions.json` subsection near `### GET /memory/status.json`, documenting
  the `{ counts: { extracted, emitted, failed, dead }, emissions: [ { id, status, url, method, httpStatus, error, itemRef, timestamp } ] }`
  envelope, the `status` values (`success` / `failed` / `dead`), the `?last_id=` cursor and
  `web.logs_page_size` page size.
- `### GET /stats.json` (or the stats description) — note the new `emissions` key alongside
  `jobs` / `workers`.
- `## Configuration` — document the new top-level `emit.size` (default 100): retention of
  the in-memory emission ring buffer. Explicitly state it is a **top-level** key, separate
  from the per-resource `resources.*.emit` block, mirroring how top-level `log.size` relates
  to logging. Mention counters are unbounded and reset on engine stop.
- `## Serialization` — mention `EmissionSerializer` alongside `LogSerializer`.
- `## Source layout` — add `handlers/emissions/` if that section enumerates handler dirs.

## `docs/agents/future/crawler/overview.md`

- Objective 6 ("Reuse the existing clients infrastructure") is unrelated wording, but the
  original **tracking/observability** objective that was cut is what this delivers — update
  the objectives list / status note to record that emission tracking (counters + ring
  buffer + `GET /emissions.json`) is now implemented.

## `docs/agents/future/crawler/decisions.md`

- Add a decision entry: emission tracking uses a `LogRegistry`-style static
  `EmissionRegistry` over a `MemoryDataStore`-style ring buffer, sized by top-level
  `emit.size`; per-emission records carry `status` ∈ {success, failed, dead}; write helpers
  no-op when the registry is unbuilt so core job flow is never coupled to observability;
  data resets on engine stop. Cross-reference #703 and #698.

## `docs/agents/future/crawler.md` (hub) — optional

- If the hub lists sub-feature status, mark tracking/observability done.

## Files to Change

- `docs/agents/web-server.md` — new route, stats key, `emit.size` config, serializer, layout.
- `docs/agents/future/crawler/overview.md` — record emission tracking as implemented.
- `docs/agents/future/crawler/decisions.md` — new decision entry for the tracking design.
- `docs/agents/future/crawler.md` — status update (only if the hub tracks per-feature status).
