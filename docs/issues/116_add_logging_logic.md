# Issue: Add Logging Logic

## Description
Add a logging system to the **main Navi application** (under the `source/` directory) that supports configurable log levels via an environment variable. The logger should accept log calls with an associated level, and only output messages whose level is at or above the configured threshold. This change does **not** affect the dev-app.

## Problem
- There is no structured logging system in the codebase.
- Log verbosity cannot be controlled without changing source code.
- There is no way to suppress or enable logs selectively based on severity.

## Expected Behavior
- A `LOG_LEVEL` environment variable controls which log messages are displayed.
- The logger accepts a log call with a specified level (e.g., `debug`, `info`, `warn`, `error`).
- Messages below the configured `LOG_LEVEL` threshold are silently ignored.
- Messages at or above the threshold are printed to output.

## Solution
- Create a `Logger` class (or module) inside `source/` that reads `LOG_LEVEL` from the environment at startup.
- Expose methods (or a single method with a `level` parameter) to submit log messages.
- Implement level comparison so that only messages meeting the threshold are emitted.
- Define a sensible default level (e.g., `info`) when `LOG_LEVEL` is not set.
- No changes to the dev-app (`dev/` or `new-dev/`) are required or expected.

## Benefits
- Operators can control log verbosity without modifying source code.
- Debug logs can be enabled in development and suppressed in production.
- Provides a foundation for consistent, structured logging across the application.

---
See issue for details: https://github.com/darthjee/navi/issues/116
