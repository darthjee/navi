# Plan: Crawler: add frontend dashboard views for extraction and emission monitoring

Issue: [704-crawler-add-frontend-dashboard-views-for-extraction-and-emission-monitoring.md](../../issues/704-crawler-add-frontend-dashboard-views-for-extraction-and-emission-monitoring.md)

## Overview

#703 landed an emission-tracking layer (`EmissionStore` / `EmissionRegistry`, `GET /emissions.json`, `emissions` block in `GET /stats.json`) but it is emission-only and flat: no per-extraction record, no link from an emission back to the extraction that produced it. This plan adds, on the **engine** side, a parallel per-extraction store plus an `extractionId` link stamped onto every emission record and a `GET /extractions.json` endpoint; and on the **frontend** side, two dedicated views (`/extractions` and `/emissions`) plus an emissions summary in the always-visible `StatsHeader`. Together they surface the per-crawl chain `resource (origin URL) -> parser type -> items extracted -> emits sent -> emit status`.

Transient data is acceptable — both ring buffers reset on engine stop, and the emission↔extraction join is best-effort (bounded by ring-buffer retention).

## Context

- `ExtractionJob` (`source/lib/jobs/ExtractionJob.js`) resolves a parser, produces an array of items, calls `EmissionRegistry.incExtracted(items.length)`, and — when the resource declares an `emit` — hands the items to `EmitEnqueuer`, which enqueues one `EmitJob` per item.
- `EmitJob` (`source/lib/jobs/EmitJob.js`) sends one item and calls `EmissionRegistry.recordEmission({ status, url, method, httpStatus, error, itemRef })` on both success and failure.
- The #703 store lives in `source/lib/utils/emissions/*` (`EmissionRecord`, `EmissionRecordFactory`, `EmissionStore`) with a static facade in `source/lib/registry/EmissionRegistry.js` + `EmissionRegistryInstance.js`. It is built in `ApplicationConfigurator.load()` (`source/lib/services/application/ApplicationConfigurator.js:27`) sized by the top-level `emit:` YAML key (`EmitConfig`), and cleared by the engine `stop` listener in `EngineController.bind()` (`source/lib/services/engine/EngineController.js:100`). `GET /emissions.json` is served by `EmissionsHandler` (`source/lib/server/handlers/emissions/EmissionsHandler.js`), routed in `source/lib/server/Router.js:72`, capped at `web.logs_page_size`.
- The only resource identifier available to `ExtractionJob` today is `originUrl` (the triggering page URL) plus `parser.type`. No resource name/namespace is threaded through — this plan uses `originUrl` as the "resource" and treats threading a real resource name as out of scope.
- Frontend (`frontend/`): React 19 + Vite 7 + hash routing (`src/main.jsx`), raw Bootstrap classes, hand-rolled polling. New page views follow the three-file `pages/<Name>.jsx` + `controllers/<Name>Controller.jsx` + `helpers/<Name>Helper.jsx` convention (`MemoryStatus` and `LogsPage`/`Logs` are the templates). `StatsClient.normalizeStats` currently drops the `emissions` field returned by `/stats.json`. `src/constants/jobClasses.js` already lists `ExtractionJob` and `EmitJob`.
- `frontend/dist/` and `source/static/` are **not committed** — CI builds the frontend at release time. `yarn build` is only a local smoke check.

## Agents involved

- [engine](engine.md) — extraction store + registry + config, extraction recording, emission→extraction link, `GET /extractions.json`.
- [frontend](frontend.md) — `ExtractionsClient` / `EmissionsClient`, emissions summary in `StatsHeader`, `/emissions` and `/extractions` page views.

## Shared contracts

### 1. `extractionId` on emission records (engine produces, frontend consumes)

Every emission record — and every entry in `GET /emissions.json` — gains a field:

- `extractionId: number | null` — the `id` of the extraction record (see contract 2) whose items produced this emission, or `null` when it cannot be traced.

`EmissionSerializer._serializeObject` output becomes:

```
{ id, extractionId, status, url, method, httpStatus, error, itemRef, timestamp }
```

`status` values are unchanged: `success` | `failed` | `dead`.

### 2. `GET /extractions.json` (engine produces, frontend consumes)

- Query: optional `?last_id=<number>` cursor — returns only records with `id > last_id`, same semantics as `/emissions.json` and `/logs.json`. Result list capped at `web.logs_page_size`.
- Response body:

```json
{
  "counts": { "extracted": 128 },
  "extractions": [
    {
      "id": 1,
      "parserType": "json",
      "originUrl": "https://example.com/list?page=1",
      "itemCount": 20,
      "timestamp": "2026-08-30T12:00:00.000Z"
    }
  ]
}
```

- `extractions` is ordered oldest-first.
- `counts.extracted` is the monotonic sum of every `itemCount` for the run (exact past ring-buffer eviction), mirroring the meaning of `emissions.counts.extracted`.
- `originUrl` may be `null` (extraction triggered without an origin URL).

### 3. `GET /stats.json` — unchanged

It already returns `emissions: { extracted, emitted, failed, dead }` via `StatsHandler`. The frontend `StatsHeader` work consumes that existing field; no engine change to `/stats.json` is required. (`emissions.extracted` stays the authoritative extracted count shown in the header.)

## CI Checks

- `source`: `npm run test` and `npm run lint` (CI jobs: `jasmine`, `checks`)
- `frontend`: `yarn test` and `yarn lint` (CI jobs: `jasmine-frontend`, `checks-frontend`)

## Notes

- **Deliberate counter duplication.** `ExtractionJob` keeps calling `EmissionRegistry.incExtracted(items.length)` (so #703's `/emissions.json` and `/stats.json` `emissions.extracted` and their specs are untouched) *and additionally* records an extraction in the new store, which derives its own `counts.extracted`. Both totals track the same number; `emissions.extracted` remains authoritative for the header.
- **Best-effort join.** The `/extractions` view joins emissions to extractions by `extractionId` on the client. Because the emission ring buffer only retains the most recent records, older extractions will show partial or no emit data — the view must degrade gracefully and label this.
- **Transient data.** Both stores reset on engine stop; both views and the header must render cleanly when counts are zero and feeds are empty, and must recover when a feed resets mid-session.
- Verify that `JobRegistry.enqueue('Emit', { ..., extractionId })` merges the per-enqueue `extractionId` into the job constructor params the same way `item` / `emit` / `parameters` already flow through `RegistriesBuilder`'s `JobFactory.build('Emit', …)` (`source/lib/services/builders/RegistriesBuilder.js`).
- `PaginatedActionProcessingJob` is missing from `frontend/src/constants/jobClasses.js`; noticed but out of scope for this issue.
