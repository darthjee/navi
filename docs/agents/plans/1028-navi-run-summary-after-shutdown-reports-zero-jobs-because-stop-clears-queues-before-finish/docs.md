# Docs Plan: Navi: run summary after shutdown reports zero jobs because stop() clears queues before finish

Main plan: [plan.md](plan.md)

## Shared contracts

Document the behavioral contract from [plan.md](plan.md#shared-contracts): a shutdown of a running engine (`PATCH /engine/shutdown`, the UI button, or `web.idle_timeout`) still evaluates `failure.threshold` against the jobs processed, so it can exit non-zero.

## Implementation Steps

### Step 1 — Note that failure.threshold applies on auto-shutdown

Append one sentence to the `web.idle_timeout` row in `docs/guides/navi/configuration-schema.md`, e.g. "The final run summary and `failure.threshold` check still apply on auto-shutdown, so it exits non-zero when the dead-job ratio exceeds the threshold." Add the equivalent short note to the `IDLE_TIMEOUT` row in `docs/guides/navi/reference.md`. (`prerequisites.md` has no `idle_timeout` row — leave it.)

## Files to Change

- `docs/guides/navi/configuration-schema.md` — `web.idle_timeout` row.
- `docs/guides/navi/reference.md` — `IDLE_TIMEOUT` row.

## Notes

- No CHANGELOG exists; the release note lives in the PR description's **Behavior change** paragraph (see plan.md), not in docs.
