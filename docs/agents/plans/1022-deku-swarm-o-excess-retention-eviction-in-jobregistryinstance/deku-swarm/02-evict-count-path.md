# Use removeOldest in JobRegistryInstance#evict

In `deku-swarm/lib/background/JobRegistryInstance.js`, change `#evict(status, { keep, olderThan })` so that the **count-only** case (`keep !== undefined && olderThan === undefined`) never calls `collection.list()`:

```js
if (keep !== undefined && olderThan === undefined) {
  const removed = collection.removeOldest(collection.size() - keep);
  this.#pruned[status] += removed;
  return removed;
}
```

(`removeOldest` already returns 0 for a non-positive argument, so `excess <= 0` costs nothing.) The unbounded, `olderThan`-only and union (`keep` + `olderThan`) paths keep the current `list()` / `Set`-based logic unchanged. Update the JSDoc of `#evict` to mention the fast count-only path. `#enforceRetention` needs no change, because it already calls `#evict(status, { keep })`.

If the method gets too long or complex for lint, extract the existing list-based logic into a private helper (e.g. `#evictByScan`) rather than duplicating it.

Specs in `deku-swarm/spec/background/JobRegistry_prune_spec.js` (the file already imports `IdentifyableCollection`):

- **Retention never copies:** with `retention: { finished: 2, dead: 2 }`, `spyOn(IdentifyableCollection.prototype, 'list').and.callThrough()` *after* building, then finish and kill several jobs past the cap. Expect `list` **not** to have been called, and expect the oldest jobs to have been evicted.
- **`prune({ keep })` uses `removeOldest`:** spy on `IdentifyableCollection.prototype.removeOldest` (callThrough) and expect it to be called. With `prune({ keep, olderThan })`, expect it **not** to be called and the union result to stay as before.
- **`prune({ keep })` with `keep >= size`:** returns `0` per status and leaves `stats().pruned` unchanged.
- **Bulk `prune({ keep: small })`:** `stats().pruned` increases by exactly the number removed, and the most recent `keep` jobs remain.

All existing specs in the file must keep passing unchanged.

## Files to Change
- `deku-swarm/lib/background/JobRegistryInstance.js` — count-only fast path in `#evict`.
- `deku-swarm/spec/background/JobRegistry_prune_spec.js` — new specs.
