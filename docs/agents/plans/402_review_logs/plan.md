# Plan: Review Logs

## Overview

Reduce log verbosity in `source/lib` by downgrading non-essential `info` messages to `debug`,
and add the three missing request lifecycle log calls in `Client.js`.

## Context

Most job "performing" messages are logged at `info` level, creating noise in production.
Only two types of events should remain at `info`: a request being made, and a response being
received (with status code and match result). The `Client.js#requestUrl` private method
currently logs neither the response nor the match outcome.

## Implementation Steps

### Step 1 — Downgrade job "performing" logs from `info` to `debug`

Change `Logger.info(...)` to `Logger.debug(...)` in the four job model files:

- `source/lib/models/ActionProcessingJob.js:50`
- `source/lib/models/AssetDownloadJob.js:46`
- `source/lib/models/HtmlParseJob.js:59`
- `source/lib/models/ResourceRequestJob.js:44`

Each change is a one-liner. Update the corresponding spec expectations where the test asserts
that a log was produced at `info` level.

### Step 2 — Add response lifecycle logs in `Client.js`

In `source/lib/services/Client.js`, inside the private `#requestUrl` method (lines 110–124),
add three new `info`-level log calls:

1. **After `axios.get` returns** — log the received status code:
   ```
   [Client:<name>] Response <url> → <status>
   ```

2. **When the status matches** (before `return response`) — log the match:
   ```
   [Client:<name>] <url> matched (expected <status>)
   ```

3. **When the status does not match** (inside the `if` branch, before `throw`) — log the mismatch:
   ```
   [Client:<name>] <url> did not match (got <actual>, expected <expected>)
   ```

Because `#requestUrl` is private and does not have access to `this.name` directly, verify
that `this` is in scope (it is — the method is a private instance method). Use template
literals consistent with the existing log format.

Update `Client_spec.js` to assert the new log messages are produced at the correct level
under both the match and no-match scenarios.

### Step 3 — Update specs

For each changed file, update the corresponding spec to reflect the new log level or the
new log messages:

- `source/spec/lib/models/ActionProcessingJob_spec.js`
- `source/spec/lib/models/AssetDownloadJob_spec.js`
- `source/spec/lib/models/HtmlParseJob_spec.js`
- `source/spec/lib/models/ResourceRequestJob_spec.js`
- `source/spec/lib/services/Client_spec.js`

## Files to Change

- `source/lib/models/ActionProcessingJob.js` — `info` → `debug` on line 50
- `source/lib/models/AssetDownloadJob.js` — `info` → `debug` on line 46
- `source/lib/models/HtmlParseJob.js` — `info` → `debug` on line 59
- `source/lib/models/ResourceRequestJob.js` — `info` → `debug` on line 44
- `source/lib/services/Client.js` — add 3 `info` log calls inside `#requestUrl`
- `source/spec/lib/models/ActionProcessingJob_spec.js` — update log level expectation
- `source/spec/lib/models/AssetDownloadJob_spec.js` — update log level expectation
- `source/spec/lib/models/HtmlParseJob_spec.js` — update log level expectation
- `source/spec/lib/models/ResourceRequestJob_spec.js` — update log level expectation
- `source/spec/lib/services/Client_spec.js` — add/update log message expectations

## CI Checks

Before opening a PR, run the following checks for the folders being modified:

- `source/`: `docker-compose run --rm navi_app yarn test` (CircleCI job: `source_tests`)
- `source/`: `docker-compose run --rm navi_app yarn lint` (CircleCI job: `source_lint`)

## Notes

- `warn` and `error` log calls are not touched.
- `WebServer.js:29` (`Listening to port`) stays at `info` — it is a startup event, not a job lifecycle message.
- The three new log calls in `Client.js` must use the same `[Client:<name>]` prefix already used by the existing request log, for consistency.
- `#requestUrl` is called by both `#request` (via `perform`) and directly by `performUrl`. Both paths benefit from the new logs with no extra changes needed.
