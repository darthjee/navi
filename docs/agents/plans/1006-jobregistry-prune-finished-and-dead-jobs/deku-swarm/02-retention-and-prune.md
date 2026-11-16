# Retention and prune in JobRegistry

- `JobRegistryInstance` constructor: new `retention = {}` option, validated (non-negative integers, only `finished` / `dead` keys) and stored; private counters `#prunedFinished = 0`, `#prunedDead = 0`.
- `finish(job)`: `job.markEnded()` before pushing to `finished`, then enforce `retention.finished`.
- `fail(job)`: on an exhausted job, `job.markEnded()` before pushing to `dead`, then enforce `retention.dead`.
- `retryJob(id)`: when moving a dead job to the retry queue, `job.clearEnded()`.
- Private eviction helper (one implementation, used by retention and `prune()`): given a status, a `keep` limit and/or an `olderThan` cutoff, remove the oldest jobs over the limit plus jobs with non-null `endedAt` older than the cutoff (union); with neither, remove all; increment the matching pruned counter; return the removed count.
- `prune({ statuses = ['finished', 'dead'], keep, olderThan } = {})`: validate (statuses must be `finished`/`dead`; `keep` non-negative integer; `olderThan` non-negative number), run the helper per selected status, return `{ finished, dead }`.
- `clearQueues()`: also reset both pruned counters.
- `stats()`: add `pruned: { finished: this.#prunedFinished, dead: this.#prunedDead }`.
- `JobRegistry` facade: add `static prune(options)`; update JSDoc of `build` / `ensureBuild` / `stats` for `retention` and `pruned`.

## Files to Change
- `deku-swarm/lib/background/JobRegistryInstance.js` — retention, eviction helper, `prune()`, counters, stats.
- `deku-swarm/lib/background/JobRegistry.js` — `prune` facade, JSDoc.
