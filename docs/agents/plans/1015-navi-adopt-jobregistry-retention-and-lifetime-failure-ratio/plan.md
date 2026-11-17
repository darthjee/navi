# Plan: Navi: adopt JobRegistry retention and lifetime failure ratio

Issue: [1015-navi-adopt-jobregistry-retention-and-lifetime-failure-ratio.md](../../issues/1015-navi-adopt-jobregistry-retention-and-lifetime-failure-ratio.md)

## Overview

Wire deku-swarm's terminal-job retention (#1006) into navi. A new optional `workers.retention: { finished, dead }` block is parsed by `WorkersConfig` and forwarded to `JobRegistry.ensureBuild`. `WorkersRegistry` now gets `quantity` explicitly instead of the whole config spread. `FailureChecker` and `RunReporter` switch to lifetime counts (resident + `pruned`) so the exit code and the run log stay correct and agree with each other. The dashboard gains a Pruned group, the production image gains `RETENTION_FINISHED` / `RETENTION_DEAD` env vars, and user-facing and agent docs are updated. Nothing in `deku-swarm/` changes.

## Agents involved

- [engine](engine.md)
- [frontend](frontend.md)
- [docker](docker.md)
- [docs](docs.md)

## Shared contracts

- **YAML config** (consumed by engine, produced by docker's `web.yml` / dev sample, documented by docs):

  ```yaml
  workers:
    retention:          # optional
      finished: 100     # optional non-negative integer
      dead: 100         # optional non-negative integer
  ```

  Omitted block, empty block (`null`), or `null` values mean "no cap" for that status. Other keys are forwarded to deku-swarm, which rejects unknown keys and non-integers at boot (`Invalid retention key: <k>` / `Invalid retention.<k>: must be a non-negative integer`).
- **`WorkersConfig#retention`**: `undefined` when no cap is set; otherwise a plain object containing only the non-null keys (e.g. `{ finished: 100 }` — never `{ finished: 100, dead: undefined }`).
- **`GET /stats.json`**: `jobs.pruned: { finished: number, dead: number }` — already emitted today by `StatsHandler` passing `JobRegistry.stats()` through; may be absent when the frontend talks to an older backend. Counters are cumulative evictions and reset to `0` on engine stop (`clearQueues()`).
- **Production image env vars**: `RETENTION_FINISHED`, `RETENTION_DEAD` — defined empty by default in the Dockerfile (empty → YAML `null` → no cap, no "Environment variable not defined" warning). Mapped to `workers.retention.finished` / `.dead` in `dockerfiles/production_navi_hey/config/web.yml`.
- **Lifetime counts** (engine-internal, documented by docs): failure ratio = `(dead + pruned.dead) / (total + pruned.finished + pruned.dead)`; `RunSummary` gets `totalJobs = total + pruned.finished + pruned.dead`, `failedJobs = failed + retryQueue + dead + pruned.dead`. "Lifetime" = since the last stop / `clearQueues()`.
- **Versions**: navi app (`source/`) patch bump via `scripts/bump_version.sh` (engine). No `deku-swarm`, `deku-sprout` or client bump.
