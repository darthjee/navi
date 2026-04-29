# Plan: Clear Jobs in Finished and Dead on Stop or Restart

## Overview

Extend `clearQueues()` in `JobRegistryInstance` to also reset the `finished` and `dead` queues, so that a stop or restart leaves the registry in a fully clean state.

## Context

When the engine is stopped or restarted, `JobRegistry.clearQueues()` is called to clean up stale work. Currently it only resets `enqueued`, `retryQueue`, and `failed` (to be confirmed by reading the code). The `finished` and `dead` queues are never cleared, causing stale job history to accumulate across runs and remain visible in the UI and API.

## Implementation Steps

### Step 1 — Verify current behaviour

Read `source/lib/background/JobRegistryInstance.js` to confirm exactly which queues `clearQueues()` currently resets, and how `finished` and `dead` are stored (plain arrays, `Collection` instances, etc.).

### Step 2 — Extend `clearQueues()`

Update `clearQueues()` in `JobRegistryInstance` to also clear `finished` and `dead`, following whatever pattern the existing queues use.

### Step 3 — Update tests

Add or update specs in `source/spec/lib/background/JobRegistryInstance_spec.js` (and `JobRegistry_spec.js` if a delegate test is needed) to assert that `finished` and `dead` are empty after `clearQueues()` is called.

## Files to Change

- `source/lib/background/JobRegistryInstance.js` — extend `clearQueues()` to reset `finished` and `dead`
- `source/spec/lib/background/JobRegistryInstance_spec.js` — add tests covering the new behaviour

## Notes

- The exact reset mechanism for `finished` and `dead` depends on their underlying type (array vs Collection); Step 1 must confirm this before writing the fix.
- `JobRegistry.clearQueues()` is a static delegate — no change should be needed there unless the signature changes.
