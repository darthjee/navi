# Issue: deku-swarm: O(excess) retention eviction in JobRegistryInstance

## Description

Surfaced while enhancing #1015 (navi adopting `JobRegistry` retention), which documents moderate caps as a recommendation and leaves this optimization to deku-swarm. Requires a `deku-swarm` version bump (and the navi app cascade bump).

### In scope
- The count-only branch of `JobRegistryInstance#evict` (`keep` set, `olderThan` absent). It is shared by the hot path (`#enforceRetention`, run on every `finish`/`fail`→dead) and by manual `prune({ keep })`, so both benefit. Eviction must cost O(excess), which is 0 or 1 per push in steady state, instead of copying the whole collection.

### Out of scope
- The `olderThan`-only and union (`keep` + `olderThan`) branches of `#evict`. `prune` is called manually and rarely, so their O(n) scan stays as is.
- The unbounded `prune()` (evict all). It is O(n) by nature.
- `IdentifyableCollection#byIndex`, which also copies the list.
- Any navi code change beyond the cascade dependency/version bump. The only navi change is the docs-caveat removal listed under Documentation.

### Possible follow-up

Stop the `olderThan` scan early, since `endedAt` increases in insertion order. Not part of this issue.

## Problem

`JobRegistryInstance#evict` (deku-swarm, added in #1006) runs on every terminal transition when a `retention` cap is configured (`#enforceRetention` → `#evict(status, { keep })`). It starts with `collection.list()`, which copies the whole `IdentifyableCollection` `Map` into an array, then slices off the excess:

```
const jobs = collection.list();
...
if (keep !== undefined) jobs.slice(0, Math.max(0, jobs.length - keep)).forEach(job => doomed.add(job));
```

That makes every job completion / death O(keep), even when nothing is evicted. Small caps are negligible, but a large cap (e.g. `retention.finished: 1000000`) on a high-throughput run copies up to a million references per finished job, adding CPU and GC pressure.

## Expected Behavior

- When a `retention` cap is set, each `finish` or `fail`→dead costs O(excess) (0 or 1 removals in steady state), with no full-collection copy.
- `prune({ keep })` likewise removes only the excess, at O(excess).
- What callers see does not change: the same jobs are evicted (the oldest by insertion order), `stats().pruned` and `prune()` return values stay the same, and the `olderThan`/union/unbounded `prune` paths behave as before.

## Solution

`IdentifyableCollection`'s `#items` is a private field, and its only public readers (`list()`, `byIndex()`) copy the whole collection. Iterating "inline" in `#evict` is therefore impossible without new public API.

### Chosen: A. `IdentifyableCollection#removeOldest(n)`
- Takes the first `n` keys from `#items.keys()` (insertion order), then deletes them, so ids are collected before any deletion.
- Resets the `#size` cache.
- Returns the **number** of items removed. `n <= 0` returns 0 without iterating.
- `JobRegistryInstance#evict` uses it whenever `keep` is set and `olderThan` is absent: `excess = size - keep`, `removed = excess > 0 ? collection.removeOldest(excess) : 0`, then `#pruned[status] += removed`. The `olderThan` and union branches keep the current `list()`-based logic.

### Rejected
- **B. Generic iterator (`ids()` / `[Symbol.iterator]`)**: works, but spreads the eviction logic into the registry and exposes a broader surface than needed.
- **C. Fast path only in `#enforceRetention`**: leaves `prune({ keep })` slow, which contradicts the scope, and duplicates logic.
- **D. Ring buffer / deque instead of `Map`**: overkill. `Map` already gives insertion order plus lookup by id.
- **E. Batched or lazy eviction (evict only above `keep × 1.1`)**: changes semantics, since `stats()` would temporarily exceed `keep`.

### Edge cases

- **`excess <= 0`** (steady state at or under the cap): return 0 right away, with no iteration and no allocation.
- **`keep: 0`**: excess equals size, so everything is removed. That is O(size), which is unavoidable and matches current behavior.
- **`prune({ keep: small })` on a large collection**: removes many of the oldest jobs in one call, at O(excess). `#retention` is set only in the constructor, so this manual call is the only way to remove a large batch at once.
- **Re-pushing an existing id**: `Map.set` keeps the job's original position, which is what `list()` order gives today. No special handling.
- **Removing while iterating**: collect the first `excess` ids from `keys()` first, then remove them. Do not delete in the middle of iteration, even though the spec allows it.
- **`IdentifyableCollection` size cache**: removals must invalidate `#size`. Either go through `remove(id)`, or have any new helper reset it.
- **`#pruned` accounting**: add exactly the number of jobs actually removed, the same as today.

### Backward compatibility

- **No change callers can see.** The same jobs are evicted (the oldest by insertion order). `#pruned` / `stats().pruned`, `prune()`'s return values and the `retention` constructor contract stay the same. The change is internal and only affects performance.
- **Public surface.** `IdentifyableCollection` is exported from `deku-swarm/lib/index.js`, so a new helper on it (e.g. `removeOldest(n)`) adds public API but breaks nothing.
- **deku-swarm version.** `swarm-1.13.0` is already released, so changing `deku-swarm/lib` requires a bump through `scripts/bump_version.sh deku-swarm 1.14.0`. It is a **minor** bump because a public `removeOldest(n)` is added to `IdentifyableCollection` (see the chosen solution above).
- **navi cascade.** A deku-swarm bump requires a `navi-hey` bump. `source/package.json` is already `1.14.3`, past the last `1.14.2` tag, so the cascade check passes today. It needs another app bump only if 1.14.3 is released before this change.

### Testing strategy

The existing `spec/background/JobRegistry_prune_spec.js` specs (retention cap, `keep: 0`, dead cap, oversized initial collections, `prune` keep/olderThan/union, stats accumulation) must pass **unchanged**. They are the regression guard.

#### `spec/collections/IdentifyableCollection_spec.js`, `#removeOldest(n)`
- `n <= 0`: returns 0 and leaves the collection unchanged.
- `0 < n < size`: removes the first `n` in insertion order, keeps the rest in order (checked with `list()`), and returns `n`.
- `n >= size`: removes everything and returns the actual count (`size`, not `n`).
- Size cache: call `size()` before removing, then check it after, to catch a stale `#size`.
- Removed ids: `has` and `get` report them as gone.
- Re-pushing an existing id keeps its original position, so that item is removed first.

#### `spec/background/JobRegistry_prune_spec.js`
- With `retention` set, `spyOn(IdentifyableCollection.prototype, 'list').and.callThrough()`, finish and kill jobs past the cap, and expect `list` **not** to have been called. `finish`/`fail` don't call `list()` anywhere else, so this is reliable.
- `prune({ keep })` goes through `removeOldest` (spy), and `prune({ keep, olderThan })` does not (union path unchanged).
- `prune({ keep })` with `keep >= size` returns 0 and leaves `stats().pruned` unchanged.
- A bulk `prune({ keep: small })` adds exactly the removed count to `stats().pruned`.

No timing or benchmark specs, since they are flaky in CI. The `list`-not-called assertion is a deterministic stand-in for "O(excess)".

### Documentation

- **deku-swarm guides:** add `removeOldest(n)` to the `IdentifyableCollection` method table in `docs/guides/deku-swarm/collections.md` and to the public API in `docs/guides/deku-swarm/reference.md`.
- **navi guides:** remove the caveat *"Moderate caps are recommended (eviction has a cost, see #1022)."* from the `workers.retention.finished` row in `docs/guides/navi/configuration-schema.md` and `docs/guides/navi/prerequisites.md` (and from the `workers.retention.dead` row, if present), since the cost no longer grows with the cap.

## Benefits

- Removes CPU and GC pressure that grows with the cap on high-throughput runs, so large retention caps (e.g. `retention.finished: 1000000`) become practical.
- navi (#1015) can recommend retention caps without worrying about per-job cost.
- Adds a reusable, tested `IdentifyableCollection#removeOldest(n)` primitive.
