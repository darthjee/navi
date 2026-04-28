# Issue: Review Logs

## Description

The logs in `source/lib` are too verbose. Most messages are currently logged at `info` level when they should be at `debug`. The goal is to reduce noise in production while ensuring the most relevant request/response information is always visible.

## Problem

- Too many `info`-level log messages in `source/lib`, making logs noisy.
- It is unclear whether all critical request lifecycle events (request made, response received, match result) are being logged at all.

## Expected Behavior

- Only the following should be logged at `info` level:
  - A request is being made.
  - A response was received (including the actual HTTP status code).
- All other log messages in `source/lib` should be downgraded to `debug`.
- `error` and `warn` logs should remain unchanged.
- The following events must be explicitly logged (at the appropriate level):
  - A request is being made.
  - A response was received with its status code.
  - Whether the response was or was not a match.

## Current Logs Audit

| File | Line | Current Level | Message | New Level |
|------|------|---------------|---------|-----------|
| `models/ActionProcessingJob.js` | 50 | `info` | `ActionProcessingJob #<id> performing` | `debug` |
| `models/AssetDownloadJob.js` | 46 | `info` | `AssetDownloadJob #<id> performing` | `debug` |
| `models/AssetDownloadJob.js` | 52 | `error` | `AssetDownloadJob #<id> failed: <error>` | `error` (keep) |
| `models/HtmlParseJob.js` | 59 | `info` | `HtmlParseJob #<id> performing` | `debug` |
| `models/ResourceRequestAction.js` | 66 | `error` | `Skipping action: <error>` | `error` (keep) |
| `models/ResourceRequestJob.js` | 44 | `info` | `ResourceRequestJob #<id> performing` | `debug` |
| `models/ResourceRequestJob.js` | 50 | `error` | `Job #<id> failed: <error>` | `error` (keep) |
| `models/Worker.js` | 48 | `error` | `Error occurred while performing job: #<id> - <error>` | `error` (keep) |
| `server/WebServer.js` | 29 | `info` | `Listening to port <port>` | `info` (keep) |
| `services/Client.js` | 66 | `info` | `[Client:<name>] Requesting <url>` | `info` (keep) |
| `services/Client.js` | 83 | `info` | `[Client:<name>] Requesting <url>` | `info` (keep) |
| `services/Client.js` | 134 | `error` | `Request failed: <error>` | `error` (keep) |
| `services/ConfigLoader.js` | 69 | `error` | `Configuration file not found: <path>` | `error` (keep) |
| `services/Engine.js` | 36 | `debug` | `Promoting ready jobs and allocating...` | `debug` (keep) |
| `utils/EnvResolver.js` | 44 | `warn` | `Environment variable not defined: <var>` | `warn` (keep) |
| `utils/HtmlElementParser.js` | 31 | `warn` | `HtmlParser: element matched by "<selector>" is missing attribute "<attr>"` | `warn` (keep) |
| `utils/HtmlParser.js` | 35 | `warn` | `HtmlParser: selector "<selector>" matched zero elements` | `warn` (keep) |

## Missing Logs (to be added)

These events currently produce no log output and must be added at `info` level in `services/Client.js#requestUrl`:

| Event | Level | Suggested Message |
|-------|-------|-------------------|
| Response received | `info` | `[Client:<name>] Response <url> → <status>` |
| Response matched | `info` | `[Client:<name>] Response <url> matched (expected <status>)` |
| Response not matched | `info` | `[Client:<name>] Response <url> did not match (got <status>, expected <status>)` |

## Solution

- Downgrade `info` → `debug` for all job "performing" messages (4 calls across `ActionProcessingJob`, `AssetDownloadJob`, `HtmlParseJob`, `ResourceRequestJob`).
- Add the three missing lifecycle log calls in `Client.js#requestUrl`.
- Leave all `warn` and `error` calls as-is.

## Benefits

- Cleaner production logs focused on actionable request/response information.
- Debug-level verbosity still available when `LOG_LEVEL=debug` is set.
- Consistent and complete logging of the request lifecycle.

---
See issue for details: https://github.com/darthjee/navi/issues/402
