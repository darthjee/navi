# Issue: Keep Engine Alive

## Description

Currently, when a stop is triggered through the API, the Engine is killed and a new one is created on the next start. This needs to change: the Engine lifecycle should be driven by a promise, and its behavior should differ based on whether the web UI is running or not.

## Problem

- The Engine is killed on API stop and recreated on start, which is fragile and prevents future features (e.g. retrying dead jobs).
- When the web UI is running, the Engine is killed when all jobs are processed, even though it should remain alive waiting for new work.
- There is no distinction between CI mode (no web) and web mode regarding Engine lifecycle.

## Expected Behavior

- **Without web UI (CI mode):** the Engine finishes its process as soon as there are no more jobs in the queue.
- **With web UI:** the Engine is never killed on stop (only on shutdown); it also keeps running when all jobs are processed, continuously checking for new jobs.
- The Engine lifecycle is driven by a promise: the Engine keeps running as long as its promise is active.
  - In CI mode: the promise resolves when the job queue is empty.
  - In web mode: the promise can only be resolved by an explicit API shutdown request.

## Solution

- Change how application promises and the Engine loop work.
- The Engine loop keeps running while its promise is active.
- In CI mode: the promise completes when the queue is empty.
- In web mode: the promise is only resolved by the shutdown API endpoint.
- Remove the pattern of killing and recreating the Engine on stop/start in web mode.

## Benefits

- More robust Engine lifecycle management.
- Enables future features such as retrying dead jobs via the API.
- Clear separation between CI and web server operation modes.

---
See issue for details: https://github.com/darthjee/navi/issues/460
