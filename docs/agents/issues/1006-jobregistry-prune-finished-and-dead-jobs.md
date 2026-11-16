# Issue: JobRegistry: prune finished and dead jobs

## Description

Let a long-running host bound the memory held by `deku-swarm`'s `JobRegistry` for terminal jobs (`finished` and `dead`), through an automatic build-time count cap (`retention`) and a manual `prune()` call, without ever touching pending work.

## Problem

`JobRegistry` never discards jobs that reached a terminal state: `finished` and `dead` only grow. In a long-lived process (for example a web server using `keepAlive: true`) this is an unbounded memory leak. The only way to empty them is `clearQueues()`, which also drops `enqueued`, `retryQueue` and `failed`, so pending work would be lost. There is no way to prune only terminal jobs.

Found while adding background workers to Kerghan (darthjee/kerghan#479). Related: #1004 and #1005.

## Expected Behavior

- `JobRegistry.build({ retention: { finished: 100, dead: 100 } })` (also accepted by `ensureBuild`) caps each terminal collection: once a push in `finish()` / `fail()` exceeds the cap, the oldest jobs of that status are evicted. Each status is configured independently; an omitted status is unbounded (today's behavior).
- `JobRegistry.prune({ statuses = ['finished', 'dead'], keep, olderThan })` (on the static facade and on `JobRegistryInstance`) removes terminal jobs on demand and returns the removed counts per status, e.g. `{ finished: 12, dead: 3 }`.
  - `keep` retains only the N most recent jobs per status.
  - `olderThan` removes jobs whose `endedAt` is more than `olderThan` ms before now.
  - Both combine as a union: a job is removed if it violates either rule.
  - With neither `keep` nor `olderThan`, every job in the selected statuses is removed ("clear only terminal jobs").
- `enqueued`, `processing`, `failed` and `retryQueue` are never touched by retention or `prune()`.
- `Job` exposes a read-only `endedAt` (epoch ms, `null` until set): set when the job enters `finished` or `dead`, reset to `null` when `retryJob()` brings a dead job back.
- `stats()` keeps `finished`, `dead` and `total` (`dead + finished`) as in-memory counts, consistent with `jobsByStatus()`, and adds `pruned: { finished, dead }` — cumulative counts of evicted jobs (only grow; reset by `clearQueues()`). Lifetime totals are `finished + pruned.finished` and `dead + pruned.dead`.
- A pruned job is gone: `jobById(id)` and `retryJob(id)` return `null` for it, as for an unknown id.

## Solution

Scope: the `deku-swarm` package only. Navi `source/` adoption (config + `RegistriesBuilder`, lifetime-count `FailureChecker`, exposing `endedAt` / `pruned` in API and dashboard) is tracked in #1015.

### Ordering — `deku-swarm/lib/collections/IdentifyableCollection.js`

"Oldest" / "most recent" means order of arrival in the terminal collection. `IdentifyableCollection` currently stores items in a plain object, where integer-like ids (e.g. a caller-supplied `42`) are iterated numerically first, breaking insertion order. Switch its internal storage to a `Map` (insertion order for every key type, O(1) removal of the oldest entry) while keeping its public API, including accepting a plain object of initial items in the constructor.

### Terminal timestamp — `deku-swarm/lib/background/Job.js`

- Add a private `endedAt` (default `null`) with a read-only getter and a way for the registry to set/reset it.
- `JobRegistryInstance.finish()` sets it when pushing to `finished`; `fail()` sets it when pushing an exhausted job to `dead`; `retryJob()` resets it to `null` when moving a dead job to the retry queue.
- Jobs without `endedAt` (e.g. seeded through `build()`'s initial collections) are never removed by `olderThan`; `keep`, retention and a bare `prune()` still remove them.

### Pruning — `deku-swarm/lib/background/JobRegistryInstance.js` / `JobRegistry.js`

- New constructor option `retention = { finished, dead }`, validated at construction.
- One private eviction helper shared by retention (called after each push to `finished` / `dead`) and `prune()`, incrementing private `#prunedFinished` / `#prunedDead` counters.
- Retention is enforced lazily on push: initial collections exceeding a cap are trimmed on the next push to that collection.
- `prune()` validates on call and returns `{ finished, dead }` removed counts (statuses not selected report `0`).
- `clearQueues()` also resets the pruned counters.
- `stats()` adds `pruned: { finished, dead }`.
- Static facade gains `JobRegistry.prune(options)`; `build` / `ensureBuild` forward `retention`.

### Validation

Throw on: negative or non-integer `keep` / retention values, negative `olderThan`, and unknown or non-terminal statuses (e.g. `'enqueued'`). `keep: 0` and a retention of `0` are valid (`0` retention evicts on arrival, still counted in `pruned`).

### Specs

- `IdentifyableCollection`: insertion order kept with integer-like ids; plain-object constructor input still works.
- `Job`: `endedAt` default `null`.
- `JobRegistryInstance` / `JobRegistry`: retention cap per status (including `0` and omitted), `prune()` with `keep`, `olderThan` (with mocked time), union of both, bare `prune()`, `statuses` filter, return counts, jobs without `endedAt`, pending collections untouched, `stats().pruned` growth and reset by `clearQueues()`, `endedAt` set on finish/dead and reset by `retryJob()`, `jobById` / `retryJob` returning `null` for pruned jobs, and every validation error.

### Docs and versions

- Document `retention`, `prune()`, `endedAt` and `stats().pruned` in `docs/guides/deku-swarm/job-lifecycle.md` and `reference.md`, including that pruned jobs cannot be retried or looked up.
- Bump `deku-swarm` to its next minor version and the app (`source/`) with the matching patch bump, per `scripts/ci.sh cascade-bump-check`.

The registry is synchronous and single-threaded, so there is no race between pruning and a job finishing.

## Benefits

- Long-running hosts (Kerghan, navi with `keepAlive: true`) get bounded memory for terminal jobs without losing pending work.
- Fully backward compatible: no retention configured and no `prune()` call means today's behavior, and existing `stats()` fields keep their meaning.
