# Docs Plan: Navi: adopt JobRegistry retention and lifetime failure ratio

Main plan: [plan.md](plan.md)

## Shared contracts

- Config: `workers.retention: { finished?, dead? }` — optional, independent; omitted / empty / `null` = unbounded; non-negative integers (`0` = evict on arrival); unknown keys or invalid values fail at boot.
- Env vars (production image): `RETENTION_FINISHED`, `RETENTION_DEAD`, default empty (= unbounded).
- `GET /stats.json`: `jobs.pruned: { finished, dead }` — cumulative evictions, reset on engine stop.
- Failure ratio and `RunSummary` use lifetime counts (resident + pruned since last stop / `clearQueues()`); retention never changes the `failure.threshold` verdict.

## Implementation Steps

### Step 1 — User-facing docs

- `docs/guides/navi/configuration-schema.md` and `docs/guides/navi/prerequisites.md`: add the `retention:` block to the annotated `workers:` YAML sample; add `workers.retention.finished` / `workers.retention.dead` rows stating: optional and independent; omitted, empty or `null` = unbounded; non-negative integers, unknown keys rejected at boot; evicted jobs disappear from job lists, return 404 and can't be retried (history traded for memory); moderate caps recommended (eviction cost, see #1022); recommended on long-lived servers (`web:` set), where it also bounds memory growth from crawls fanned out by remote content; a `workers.retention` key that was previously ignored is now validated. Extend the `failure.threshold` row: the ratio counts pruned jobs, so retention never changes the verdict.
- `docs/guides/navi/reference.md`: add `RETENTION_FINISHED` / `RETENTION_DEAD` (default empty = unbounded → `workers.retention.finished` / `.dead`) to the env var table; mention the Pruned counters in the Dashboard row.
- `README.md` and `DOCKERHUB_DESCRIPTION.md`: add the same two env var rows.

### Step 2 — Agent docs

- `docs/agents/flow/startup-and-config.md`: document the `workers.retention` block, `WorkersConfig#retention` normalization, forwarding in `RegistriesBuilder`, the explicit `quantity` to `WorkersRegistry`, and the history-for-memory trade-off.
- `docs/agents/flow/failure-handling.md`: ratio and `RunSummary` counts are lifetime (resident + pruned), "lifetime" = since the last stop / `clearQueues()`; `RunSummary.failedJobs` now includes `pruned.dead`.
- `docs/agents/web-server.md`: document `jobs.pruned` in the `/stats.json` payload and that evicted ids return 404 on `GET /job/:id.json` and the retry route.

## Files to Change
- `docs/guides/navi/configuration-schema.md`
- `docs/guides/navi/prerequisites.md`
- `docs/guides/navi/reference.md`
- `README.md`
- `DOCKERHUB_DESCRIPTION.md`
- `docs/agents/flow/startup-and-config.md`
- `docs/agents/flow/failure-handling.md`
- `docs/agents/web-server.md`

## Notes
- `docs/agents/*` is normally architect-owned; it is bundled here so all prose ships in one pass. Keep the agent docs factual about the implementation landed by engine.
- Don't document `endedAt` (#1021), manual prune or age-based retention (out of scope).
