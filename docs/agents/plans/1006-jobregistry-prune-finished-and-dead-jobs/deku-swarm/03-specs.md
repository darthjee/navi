# Specs

Cover the new behaviour; follow existing spec conventions in `deku-swarm/spec/`.

- `IdentifyableCollection`: insertion order kept with integer-like ids (e.g. push `10`, then `2`, `list()` returns them in push order); plain-object and `Map` constructor inputs; existing behaviour unchanged.
- `Job`: `endedAt` defaults to `null`; mark sets it (with injected/mocked time); clear resets it.
- `JobRegistry` (new spec file `deku-swarm/spec/background/JobRegistry_prune_spec.js`, keeping `JobRegistry_spec.js` for the rest):
  - retention per status: cap enforced on `finish()` / exhausted `fail()`, oldest evicted, omitted status unbounded, `0` evicts on arrival, lazy trimming of oversized initial collections on next push.
  - `prune()`: `keep`, `olderThan` (mock `Date.now`), union of both, bare call clears selected statuses, `statuses` filter, return counts, jobs without `endedAt` skipped by `olderThan` only.
  - `enqueued`, `processing`, `failed`, `retryQueue` never affected.
  - `endedAt` set on finish / dead and reset by `retryJob()`.
  - `stats().pruned` grows with both mechanisms and resets on `clearQueues()`; existing `stats()` fields unchanged.
  - `jobById` / `retryJob` return `null` for pruned jobs.
  - every validation error (`prune()` and `build({ retention })`).

## Files to Change
- `deku-swarm/spec/collections/IdentifyableCollection_spec.js` — ordering and constructor input cases.
- `deku-swarm/spec/background/Job_spec.js` — `endedAt` cases.
- `deku-swarm/spec/background/JobRegistry_prune_spec.js` — new: retention / prune / stats / validation.
- `deku-swarm/spec/background/JobRegistry_spec.js` — `stats()` expectations now include `pruned`.
