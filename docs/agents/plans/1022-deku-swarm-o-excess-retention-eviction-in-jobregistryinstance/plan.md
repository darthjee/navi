# Plan: deku-swarm: O(excess) retention eviction in JobRegistryInstance

Issue: [1022-deku-swarm-o-excess-retention-eviction-in-jobregistryinstance.md](../../issues/1022-deku-swarm-o-excess-retention-eviction-in-jobregistryinstance.md)

## Overview

Add a public `IdentifyableCollection#removeOldest(n)` that removes the first `n` items in insertion order without copying the collection. Route `JobRegistryInstance#evict`'s count-only branch (`keep` set, `olderThan` absent) through it, so retention enforcement and `prune({ keep })` cost O(excess) instead of O(size). Bump deku-swarm to 1.14.0 (minor, new public API), then document the new method and drop the navi "moderate caps" caveat.

## Agents involved

- [deku-swarm](deku-swarm.md)
- [docs](docs.md)

## Shared contracts

`IdentifyableCollection#removeOldest(n)` (public, exported through `deku-swarm`'s `lib/index.js` via `IdentifyableCollection`):

- **Parameter:** `n` (number), how many of the oldest items (insertion order) to remove.
- **Returns:** `number`, how many items were actually removed: `0` when `n <= 0`, `min(n, size())` otherwise.
- **Behavior:** removes the first `n` entries in insertion order. Re-pushing an existing id does not move it, because `Map.set` keeps the original position. Ids are collected before deletion. `size()` reflects the removal afterwards. The collection is never copied.
- **Version:** ships in deku-swarm **1.14.0**.

Documentation wording for the method table: *"`removeOldest(n)` — Removes up to `n` of the oldest items (insertion order) without copying the collection; returns how many were removed."*
