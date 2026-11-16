# Plan: JobRegistry: prune finished and dead jobs

Issue: [1006-jobregistry-prune-finished-and-dead-jobs.md](../../issues/1006-jobregistry-prune-finished-and-dead-jobs.md)

## Overview

Bound the memory `deku-swarm`'s `JobRegistry` holds for terminal jobs. `JobRegistryInstance` gains a build-time `retention` count cap (enforced on push in `finish()` / `fail()`) and a manual `prune({ statuses, keep, olderThan })`, both sharing one private eviction helper. `Job` gains a read-only `endedAt`, `stats()` gains cumulative `pruned` counters, and `IdentifyableCollection` switches to `Map` storage so "oldest" means insertion order for any id type. Pending collections are never touched. Navi `source/` adoption is out of scope (#1015).

## Agents involved

- [deku-swarm](deku-swarm.md)
- [docs](docs.md)

## Shared contracts

- `JobRegistry.build({ retention: { finished?: number, dead?: number } })` / `ensureBuild(...)` — non-negative integers; omitted status = unbounded; `0` = evict on arrival.
- `JobRegistry.prune({ statuses = ['finished', 'dead'], keep, olderThan } = {})` → `{ finished: number, dead: number }` (removed counts; unselected statuses report `0`). `keep`: non-negative integer, keeps the N most recent. `olderThan`: non-negative ms, removes jobs with `endedAt < Date.now() - olderThan`; jobs with `endedAt === null` are never removed by `olderThan`. Rules combine as a union. With neither `keep` nor `olderThan`, all jobs of the selected statuses are removed.
- Invalid input throws `Error`: negative / non-integer `keep` or retention values, negative `olderThan`, unknown or non-terminal statuses (`prune()` validates on call, `retention` at construction).
- `job.endedAt` — epoch ms or `null`; set on entering `finished` / `dead`, reset to `null` by `retryJob()` on a dead job.
- `stats()` → existing `{ enqueued, processing, failed, retryQueue, finished, dead, total }` unchanged (in-memory counts) plus `pruned: { finished, dead }` (cumulative evictions, reset by `clearQueues()`).
- Pruned jobs: `jobById(id)` and `retryJob(id)` return `null`.
- Versions: `deku-swarm` 1.14.0 → 1.15.0; app (`source/`) 1.14.3 → 1.14.4.
