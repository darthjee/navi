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

## Benefits

- Cleaner separation of concerns between console logging and API-accessible logging.
- Reduces noise in the API log buffer by limiting it to relevant log entries.
- Allows future fine-grained control over log visibility per call site.

---
See issue for details: https://github.com/darthjee/navi/issues/474
