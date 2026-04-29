# Plan: Refactor PromiseAggregator to Wait for New Promises

## Overview

Refactor `PromiseAggregator.wait()` from a single `Promise.allSettled` call into a loop that continuously drains settled promises until the internal list is empty, ensuring promises added mid-wait are not missed.

## Context

The current implementation captures the promise list once at call time. Any promise pushed after `wait()` starts is silently ignored, which can cause the application to exit before all work is done. The fix is a loop that re-evaluates the list after each iteration.

## Implementation Steps

### Step 1 — Refactor `wait()` into a draining loop

Replace the current single-shot `Promise.allSettled` call with a `while` loop:

1. While there are promises in the internal array:
   - Snapshot the current list
   - Await `Promise.allSettled` on the snapshot
   - Remove the settled promises from the internal array (promises added during the await remain)
   - If any settled result is rejected, raise its reason
2. When the array is empty, return normally

### Step 2 — Update the spec

Update `source/spec/lib/utils/PromiseAggregator_spec.js` to cover:
- The existing happy-path and rejection cases still pass
- A new case: a promise added after `wait()` starts is still awaited
- A new case: a rejection in a later-added promise is still raised

## Files to Change

- `source/lib/utils/PromiseAggregator.js` — refactor `wait()` method
- `source/spec/lib/utils/PromiseAggregator_spec.js` — add specs for mid-wait additions

## Notes

- This is a targeted change — no other files should need to change.
- The draining approach is safe: promises added during an `await` stay in the array and are picked up on the next loop iteration.
- Rejection handling should still raise on the first rejection found, consistent with current behavior.
