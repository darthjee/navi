# Document retry policy, tracking endpoints, and dashboard screens

## Retry policy

In the `## Data Extraction and Emission` section added in Step 1, add a short subsection documenting `EmitJob`'s default retry behavior, sourced from `docs/agents/future/crawler/decisions.md` decisions #14/#16/#17 and `source/lib/models/request/ResourceRequestEmit.js`:

- Default: 5 retries, 5000ms cooldown between attempts — distinct from the global `workers.max-retries`/`workers.retry_cooldown` (3/2000ms), since external endpoints are more likely to be transiently flaky.
- Overridable per emit via `emit.retries`/`emit.cooldown` (already listed in the Step 2 Fields table — cross-reference rather than repeat the row description).
- Retries on 5xx, 429, 408, and network-level errors (no response); dead-letters immediately on any other 4xx.
- A `429` response honors `Retry-After` (capped at 60s) instead of the normal cooldown; malformed/missing values fall back to the normal cooldown.

## Tracking/observability endpoints

Add a subsection (or extend the existing unauthenticated-endpoints note pattern used for `GET /memory/status.json` at `README.md:216-222`) documenting:

- `GET /emissions.json` — returns `{ counts, emissions }`. `counts` is `{ extracted, emitted, failed, dead }`, monotonic even past ring-buffer eviction. `emissions` is a page of serialized records (`{ id, extractionId, status, url, method, httpStatus, error, itemRef, timestamp }`, `status` ∈ `success`/`failed`/`dead`), supporting a `?last_id=` cursor and paginated by `web.logs_page_size`.
- `GET /extractions.json` — returns `{ counts, extractions }`. `counts` is `{ extracted }` (sum of item counts, monotonic). `extractions` is a page of serialized records (`{ id, parserType, originUrl, itemCount, timestamp }`), one record per `ExtractionJob` run (not per item), same `?last_id=`/`web.logs_page_size` pagination as above.
- Both are also summarized under `emissions`/`extractions` keys in `GET /stats.json` (verify the exact `stats.json` shape by reading its handler/serializer before writing this bullet — do not guess the summary field names).
- Their ring-buffer retention is sized via the new top-level `emit.size` / `extraction.size` config keys (default `100` each) — add these two rows to the Step 2 Fields table (`emit.size`, `extraction.size`) rather than duplicating them here.
- Data resets on engine stop, same as the existing log buffers.

## Dashboard screens

Add two entries to the Web UI screens list (`README.md:476-494`, after the existing `**Memory status (`/#/memory/status`)**` entry), matching that list's style:

- **Extractions (`/#/extractions`)** (verify the exact route from `frontend/src/components/pages/controllers/ExtractionsController.jsx` / the router config before writing this) — shows extraction runs: parser type, origin URL, item count, timestamp, with running `extracted` totals.
- **Emissions (`/#/emissions`)** (verify the exact route from `frontend/src/components/pages/controllers/EmissionsController.jsx` / the router config before writing this) — shows individual emissions: status, target URL/method, HTTP status, error (when failed/dead), linked extraction, timestamp, with running `emitted`/`failed`/`dead` totals.

## Files to Change

- `README.md` — add the retry-policy subsection and tracking-endpoints documentation to the `## Data Extraction and Emission` section (Step 1), add `emit.size`/`extraction.size` rows to the Fields table (Step 2), and add the two dashboard-screen entries to the Web UI screens list.
