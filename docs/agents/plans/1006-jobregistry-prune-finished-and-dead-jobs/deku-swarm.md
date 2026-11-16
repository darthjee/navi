# deku-swarm Plan: JobRegistry: prune finished and dead jobs

Main plan: [plan.md](plan.md)

## Shared contracts

Implements every contract listed in [plan.md](plan.md#shared-contracts): `retention`, `prune()`, `Job#endedAt`, `stats().pruned`, validation errors, pruned-job lookups returning `null`, and the version bumps.

## Steps

- [01 — Map-backed IdentifyableCollection and Job#endedAt](deku-swarm/01-collection-and-endedat.md)
- [02 — Retention and prune in JobRegistry](deku-swarm/02-retention-and-prune.md)
- [03 — Specs](deku-swarm/03-specs.md)
- [04 — Bump versions](deku-swarm/04-bump-versions.md)

## CI Checks

- `deku-swarm`: `npm test` and `npm run lint` (plus jscpd duplication check) inside `deku-swarm/`
- root: `scripts/ci.sh cascade-bump-check` (deku-swarm change requires the app patch bump)

## Notes

- `IdentifyableCollection` is also used for `processing` and by `WorkersRegistry`; the `Map` switch must keep its public API and behaviour (`push`, `remove`, `get`, `has`, `findById`, `byIndex`, `list`, `size`, plain-object constructor input) so those callers are unaffected.
- #1005 (Engine status) also bumps deku-swarm and the app. Whichever merges second must re-bump to the next free versions.
- Keep the eviction helper single and private to avoid jscpd duplication between retention and `prune()`.
