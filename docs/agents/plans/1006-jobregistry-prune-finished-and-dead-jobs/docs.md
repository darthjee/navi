# docs Plan: JobRegistry: prune finished and dead jobs

Main plan: [plan.md](plan.md)

## Shared contracts

Documents the contracts in [plan.md](plan.md#shared-contracts) exactly as specified: `retention`, `prune()` (options, defaults, union semantics, bare call, return value, validation), `Job#endedAt`, `stats().pruned`, and that pruned jobs can no longer be looked up or retried.

## Implementation Steps

### Step 1 — Job lifecycle guide
In `docs/guides/deku-swarm/job-lifecycle.md`, add a section on pruning terminal jobs: why `finished` / `dead` grow in long-lived processes, configuring `JobRegistry.build({ retention })`, calling `JobRegistry.prune(...)` (with a short example, e.g. a periodic `prune({ olderThan: 3_600_000 })`), how `endedAt` is set/reset, that pending collections are never touched, how `stats().pruned` relates to `finished` / `dead` / `total`, and that pruned jobs return `null` from `jobById` / `retryJob`. Add `prune` to the "`JobRegistry` methods" list.

### Step 2 — Reference
In `docs/guides/deku-swarm/reference.md`, document `Job#endedAt` under `Job`, and `build({ retention })`, `prune(options)` and the `stats()` `pruned` field under `JobRegistry`.

## Files to Change
- `docs/guides/deku-swarm/job-lifecycle.md` — pruning section, methods list.
- `docs/guides/deku-swarm/reference.md` — `Job#endedAt`, `JobRegistry` retention / prune / stats.

## Notes
- Do not document navi `source/` configuration for retention — that is #1015.
