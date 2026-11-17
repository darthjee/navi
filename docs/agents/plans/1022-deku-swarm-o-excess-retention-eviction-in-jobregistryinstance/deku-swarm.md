# Deku-swarm Plan: deku-swarm: O(excess) retention eviction in JobRegistryInstance

Main plan: [plan.md](plan.md)

## Shared contracts

You **produce** `IdentifyableCollection#removeOldest(n)`:

- `n` (number) → returns the `number` actually removed (`0` when `n <= 0`, else `min(n, size())`).
- Removes the first `n` entries in insertion order. Ids are collected from `#items.keys()` before any deletion. Resets the `#size` cache. Never copies the collection.
- Ships in deku-swarm **1.14.0**. The docs agent documents it with that exact signature and return value.

## Steps

- [01 — Add IdentifyableCollection#removeOldest](deku-swarm/01-add-remove-oldest.md)
- [02 — Use removeOldest in JobRegistryInstance#evict](deku-swarm/02-evict-count-path.md)
- [03 — Bump deku-swarm to 1.14.0](deku-swarm/03-bump-version.md)

## CI Checks

- `deku-swarm`: `cd deku-swarm && yarn test` (Jasmine + c8 coverage) and `yarn lint`
- `deku-swarm`: `yarn report` (jscpd duplication)
- Repo root: the cascade-bump check (`scripts/ci.sh cascade-bump-check`) must pass after the bump

## Notes

- Existing `spec/background/JobRegistry_prune_spec.js` specs must pass **unchanged**. They are the regression guard for eviction order, `keep: 0`, oversized initial collections and `stats().pruned`.
- Out of scope: the `olderThan`-only and union branches of `#evict` (keep their `list()` scan), the unbounded `prune()`, and `byIndex`'s copy.
- No timing or benchmark specs. The "`list` not called" spy assertion is the deterministic stand-in for O(excess).
