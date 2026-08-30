# docs Plan: Crawler: define and implement EmitJob retry policy

Main plan: [plan.md](plan.md)

## Shared contracts

- Relies on `worker`'s exact `Job` constructor param names/defaults — verify against `worker.md`/`worker/01-job-constructor-params.md` before writing: `constructor({ id, maxRetries, cooldown } = {})`, `get maxRetries()` defaults to `3`, new `get cooldown()` defaults to `undefined`.

## Implementation Steps

### Step 1 — Document the new Job constructor params

Update the `deku-swarm` guide to describe the new optional `maxRetries`/`cooldown` constructor params, the unchanged `maxRetries` default of `3`, the new `cooldown` getter (and that it's `undefined` unless explicitly set), and that a subclass's own getter override still takes full precedence over a constructor-passed value.

### Step 2 — Update the retry-behavior reference table

Update the "Retry behavior" section/table to reflect that `maxRetries` can now be set per-instance via the constructor as well as via a subclass getter override, and add `cooldown` alongside it.

## Files to Change

- `docs/guides/deku-swarm/defining-jobs.md` — extend the existing "Retry behavior" section (constructor params, `cooldown` getter).
- `docs/guides/deku-swarm/reference.md` — update `Job`'s public API surface table.

## Notes

- `docs/agents/flow/failure-handling.md` (Navi-internal, not user-facing) is updated by `worker`, not here — it documents `JobRegistryInstance.fail()`'s own mechanics.
