# Issue: Create Stats Endpoint

## Description

Add an Express-based web server to the main Navi application that exposes a monitoring interface. For now, a single `/stats.json` endpoint is required, returning the current stats for jobs and workers.

## Problem

- There is no way to observe the internal state of a running Navi instance from the outside.
- Operators have no visibility into job throughput or worker utilization at runtime.

## Expected Behavior

- Navi starts an Express HTTP listener alongside its normal operation.
- `GET /stats.json` returns a JSON response with:
  - Job stats (enqueued, processing, failed, finished, dead) from `JobRegistry#stats()`
  - Worker stats (idle, busy) from `WorkersRegistry#stats()`
- Example response:
  ```json
  {
    "jobs": {
      "enqueued": 3,
      "processing": 1,
      "failed": 0,
      "finished": 42,
      "dead": 0
    },
    "workers": {
      "idle": 4,
      "busy": 1
    }
  }
  ```

## Solution

- Add Express as a dependency.
- Create a server module (e.g. `source/lib/server/`) that sets up the Express app and defines the `/stats.json` route.
- The server receives references to `JobRegistry` and `WorkersRegistry` so it can call their `stats()` methods.
- Extend the existing YAML configuration file (the same file used to configure workers) with an optional `web:` key:
  ```yaml
  web:
    port: 3000
  ```
- If the `web:` key is absent from the configuration file, the web server is not initialized and Navi runs as workers-only.
- If the `web:` key is present, start the Express server on the configured port as part of Navi's initialization flow.

## Benefits

- Enables real-time monitoring of a running Navi instance without modifying source code.
- Provides a foundation for future monitoring endpoints (e.g. health checks, logs).

## Dependencies

- Depends on issue #118 (Expose Queue Stats) for `JobRegistry#stats()` and `WorkersRegistry#stats()`.

---
See issue for details: https://github.com/darthjee/navi/issues/119
