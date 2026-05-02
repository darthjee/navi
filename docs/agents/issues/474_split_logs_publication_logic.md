# Issue: Split Logs Publication Logic

## Description

Currently, all logs are published through `Logger`, which holds a `ConsoleLogger` and a `BufferLogger`. `LogRegistry` holds the same `BufferLogger` instance, making all logs accessible through the API. The goal is to split this so that only specific logs are published to the API (registry), while others go only to the console.

## Problem

- All logs are indiscriminately published to both console and the API (via `BufferLogger` shared between `Logger` and `LogRegistry`).
- There is no way to control which logs should be accessible through the API and which should only appear in the console.
- `LogRegistry` does not conform to the same method API as `Logger`, preventing it from being used interchangeably.

## Expected Behavior

- `Logger` holds only a `ConsoleLogger` (no `BufferLogger`).
- `LogRegistry` conforms to the same method API as `Logger`.
- `LogRegistry` internally holds a logger group composed of `BufferLogger` and `Logger` itself, so any log sent to the registry also appears in the console.
- Each log call site can choose whether to publish via `Logger` (console only) or via `LogRegistry` (console + API buffer).
- All existing log call sites are reviewed and assigned to the appropriate publisher.

## Solution

- Remove `BufferLogger` from `Logger`; keep only `ConsoleLogger` there.
- Make `LogRegistry` implement the same interface/API as `Logger`.
- Add a logger group inside `LogRegistry` that delegates to both `BufferLogger` and `Logger`, so registry logs also reach the console.
- Audit all log call sites and decide which should go through `Logger` and which through `LogRegistry`.

## Log Call Site Audit

### → `LogRegistry` (console + API buffer)

These are meaningful to a user monitoring the application via the UI:

| File | Level | Message |
|------|-------|---------|
| `services/Client.js:63,80` | `info` | Requesting URL |
| `services/Client.js:116` | `info` | Response status |
| `services/Client.js:119,123` | `info` | match / no-match result |
| `services/Client.js:135` | `error` | Request failed |
| `background/Worker.js:48` | `error` | Error performing job |
| `jobs/AssetDownloadJob.js:52` | `error` | Job failed |
| `jobs/ResourceRequestJob.js:51` | `error` | Job failed |
| `models/ResourceRequestAction.js:69` | `error` | Skipping action |
| `services/FailureChecker.js:73` | `error` | Failure threshold exceeded |
| `utils/HtmlParser.js:35` | `warn` | Selector matched zero elements |
| `utils/HtmlElementParser.js:31` | `warn` | Missing attribute |

### → `Logger` only (console only)

Internal or infrastructure noise not useful in the UI:

| File | Level | Message | Reason |
|------|-------|---------|--------|
| `jobs/ActionProcessingJob.js:50` | `debug` | ActionProcessingJob performing | Per-tick lifecycle noise |
| `jobs/AssetDownloadJob.js:46` | `debug` | AssetDownloadJob performing | Per-tick lifecycle noise |
| `jobs/HtmlParseJob.js:59` | `debug` | HtmlParseJob performing | Per-tick lifecycle noise |
| `jobs/ResourceRequestJob.js:45` | `debug` | ResourceRequestJob performing | Per-tick lifecycle noise |
| `services/Engine.js:71` | `debug` | Promoting ready jobs | Engine internal loop noise |
| `server/RouteRegister.js:32,51,82` | `debug` | HTTP method/path/status | Web server request noise |
| `server/WebServer.js:32` | `info` | Listening to port | Boot message, one-time |
| `services/ConfigLoader.js:70` | `error` | Config file not found | Happens before registry exists |
| `utils/EnvResolver.js:46,66` | `warn` | Env var not defined | Config-time, before registry |

## Benefits

- Cleaner separation of concerns between console logging and API-accessible logging.
- Reduces noise in the API log buffer by limiting it to relevant log entries.
- Allows future fine-grained control over log visibility per call site.

---
See issue for details: https://github.com/darthjee/navi/issues/474
