# Docs Plan: deku-swarm: O(excess) retention eviction in JobRegistryInstance

Main plan: [plan.md](plan.md)

## Shared contracts

You **document** `IdentifyableCollection#removeOldest(n)` (produced by the deku-swarm agent, shipping in deku-swarm 1.14.0):

- `n` (number) → returns the `number` actually removed (`0` when `n <= 0`, else `min(n, size())`).
- Removes the oldest items (insertion order) without copying the collection.
- Method-table wording: *"`removeOldest(n)` — Removes up to `n` of the oldest items (insertion order) without copying the collection; returns how many were removed."*

## Implementation Steps

### Step 1 — Document removeOldest in the deku-swarm guides

- `docs/guides/deku-swarm/collections.md`: add a `removeOldest(n)` row to the `IdentifyableCollection` method table (after `remove(id)`), using the wording above. Optionally extend the code example with one `removeOldest` call.
- `docs/guides/deku-swarm/job-lifecycle.md`: in "Automatic retention", add one bullet saying enforcement removes only the excess oldest jobs, so its per-job cost does not grow with the cap.
- `docs/guides/deku-swarm/reference.md`: no change needed unless it lists collection methods individually. It currently points to `collections.md`.

### Step 2 — Drop the navi "moderate caps" caveat

In the `workers.retention.finished` row of both `docs/guides/navi/configuration-schema.md` (line ~118) and `docs/guides/navi/prerequisites.md` (line ~69), remove the sentence *"Moderate caps are recommended (eviction has a cost, see #1022)."* Keep the rest of the row. The `workers.retention.dead` rows don't contain the caveat, but check them anyway.

## Files to Change
- `docs/guides/deku-swarm/collections.md` — new `removeOldest(n)` row.
- `docs/guides/deku-swarm/job-lifecycle.md` — note on eviction cost.
- `docs/guides/navi/configuration-schema.md` — remove the caveat.
- `docs/guides/navi/prerequisites.md` — remove the caveat.

## Notes
- Docs-only. The guides describe deku-swarm 1.14.0 behavior, so they ship in the same PR as the code change.
