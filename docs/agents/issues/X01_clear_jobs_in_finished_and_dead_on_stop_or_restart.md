# Issue: Clear Jobs in Finished and Dead on Stop or Restart

## Description

When the engine is stopped or restarted via the API, the current `clearQueues()` operation clears some job queues (enqueued, processing, failed — to be confirmed), but does not clear the `finished` and `dead` queues. All five queues should be cleared on stop or restart.

## Problem

- `clearQueues()` in `JobRegistryInstance` does not clear `finished` and `dead`
- After a stop or restart, stale finished and dead jobs accumulate across runs
- The UI and API continue to expose outdated job history that is no longer meaningful

## Expected Behavior

- On engine stop or restart, all five queues are cleared: `enqueued`, `processing`, `failed`, `finished`, and `dead`

## Solution

- Verify which queues `clearQueues()` currently clears
- Extend `clearQueues()` (or introduce a separate method) in `JobRegistryInstance` to also reset `finished` and `dead`
- Ensure the behaviour is covered by tests

## Benefits

- Clean state after each stop/restart cycle
- Consistent job history visible in the UI
