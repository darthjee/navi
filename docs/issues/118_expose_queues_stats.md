# Issue: Expose Queue Stats

## Description

`JobRegistry` and `WorkersRegistry` should each expose a method that returns counts of their internal state, allowing callers to observe system throughput and health at a glance.

## Problem

- There is no way to query how many jobs are in each state (enqueued, processing, failed, finished, dead) without accessing internal data structures directly.
- There is no way to query how many workers are idle vs. busy without inspecting internals.

## Expected Behavior

- `JobRegistry` exposes a method (e.g. `stats()`) returning an object with counts for:
  - `enqueued` — jobs waiting to be processed
  - `processing` — jobs currently being executed (feature in progress)
  - `failed` — jobs that failed and were re-queued
  - `finished` — jobs completed successfully
  - `dead` — jobs that exhausted all retries
- `WorkersRegistry` exposes a method (e.g. `stats()`) returning an object with counts for:
  - `idle` — workers waiting for a job
  - `busy` — workers currently executing a job

## Solution

- Add a `stats()` method to `JobRegistry` that reads from its internal collections and returns the counts above.
- Add a `stats()` method to `WorkersRegistry` that reads from its internal collections and returns the counts above.
- Cover both methods with Jasmine specs.

## Benefits

- Enables monitoring and observability without exposing internal data structures.
- Provides a foundation for logging, dashboards, or health-check endpoints.

---
See issue for details: https://github.com/darthjee/navi/issues/118
