# Issue: Crawler: add frontend dashboard views for extraction and emission monitoring

## Description

Part of #699 (Next Steps for Crawler Implementation).

`ExtractionJob` and `EmitJob` are already registered in the frontend's `jobClasses.js` (#678), so crawler jobs appear in the generic jobs list. The #699 Step 4 observability work has since landed as #703: an emission-tracking layer (`EmissionStore` / `EmissionRegistry`) exposing global `{ extracted, emitted, failed, dead }` counters plus a per-emission ring buffer at `GET /emissions.json`, and an `emissions` block in `GET /stats.json`.

That layer is emission-only and flat. It records no per-extraction data (extraction is a bare global counter), no resource identity, no parser type, and no link between an emission and the `ExtractionJob` / resource that produced it — so the per-crawl chain `resource -> parser type -> items extracted -> emits sent -> emit status` cannot be assembled from what exists. The frontend also does not consume any of it yet.

This issue delivers that chain end to end: backend tracking for extractions plus an emission-to-extraction link, and dedicated frontend views for extraction and emission monitoring, built on the existing React + Vite + React Bootstrap stack.

## Problem

- The generic jobs list renders crawler jobs (`ID / status / attempts / class / url`) identically to every other job class. It gives no crawler-specific picture: which resource was crawled, which parser ran, how many items were extracted, how many emits were sent, and whether they succeeded.
- #703's store tracks emissions only: a global `{ extracted, emitted, failed, dead }` count and a 100-record ring buffer of `{ id, status, url, method, httpStatus, error, itemRef, timestamp }`. There is no per-extraction record and no reference from an emission back to its originating extraction / resource / parser.
- The frontend consumes none of this. `StatsClient.normalizeStats` drops the `emissions` field returned by `/stats.json`, and there is no client for `/emissions.json`.
- An operator watching crawler activity today has to infer everything from raw job rows and debug-level `ExtractionJob` logs.

## Expected Behavior

### Backend (engine)

- A per-extraction record store mirroring #703's ring-buffer pattern (`source/lib/utils/emissions/*` + `source/lib/registry/EmissionRegistry.js`), capturing per `ExtractionJob` run: an extraction id, resource identity, parser type, origin URL, item count, timestamp.
- `EmissionRecord` gains a reference to its originating extraction (extraction id / resource) so emissions group per crawl.
- New endpoint(s) exposing extraction records and the joined chain — e.g. `GET /extractions.json` with the same `last_id` cursor + `counts` shape as `/emissions.json`.
- `GET /stats.json` keeps exposing emission counts and additionally an extraction summary.
- Bootstrap and reset alongside `EmissionRegistry` (build in `ApplicationConfigurator`, clear on engine stop in `EngineController`), sized by a config key (`extraction.size`, or reuse `emit.size`).

### Frontend

- `/extractions` view: list of extraction records showing `resource -> parser type -> items extracted -> emits sent -> emit status` rollup per crawl, drilling into the related emissions.
- `/emissions` view: a counts strip (`extracted / emitted / failed / dead`) plus a live emissions feed table (`timestamp, status, method, url, httpStatus, error, itemRef`), status filter, `last_id` polling reusing the logs-stream pattern.
- `StatsHeader` gains an emissions summary (badges linking into the views); `StatsClient.normalizeStats` stops dropping `emissions`.
- Both views follow the three-file page / controller / helper convention (`MemoryStatus` as template), raw Bootstrap classNames, hand-rolled polling, new client(s) under `src/clients/`, routes wired in `main.jsx`, nav entries via `StatsDisplay.jsx`, specs under `spec/`, then `yarn build` and copy `dist/.` into `source/static/`.

## Solution

- Engine: add an extraction store + factory + registry facade following #703's structure; record an extraction in `ExtractionJob.perform()`; thread an extraction / resource ref through the `emit` payload so `EmitJob` stamps it onto the `EmissionRecord`; add handler + serializer + route; wire build/reset and config sizing.
- Frontend: `ExtractionsClient` + `EmissionsClient`; `Extractions` and `Emissions` pages (page / controller / helper [+ css]); reuse the `Logs.jsx` streaming pattern for the emissions feed; update `StatsClient.normalizeStats` and `StatsDisplay.jsx`; add routes; add specs; rebuild static assets.
- Transient data is acceptable: both ring buffers reset on engine stop and no persistence work is in scope.
- Out of scope: `PaginatedActionProcessingJob` is missing from `jobClasses.js` but is unrelated to this issue.

## Benefits

- Operators get a crawler-specific, per-crawl picture (`resource -> parser -> items -> emits -> status`) instead of inferring it from generic job rows and debug logs.
- Emission failures and dead targets are visible at a glance, both in the always-on `StatsHeader` and in a dedicated feed.
- Completes #699's observability story by adding the extraction half that #703 did not cover, and gives the crawler work its monitoring surface.

## Suggested owner

Cross-agent: `engine` (extraction tracking, emission link, endpoints, config/bootstrap) and `frontend` (the two views, stats strip, clients). `plan-issue` will split the work across both.
