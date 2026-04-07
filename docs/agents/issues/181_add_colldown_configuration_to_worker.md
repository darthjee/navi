# Issue: Add Cooldown Configuration to Worker

## Description

Currently, when a job fails it is placed in the failed queue and waits for a
hardcoded cooldown period before being moved to the retry queue. This cooldown
should be configurable via the YAML configuration file, following the same pattern
as `workers.quantity`.

## Problem

- The retry cooldown duration is hardcoded and cannot be adjusted per environment or use case.

## Expected Behavior

- The YAML configuration supports an optional `retry_cooldown` key under `workers`.
- When `workers.retry_cooldown` is provided, that value (in milliseconds) is used as the cooldown before a failed job is re-queued.
- When `workers.retry_cooldown` is omitted, the default of 2000 milliseconds applies.

## Solution

- Add an optional `retry_cooldown` field to the `WorkersConfig` model.
- Apply the configured value (or the 2000 ms default) when scheduling failed jobs for retry.
- Update fixtures and tests to cover both the explicit and default cases.
- Update agent documentation to reflect the new configuration key.
- Update `README.md` and the Docker Hub description to document `workers.retry_cooldown`.

## Benefits

- Allows tuning retry behaviour per environment without modifying source code.
- Consistent configuration pattern with the existing `workers.quantity` key.

---
See issue for details: https://github.com/darthjee/navi/issues/181
